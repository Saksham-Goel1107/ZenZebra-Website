# -*- coding: utf-8 -*-
"""
ZenZebra Analytics Engine — Google Sheets Cron Module
======================================================
Pulls sales, stock, and dead stock data directly from Google Sheets
using a service-account credential file (service.json).

Flow:
  1. Authenticate with Google using the service account
  2. Fetch each sheet as a pandas DataFrame
  3. Upload raw data (JSON + Excel snapshots) to Appwrite storage
  4. Upload raw snapshots to storage (file IDs are embedded into the
      analytics_results document so the API can list runs from that collection)
  5. Run ZenZebraAnalytics on the fetched data
  6. Upload the resulting analysis JSON to Appwrite storage
  7. Write an analytics_results document (same as the manual Excel flow)

Environment variables consumed (see .env.example):
  GOOGLE_SERVICE_ACCOUNT_PATH   – path to service.json  (default: /app/service.json)
  GOOGLE_SHEETS_SALES_ID        – Google Sheet ID for sales data
  GOOGLE_SHEETS_STOCK_ID        – Google Sheet ID for stock data
  GOOGLE_SHEETS_DEAD_STOCK_ID   – Google Sheet ID for dead stock (optional)
  GOOGLE_SHEETS_SALES_RANGE     – worksheet name for sales     (default: Sheet1)
  GOOGLE_SHEETS_STOCK_RANGE     – worksheet name for stock     (default: Sheet1)
  GOOGLE_SHEETS_DEAD_STOCK_RANGE– worksheet name for dead stock (default: Sheet1)
    NOTE: Raw snapshot files are uploaded to Appwrite storage; their file IDs
    are embedded into the analytics_results document so no separate cron_runs
    collection is required.
  …plus all standard APPWRITE_* vars
"""

import io
import json
import logging
import os
import traceback
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

import gspread
import pandas as pd
from appwrite.client import Client
from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials

from zenzebra_analytics import ZenZebraAnalytics

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Google Sheets OAuth scopes — read-only is sufficient
# ---------------------------------------------------------------------------
_GSHEETS_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

# ---------------------------------------------------------------------------
# Environment helpers
# ---------------------------------------------------------------------------
APPWRITE_ENDPOINT = os.getenv("NEXT_PUBLIC_APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
APPWRITE_PROJECT_ID = os.getenv("NEXT_PUBLIC_APPWRITE_PROJECT_ID")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")
APPWRITE_DATABASE_ID = os.getenv("NEXT_PUBLIC_APPWRITE_DATABASE_ID")
APPWRITE_ANALYTICS_COLLECTION_ID = os.getenv(
    "APPWRITE_ANALYTICS_COLLECTION_ID", "analytics_results"
)
APPWRITE_BUCKET_ID = os.getenv("NEXT_PUBLIC_APPWRITE_BUCKET_ID")

GOOGLE_SERVICE_ACCOUNT_PATH = os.getenv("GOOGLE_SERVICE_ACCOUNT_PATH", "/app/service.json")

SHEETS_SALES_ID = os.getenv("GOOGLE_SHEETS_SALES_ID", "")
SHEETS_STOCK_ID = os.getenv("GOOGLE_SHEETS_STOCK_ID", "")
SHEETS_DEAD_STOCK_ID = os.getenv("GOOGLE_SHEETS_DEAD_STOCK_ID", "")

SHEETS_SALES_RANGE = os.getenv("GOOGLE_SHEETS_SALES_RANGE", "Sheet1")
SHEETS_STOCK_RANGE = os.getenv("GOOGLE_SHEETS_STOCK_RANGE", "Sheet1")
SHEETS_DEAD_STOCK_RANGE = os.getenv("GOOGLE_SHEETS_DEAD_STOCK_RANGE", "Sheet1")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _make_appwrite_client() -> Tuple[Storage, Databases]:
    """Return (Storage, Databases) for the configured Appwrite project."""
    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT_ID)
    client.set_key(APPWRITE_API_KEY)
    return Storage(client), Databases(client)


def _make_gspread_client() -> gspread.Client:
    """Authenticate and return a gspread client using the service account."""
    sa_path = GOOGLE_SERVICE_ACCOUNT_PATH
    # Prefer an explicit file path mounted into the container (recommended).
    # In production the container should mount the service.json at the path
    # declared in GOOGLE_SERVICE_ACCOUNT_PATH (default: /app/service.json).
    if not sa_path or not os.path.exists(sa_path):
        raise FileNotFoundError(
            f"Google service-account file not found at '{sa_path}'. "
            "Ensure the service account JSON is mounted and GOOGLE_SERVICE_ACCOUNT_PATH is set."
        )

    creds = Credentials.from_service_account_file(sa_path, scopes=_GSHEETS_SCOPES)
    return gspread.authorize(creds)


def _fetch_sheet_as_dataframe(
    gc: gspread.Client, sheet_id: str, worksheet_name: str
) -> pd.DataFrame:
    """
    Open a Google Spreadsheet by key and return the named worksheet as a
    pandas DataFrame.  Falls back to the first sheet if the named worksheet
    is not found.
    """
    spreadsheet = gc.open_by_key(sheet_id)

    try:
        worksheet = spreadsheet.worksheet(worksheet_name)
        logger.debug(f"[CRON] Opened worksheet '{worksheet_name}' in sheet {sheet_id}")
    except gspread.WorksheetNotFound:
        logger.warning(
            f"[CRON] Worksheet '{worksheet_name}' not found in sheet {sheet_id}; "
            "falling back to the first sheet."
        )
        worksheet = spreadsheet.sheet1

    all_values = worksheet.get_all_values()

    if not all_values:
        raise ValueError(f"Google Sheet '{sheet_id}' / worksheet '{worksheet_name}' is empty.")
    if len(all_values) < 2:
        raise ValueError(
            f"Google Sheet '{sheet_id}' has only a header row — no data to process."
        )

    headers = all_values[0]
    rows = all_values[1:]

    # Deduplicate column names (gspread returns raw header strings)
    seen: Dict[str, int] = {}
    clean_headers = []
    for h in headers:
        clean_h = h.strip() if h.strip() else "_empty_"
        if clean_h in seen:
            seen[clean_h] += 1
            clean_h = f"{clean_h}_{seen[clean_h]}"
        else:
            seen[clean_h] = 0
        clean_headers.append(clean_h)

    df = pd.DataFrame(rows, columns=clean_headers)

    # Attempt numeric coercion column-by-column
    for col in df.columns:
        converted = pd.to_numeric(df[col], errors="coerce")
        # Only replace if at least 50 % of non-empty values are numeric
        non_empty = df[col].replace("", pd.NA).dropna()
        if len(non_empty) > 0 and converted.notna().sum() / len(non_empty) >= 0.5:
            df[col] = converted

    return df


def _dataframe_to_excel_bytes(df: pd.DataFrame) -> bytes:
    """Serialise a DataFrame to an in-memory Excel (.xlsx) byte string."""
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Sheet1")
    return buf.getvalue()


def _upload_raw_snapshot(
    storage: Storage,
    df: pd.DataFrame,
    sheet_type: str,
    sheet_id: str,
    run_id: str,
    fetched_at: str,
) -> Dict[str, Optional[str]]:
    """
    Upload two artefacts for one sheet:
      • An Excel file  → for download / re-processing
      • A JSON file    → for human-readable raw viewing via the /cron/raw API

    Returns {"excelFileId": ..., "jsonFileId": ...} — either may be None on upload
    error (the error is logged but does not abort the run).
    """
    ts_label = run_id  # already compact: YYYYMMDDHHmm

    # --- Excel snapshot ---
    excel_bytes = _dataframe_to_excel_bytes(df)
    excel_file_id: Optional[str] = None
    excel_appwrite_id = f"raw_xl_{sheet_type[:4]}_{ts_label}"  # ≤ 36 chars
    try:
        _retry(
            storage.create_file,
            bucket_id=APPWRITE_BUCKET_ID,
            file_id=excel_appwrite_id,
            file=InputFile.from_bytes(
                excel_bytes,
                filename=f"sheets_raw_{sheet_type}_{run_id}.xlsx",
            ),
        )
        excel_file_id = excel_appwrite_id
        logger.info(f"[CRON] Raw Excel uploaded: {excel_appwrite_id}")
    except Exception as exc:
        logger.warning(f"[CRON] Raw Excel upload failed for '{sheet_type}': {exc}")

    # --- JSON snapshot ---
    records = df.where(pd.notnull(df), None).to_dict(orient="records")
    raw_payload = {
        "sheetType": sheet_type,
        "googleSheetId": sheet_id,
        "fetchedAt": fetched_at,
        "rowCount": len(records),
        "columns": list(df.columns),
        "data": records,
    }
    json_bytes = json.dumps(raw_payload, indent=2, default=str).encode("utf-8")

    json_file_id: Optional[str] = None
    json_appwrite_id = f"raw_js_{sheet_type[:4]}_{ts_label}"  # ≤ 36 chars
    try:
        _retry(
            storage.create_file,
            bucket_id=APPWRITE_BUCKET_ID,
            file_id=json_appwrite_id,
            file=InputFile.from_bytes(
                json_bytes,
                filename=f"sheets_raw_{sheet_type}_{run_id}.json",
            ),
        )
        json_file_id = json_appwrite_id
        logger.info(f"[CRON] Raw JSON uploaded: {json_appwrite_id}")
    except Exception as exc:
        logger.warning(f"[CRON] Raw JSON upload failed for '{sheet_type}': {exc}")

    return {"excelFileId": excel_file_id, "jsonFileId": json_file_id}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def validate_sheets_config() -> Dict[str, Any]:
    """
    Quick config check — call from startup to surface missing env vars early.
    Returns {"valid": bool, "missing": [...], "warnings": [...]}.
    """
    missing = []
    warnings_list = []

    if not SHEETS_SALES_ID:
        missing.append("GOOGLE_SHEETS_SALES_ID")
    if not SHEETS_STOCK_ID:
        missing.append("GOOGLE_SHEETS_STOCK_ID")
    if not SHEETS_DEAD_STOCK_ID:
        warnings_list.append(
            "GOOGLE_SHEETS_DEAD_STOCK_ID not set — dead stock analysis will be skipped."
        )

    has_sa_file = os.path.exists(GOOGLE_SERVICE_ACCOUNT_PATH)
    has_sa_env = bool(os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip())
    if not has_sa_file and not has_sa_env:
        missing.append(
            f"Google credentials: neither '{GOOGLE_SERVICE_ACCOUNT_PATH}' "
            "exists nor GOOGLE_SERVICE_ACCOUNT_JSON is set"
        )

    if not APPWRITE_PROJECT_ID:
        missing.append("NEXT_PUBLIC_APPWRITE_PROJECT_ID")
    if not APPWRITE_API_KEY:
        missing.append("APPWRITE_API_KEY")
    if not APPWRITE_BUCKET_ID:
        missing.append("NEXT_PUBLIC_APPWRITE_BUCKET_ID")

    return {
        "valid": len(missing) == 0,
        "missing": missing,
        "warnings": warnings_list,
    }


def run_sheets_cron_job() -> Dict[str, Any]:
    """
    Execute the full Google Sheets → Appwrite analytics pipeline.

    Returns a summary dict on success; raises on fatal error.
    """
    start_time = datetime.now()
    # Run ID: compact YYYYMMDDHHmm (12 chars) — safe for Appwrite file IDs
    run_id = start_time.strftime("%Y%m%d%H%M")
    fetched_at = start_time.isoformat()

    logger.info(f"[CRON] ===== Starting Google Sheets job | run_id={run_id} =====")

    storage, databases = _make_appwrite_client()

    # -----------------------------------------------------------------------
    # 1. Authenticate with Google Sheets
    # -----------------------------------------------------------------------
    try:
        gc = _make_gspread_client()
        logger.info("[CRON] Google Sheets client authenticated.")
    except Exception as exc:
        raise RuntimeError(f"Google Sheets authentication failed: {exc}") from exc

    # -----------------------------------------------------------------------
    # 2. Fetch sheets
    # -----------------------------------------------------------------------
    if not SHEETS_SALES_ID or not SHEETS_STOCK_ID:
        raise RuntimeError(
            "GOOGLE_SHEETS_SALES_ID and GOOGLE_SHEETS_STOCK_ID must be configured."
        )

    logger.info("[CRON] Fetching Sales sheet…")
    sales_df = _fetch_sheet_as_dataframe(gc, SHEETS_SALES_ID, SHEETS_SALES_RANGE)
    logger.info(f"[CRON] Sales: {len(sales_df)} rows × {len(sales_df.columns)} cols")

    logger.info("[CRON] Fetching Stock sheet…")
    stock_df = _fetch_sheet_as_dataframe(gc, SHEETS_STOCK_ID, SHEETS_STOCK_RANGE)
    logger.info(f"[CRON] Stock: {len(stock_df)} rows × {len(stock_df.columns)} cols")

    dead_stock_df: Optional[pd.DataFrame] = None
    if SHEETS_DEAD_STOCK_ID:
        logger.info("[CRON] Fetching Dead Stock sheet…")
        dead_stock_df = _fetch_sheet_as_dataframe(
            gc, SHEETS_DEAD_STOCK_ID, SHEETS_DEAD_STOCK_RANGE
        )
        logger.info(
            f"[CRON] Dead Stock: {len(dead_stock_df)} rows × {len(dead_stock_df.columns)} cols"
        )
    else:
        logger.info("[CRON] Dead Stock sheet not configured — skipping.")

    # -----------------------------------------------------------------------
    # 3. Upload raw snapshots to Appwrite
    # -----------------------------------------------------------------------
    logger.info("[CRON] Uploading raw sheet snapshots…")

    raw_sales = _upload_raw_snapshot(
        storage, sales_df, "sales", SHEETS_SALES_ID, run_id, fetched_at
    )
    raw_stock = _upload_raw_snapshot(
        storage, stock_df, "stock", SHEETS_STOCK_ID, run_id, fetched_at
    )
    raw_dead: Dict[str, Optional[str]] = {"excelFileId": None, "jsonFileId": None}
    if dead_stock_df is not None:
        raw_dead = _upload_raw_snapshot(
            storage, dead_stock_df, "dead_stock", SHEETS_DEAD_STOCK_ID, run_id, fetched_at
        )

    # -----------------------------------------------------------------------
    # 4. Run ZenZebra Analytics
    # -----------------------------------------------------------------------
    logger.info("[CRON] Running ZenZebra Analytics engine…")

    # Convert DataFrames → in-memory Excel streams (matches the manual upload flow)
    sales_stream = io.BytesIO(_dataframe_to_excel_bytes(sales_df))
    stock_stream = io.BytesIO(_dataframe_to_excel_bytes(stock_df))

    # Synthetic filenames that satisfy the analyzer's filename patterns
    sales_fname = f"Sale Report - Item Wise-{run_id}-{run_id}-0.xlsx"
    stock_fname = f"Stock Report-{run_id}-{run_id}-0.xlsx"
    dead_fname = f"Dead Stock Report-{run_id}.xlsx"

    analyzer = ZenZebraAnalytics()

    stock_status = analyzer.load_stock_report(stock_stream, stock_fname)
    sales_status = analyzer.load_sales_report(sales_stream, sales_fname)

    dead_stock_status: Any = "not_provided"
    if dead_stock_df is not None:
        dead_stream = io.BytesIO(_dataframe_to_excel_bytes(dead_stock_df))
        dead_stock_status = analyzer.load_dead_stock_report(dead_stream, dead_fname)

    results = analyzer.generate_comprehensive_analysis()

    # Enrich result with provenance info
    results["loadStatus"] = {
        "stock": stock_status,
        "sales": sales_status,
        "deadStock": dead_stock_status,
    }
    results["source"] = "cron_google_sheets"
    results["runId"] = run_id
    results["rawSheetFileIds"] = {
        "sales": raw_sales,
        "stock": raw_stock,
        "deadStock": raw_dead,
    }

    # -----------------------------------------------------------------------
    # 5. Upload analysis JSON to Appwrite
    # -----------------------------------------------------------------------
    logger.info("[CRON] Uploading analysis results…")

    analysis_json_bytes = json.dumps(results, indent=2, default=str).encode("utf-8")
    analysis_file_id = f"cron_analysis_{run_id}"  # 26 chars — within Appwrite limit

    storage.create_file(
        bucket_id=APPWRITE_BUCKET_ID,
        file_id=analysis_file_id,
        file=InputFile.from_bytes(
            analysis_json_bytes,
            filename=f"cron_analysis_{run_id}.json",
        ),
    )
    logger.info(f"[CRON] Analysis JSON uploaded: {analysis_file_id}")

    # -----------------------------------------------------------------------
    # 6. Create analytics_results document (mirrors manual-upload schema)
    # -----------------------------------------------------------------------
    execution_time = (datetime.now() - start_time).total_seconds()

    analytics_doc = {
        "stockFileId": f"gsheets_{SHEETS_STOCK_ID}",
        "stockFileName": f"Google Sheets: Stock ({run_id})",
        "salesFileId": f"gsheets_{SHEETS_SALES_ID}",
        "salesFileName": f"Google Sheets: Sales ({run_id})",
        "deadStockFileId": (f"gsheets_{SHEETS_DEAD_STOCK_ID}" if SHEETS_DEAD_STOCK_ID else None),
        "deadStockFileName": (
            f"Google Sheets: Dead Stock ({run_id})" if SHEETS_DEAD_STOCK_ID else None
        ),
        "uploadedBy": "cron_google_sheets",
        "uploadedById": "system_cron",
        "processedFileId": analysis_file_id,
        "status": "completed",
        "analyzedAt": fetched_at,
        "executionTime": execution_time,
        "salesPeriod": results.get("metadata", {}).get("salesPeriod", run_id),
        "stockPeriod": results.get("metadata", {}).get("stockPeriod", run_id),
        "totalRevenue": float(results.get("salesOverview", {}).get("totalRevenue", 0.0)),
        # Legacy / UI compatibility fields
        "fileId": analysis_file_id,
        "fileName": f"Cron: {run_id}",
        # Run metadata and raw snapshot references (embedded into analytics)
        "runId": run_id,
        "startedAt": fetched_at,
        "completedAt": datetime.now().isoformat(),
        "salesRows": len(sales_df),
        "stockRows": len(stock_df),
        "deadStockRows": len(dead_stock_df) if dead_stock_df is not None else 0,
        # Raw JSON snapshot file IDs
        "rawSalesJsonFileId": raw_sales.get("jsonFileId") or "",
        "rawStockJsonFileId": raw_stock.get("jsonFileId") or "",
        "rawDeadStockJsonFileId": raw_dead.get("jsonFileId") or "",
        # Raw Excel snapshot file IDs
        "rawSalesExcelFileId": raw_sales.get("excelFileId") or "",
        "rawStockExcelFileId": raw_stock.get("excelFileId") or "",
        "rawDeadStockExcelFileId": raw_dead.get("excelFileId") or "",
    }

    databases.create_document(
        database_id=APPWRITE_DATABASE_ID,
        collection_id=APPWRITE_ANALYTICS_COLLECTION_ID,
        document_id=ID.unique(),
        data=analytics_doc,
    )
    logger.info("[CRON] analytics_results document created.")

    # -----------------------------------------------------------------------
    # 7. Run metadata and raw-snapshot references are embedded in analytics_results
    # -----------------------------------------------------------------------
    cron_doc = {
        "runId": run_id,
        "startedAt": fetched_at,
        "completedAt": datetime.now().isoformat(),
        "status": "completed",
        "executionTime": execution_time,
        "googleSheetsSalesId": SHEETS_SALES_ID,
        "googleSheetsStockId": SHEETS_STOCK_ID,
        "googleSheetsDeadStockId": SHEETS_DEAD_STOCK_ID or "",
        "salesRows": len(sales_df),
        "stockRows": len(stock_df),
        "deadStockRows": len(dead_stock_df) if dead_stock_df is not None else 0,
        "analysisFileId": analysis_file_id,
        # Raw JSON file IDs (used by /cron/raw-sheets endpoint)
        "rawSalesJsonFileId": raw_sales["jsonFileId"] or "",
        "rawStockJsonFileId": raw_stock["jsonFileId"] or "",
        "rawDeadStockJsonFileId": raw_dead["jsonFileId"] or "",
        # Raw Excel file IDs
        "rawSalesExcelFileId": raw_sales["excelFileId"] or "",
        "rawStockExcelFileId": raw_stock["excelFileId"] or "",
        "rawDeadStockExcelFileId": raw_dead["excelFileId"] or "",
        "error": "",
    }

    # No separate cron_runs collection is written — run metadata and raw
    # snapshot references were embedded into the `analytics_results` document
    # above. This keeps a single canonical collection for UI and querying.
    logger.info(f"[CRON] Embedded run metadata into analytics_results for run_id={run_id}.")

    summary = {
        "runId": run_id,
        "status": "completed",
        "executionTime": execution_time,
        "analysisFileId": analysis_file_id,
        "salesRows": len(sales_df),
        "stockRows": len(stock_df),
        "deadStockRows": len(dead_stock_df) if dead_stock_df is not None else 0,
        "rawSheetFileIds": {
            "sales": raw_sales,
            "stock": raw_stock,
            "deadStock": raw_dead,
        },
    }

    logger.info(
        f"[CRON] ===== Job complete | run_id={run_id} | "
        f"duration={execution_time:.1f}s ====="
    )

    return summary


def record_cron_failure(
    databases: Databases,
    run_id: str,
    started_at: str,
    error: str,
    error_trace: str,
) -> None:
    """
    Record a failed cron run as an analytics_results document so the history
    is available to the API/UI. Errors are swallowed to avoid masking the
    original failure.
    """
    try:
        databases.create_document(
            database_id=APPWRITE_DATABASE_ID,
            collection_id=APPWRITE_ANALYTICS_COLLECTION_ID,
            document_id=ID.unique(),
            data={
                "uploadedBy": "cron_google_sheets",
                "uploadedById": "system_cron",
                "runId": run_id,
                "startedAt": started_at,
                "completedAt": datetime.now().isoformat(),
                "status": "failed",
                "executionTime": 0.0,
                "googleSheetsSalesId": SHEETS_SALES_ID or "",
                "googleSheetsStockId": SHEETS_STOCK_ID or "",
                "googleSheetsDeadStockId": SHEETS_DEAD_STOCK_ID or "",
                "processedFileId": "",
                "rawSalesJsonFileId": "",
                "rawStockJsonFileId": "",
                "rawDeadStockJsonFileId": "",
                "rawSalesExcelFileId": "",
                "rawStockExcelFileId": "",
                "rawDeadStockExcelFileId": "",
                "error": error[:5000],  # Appwrite attribute limit
                "errorTrace": error_trace,
            },
        )
    except Exception as exc:
        logger.warning(f"[CRON] Could not record failure document: {exc}")
