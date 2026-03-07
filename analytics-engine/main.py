# -*- coding: utf-8 -*-
"""
ZenZebra Analytics Engine — FastAPI Application  v4.0
======================================================
Two analysis modes:
  1. Manual Excel upload  → POST /analyze-triple
  2. Google Sheets cron   → automated + POST /cron/trigger
"""

from contextlib import asynccontextmanager
import asyncio
import io
import json
import logging
import os
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from appwrite.client import Client
from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.users import Users
from dotenv import load_dotenv

# APScheduler
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from zenzebra_analytics import ZenZebraAnalytics, process_triple_reports
from sheets_cron import (
    run_sheets_cron_job,
    record_cron_failure,
    validate_sheets_config,
)

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
load_dotenv()

# Appwrite Configuration
APPWRITE_ENDPOINT = os.getenv("NEXT_PUBLIC_APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
APPWRITE_PROJECT_ID = os.getenv("NEXT_PUBLIC_APPWRITE_PROJECT_ID")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")
APPWRITE_DATABASE_ID = os.getenv("NEXT_PUBLIC_APPWRITE_DATABASE_ID")
APPWRITE_ANALYTICS_COLLECTION_ID = os.getenv("APPWRITE_ANALYTICS_COLLECTION_ID")
APPWRITE_BUCKET_ID = os.getenv("NEXT_PUBLIC_APPWRITE_BUCKET_ID")
ANALYTICS_SECRET_KEY = os.getenv("ANALYTICS_SECRET_KEY")

# Cron configuration
CRON_SCHEDULE = os.getenv("CRON_SCHEDULE", "0 2 * * *")   # default: daily at 02:00
CRON_ENABLED  = os.getenv("CRON_ENABLED",  "true").lower() == "true"
CRON_TIMEZONE = os.getenv("CRON_TIMEZONE", "Asia/Kolkata")

# ---------------------------------------------------------------------------
# Appwrite SDK instances (module-level for the manual-upload routes)
# ---------------------------------------------------------------------------
client = Client()
client.set_endpoint(APPWRITE_ENDPOINT)
client.set_project(APPWRITE_PROJECT_ID)
client.set_key(APPWRITE_API_KEY)

storage   = Storage(client)
databases = Databases(client)
users     = Users(client)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Cron job state  (in-process; sufficient for single-replica deployments)
# ---------------------------------------------------------------------------
_cron_state: Dict[str, Any] = {
    "enabled":            CRON_ENABLED,
    "schedule":           CRON_SCHEDULE,
    "timezone":           CRON_TIMEZONE,
    "is_running":         False,
    "last_run_id":        None,
    "last_run_started":   None,
    "last_run_completed": None,
    "last_status":        None,   # "completed" | "failed" | None
    "last_error":         None,
    "next_run":           None,
    "total_runs":         0,
    "total_failures":     0,
}

scheduler = AsyncIOScheduler(timezone=CRON_TIMEZONE)


# ---------------------------------------------------------------------------
# Scheduler / cron helpers
# ---------------------------------------------------------------------------

def _appwrite_fresh() -> tuple:
    """Return fresh (Storage, Databases) clients to avoid stale connections."""
    c = Client()
    c.set_endpoint(APPWRITE_ENDPOINT)
    c.set_project(APPWRITE_PROJECT_ID)
    c.set_key(APPWRITE_API_KEY)
    return Storage(c), Databases(c)


def _parse_cron_trigger(cron_expr: str) -> CronTrigger:
    """Parse a 5-field cron expression into an APScheduler CronTrigger."""
    parts = cron_expr.strip().split()
    if len(parts) != 5:
        raise ValueError(
            f"CRON_SCHEDULE must have 5 fields, got: '{cron_expr}'"
        )
    minute, hour, day, month, day_of_week = parts
    return CronTrigger(
        minute=minute,
        hour=hour,
        day=day,
        month=month,
        day_of_week=day_of_week,
        timezone=CRON_TIMEZONE,
    )


def _refresh_next_run() -> None:
    """Update _cron_state['next_run'] from the live scheduler job."""
    try:
        job = scheduler.get_job("sheets_cron")
        if job and job.next_run_time:
            _cron_state["next_run"] = job.next_run_time.isoformat()
    except Exception:
        pass


async def _cron_job_async() -> None:
    """
    Async wrapper called by APScheduler.  Delegates the blocking
    `run_sheets_cron_job()` to a thread-pool so the event loop stays free.
    """
    global _cron_state

    if _cron_state["is_running"]:
        logger.warning("[CRON] Skipping scheduled run — previous job still running.")
        return

    _cron_state["is_running"]       = True
    started_at                       = datetime.now().isoformat()
    run_id                           = datetime.now().strftime("%Y%m%d%H%M")
    _cron_state["last_run_started"]  = started_at
    _cron_state["last_run_id"]       = run_id
    _cron_state["total_runs"]       += 1

    try:
        loop   = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_sheets_cron_job)

        _cron_state["last_status"]        = "completed"
        _cron_state["last_run_id"]        = result["runId"]
        _cron_state["last_error"]         = None
        _cron_state["last_run_completed"] = datetime.now().isoformat()
        logger.info(f"[CRON] Run completed: run_id={result['runId']}")

    except Exception:
        err_msg = traceback.format_exc()
        _cron_state["last_status"]        = "failed"
        _cron_state["last_error"]         = err_msg
        _cron_state["last_run_completed"] = datetime.now().isoformat()
        _cron_state["total_failures"]    += 1
        logger.error(f"[CRON] Run failed:\n{err_msg}")

        # Persist failure record (best-effort)
        try:
            _, dbs = _appwrite_fresh()
            loop   = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                record_cron_failure,
                dbs,
                run_id,
                started_at,
                str(_cron_state["last_error"]),
                err_msg,
            )
        except Exception:
            pass
    finally:
        _cron_state["is_running"] = False
        _refresh_next_run()


# ---------------------------------------------------------------------------
# Application lifespan — start / stop APScheduler
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ZenZebra Analytics Engine v4.0 starting up…")

    # Validate Google Sheets config once at boot
    cfg = validate_sheets_config()
    if not cfg["valid"]:
        logger.warning(
            "[CRON] Google Sheets config issues — cron job may fail:\n"
            + "\n".join(f"  • {m}" for m in cfg["missing"])
        )
    for w in cfg.get("warnings", []):
        logger.info(f"[CRON] {w}")

    if CRON_ENABLED:
        try:
            trigger = _parse_cron_trigger(CRON_SCHEDULE)
            scheduler.add_job(
                _cron_job_async,
                trigger,
                id="sheets_cron",
                replace_existing=True,
                max_instances=1,
                misfire_grace_time=300,
            )
            scheduler.start()
            _refresh_next_run()
            logger.info(
                f"[CRON] Scheduler active | schedule='{CRON_SCHEDULE}' "
                f"tz={CRON_TIMEZONE} | next={_cron_state['next_run']}"
            )
        except Exception as exc:
            logger.error(f"[CRON] Scheduler failed to start: {exc}")
    else:
        logger.info("[CRON] Cron job disabled (CRON_ENABLED=false).")

    yield  # <<< application runs here

    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[CRON] Scheduler stopped.")
    logger.info("ZenZebra Analytics Engine shut down.")


# ---------------------------------------------------------------------------
# FastAPI application  (declared here so `lifespan` is already in scope)
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ZenZebra Analytics API",
    description=(
        "API for processing and analyzing ZenZebra sales and stock data.\n\n"
        "**Two input modes:**\n"
        "1. Manual Excel upload (files stored in Appwrite) \u2192 `/analyze-triple`\n"
        "2. Automated Google Sheets ingestion \u2192 cron job or `/cron/trigger`\n"
    ),
    version="4.0",
    docs_url="/help",
    redoc_url="/documentation",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------
def _require_api_key(x_api_key: Optional[str]) -> None:
    if not x_api_key or x_api_key != ANALYTICS_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key.")

class TripleAnalyzeRequest(BaseModel):
    stockFileId: str
    stockFileName: str
    salesFileId: str
    salesFileName: str
    deadStockFileId: Optional[str] = None
    deadStockFileName: Optional[str] = None
    uploadedBy: str

@app.get("/", tags=["Utility"])
def read_root():
    return {
        "message": "ZenZebra Analytics Engine Running",
        "status": "active",
        "version": "4.0",
        "documentation": "/help",
        "cronEnabled": CRON_ENABLED,
        "cronSchedule": CRON_SCHEDULE,
        "nextCronRun": _cron_state["next_run"],
    }


@app.get("/health", tags=["Utility"])
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "schedulerActive": scheduler.running,
        "cronRunning": _cron_state["is_running"],
    }

def get_user_name(user_id: str) -> str:
    """Get user's name from Appwrite"""
    try:
        user = users.get(user_id)
        if isinstance(user, dict):
            name = user.get('name')
            email = user.get('email', '')
        else:
            name = getattr(user, 'name', None)
            email = getattr(user, 'email', '')

        if name: return name
        if email: return email.split('@')[0]
        return user_id
    except Exception as e:
        logger.warning(f"Could not fetch user name for {user_id}: {str(e)}")
        return user_id

def process_files_background(
    stock_file_id: str,
    stock_file_name: str,
    sales_file_id: str,
    sales_file_name: str,
    dead_stock_file_id: Optional[str],
    dead_stock_file_name: Optional[str],
    uploaded_by: str
):
    """
    Background task to process 3 files
    """
    start_time = datetime.now()
    uploader_name = "Unknown"

    try:
        uploader_name = get_user_name(uploaded_by)
        logger.info(f"Starting triple analysis for {uploader_name}")

        # 1. Download files
        stock_bytes = storage.get_file_download(APPWRITE_BUCKET_ID, stock_file_id)
        sales_bytes = storage.get_file_download(APPWRITE_BUCKET_ID, sales_file_id)

        dead_stock_bytes = None
        if dead_stock_file_id:
             dead_stock_bytes = storage.get_file_download(APPWRITE_BUCKET_ID, dead_stock_file_id)

        # 2. Process
        analyzer = ZenZebraAnalytics()

        stock_status = analyzer.load_stock_report(io.BytesIO(stock_bytes), stock_file_name)
        sales_status = analyzer.load_sales_report(io.BytesIO(sales_bytes), sales_file_name)

        if dead_stock_bytes and dead_stock_file_name:
            analyzer.load_dead_stock_report(io.BytesIO(dead_stock_bytes), dead_stock_file_name)

        results = analyzer.generate_comprehensive_analysis()
        results['loadStatus'] = {
            'stock': stock_status,
            'sales': sales_status,
            'deadStock': 'loaded' if dead_stock_bytes else 'not_provided'
        }
        results['source'] = 'manual_excel'

        # 3. Save JSON
        processed_json = json.dumps(results, indent=2)
        json_file_id = ID.unique()

        storage.create_file(
            bucket_id=APPWRITE_BUCKET_ID,
            file_id=json_file_id,
            file=InputFile.from_bytes(
                processed_json.encode('utf-8'),
                filename=f"analysis_triple_{stock_file_id}.json"
            )
        )

        # 4. Save metadata
        doc_data = {
            "stockFileId": stock_file_id,
            "stockFileName": stock_file_name,
            "salesFileId": sales_file_id,
            "salesFileName": sales_file_name,
            "deadStockFileId": dead_stock_file_id,
            "deadStockFileName": dead_stock_file_name,
            "uploadedBy": uploader_name,
            "uploadedById": uploaded_by,
            "processedFileId": json_file_id,
            "status": "completed",
            "analyzedAt": datetime.now().isoformat(),
            "executionTime": (datetime.now() - start_time).total_seconds(),
            "salesPeriod": results['metadata']['salesPeriod'],
            "stockPeriod": results['metadata']['stockPeriod'],
            "totalRevenue": float(results['salesOverview']['totalRevenue']),
            # Dummy legacy
            "fileId": stock_file_id,
            "fileName": f"Triple Analysis: {stock_file_name}",
        }

        databases.create_document(
            database_id=APPWRITE_DATABASE_ID,
            collection_id=APPWRITE_ANALYTICS_COLLECTION_ID,
            document_id=ID.unique(),
            data=doc_data
        )

        logger.info("Triple analysis completed successfully")

    except Exception as e:
        logger.error(f"Analysis failed: {traceback.format_exc()}")
        # Log failure
        try:
            databases.create_document(
                database_id=APPWRITE_DATABASE_ID,
                collection_id=APPWRITE_ANALYTICS_COLLECTION_ID,
                document_id=ID.unique(),
                data={
                    "stockFileId": stock_file_id,
                    "stockFileName": stock_file_name,
                    "salesFileId": sales_file_id,
                    "salesFileName": sales_file_name,
                    "uploadedBy": uploader_name,
                    "status": "failed",
                    "analyzedAt": datetime.now().isoformat(),
                    "error": str(e),
                    # Dummy legacy
                    "fileId": stock_file_id,
                    "fileName": "Analysis Failed"
                }
            )
        except:
             pass

@app.post("/analyze-triple", tags=["Manual Excel"])
async def analyze_triple_reports(
    request: TripleAnalyzeRequest,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(None, alias="X-API-Key")
):
    """Trigger analysis for three uploaded Excel reports stored in Appwrite."""
    _require_api_key(x_api_key)

    if not request.stockFileName.endswith('.xlsx') or not request.salesFileName.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Files must be Excel (.xlsx)")

    background_tasks.add_task(
        process_files_background,
        request.stockFileId,
        request.stockFileName,
        request.salesFileId,
        request.salesFileName,
        request.deadStockFileId,
        request.deadStockFileName,
        request.uploadedBy
    )

    return {"message": "Triple analysis started", "status": "processing"}

# Backward-compatibility alias
@app.post("/analyze-dual", tags=["Manual Excel"], include_in_schema=False)
async def analyze_dual_reports(
    request: TripleAnalyzeRequest,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(None, alias="X-API-Key")
):
    return await analyze_triple_reports(request, background_tasks, x_api_key)


# ---------------------------------------------------------------------------
# Cron / Google Sheets routes
# ---------------------------------------------------------------------------

@app.get("/cron/status", tags=["Google Sheets Cron"])
def cron_status(x_api_key: str = Header(None, alias="X-API-Key")):
    """
    Return the current scheduler state and last cron run summary.
    """
    _require_api_key(x_api_key)
    _refresh_next_run()
    config_check = validate_sheets_config()
    return {
        "scheduler": {
            "enabled":  _cron_state["enabled"],
            "running":  scheduler.running,
            "schedule": _cron_state["schedule"],
            "timezone": _cron_state["timezone"],
            "nextRun":  _cron_state["next_run"],
        },
        "lastRun": {
            "runId":       _cron_state["last_run_id"],
            "startedAt":   _cron_state["last_run_started"],
            "completedAt": _cron_state["last_run_completed"],
            "status":      _cron_state["last_status"],
            "error": (
                _cron_state["last_error"][:500]
                if _cron_state["last_error"] else None
            ),
        },
        "stats": {
            "totalRuns":     _cron_state["total_runs"],
            "totalFailures": _cron_state["total_failures"],
            "isRunning":     _cron_state["is_running"],
        },
        "configCheck": config_check,
    }


@app.post("/cron/trigger", tags=["Google Sheets Cron"])
async def cron_trigger(
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(None, alias="X-API-Key"),
):
    """
    Manually trigger one Google Sheets \u2192 Appwrite analytics run immediately.
    The job runs in the background; poll `/cron/status` for progress.
    """
    _require_api_key(x_api_key)

    if _cron_state["is_running"]:
        return JSONResponse(
            status_code=409,
            content={"message": "A cron job is already running.", "status": "busy"},
        )

    background_tasks.add_task(_cron_job_async)
    return {
        "message": "Google Sheets cron job triggered manually.",
        "status":  "processing",
        "poll":    "/cron/status",
    }


@app.get("/cron/runs", tags=["Google Sheets Cron"])
def cron_runs(
    limit: int = 20,
    x_api_key: str = Header(None, alias="X-API-Key"),
):
    """
    List recent cron run records derived from the Appwrite `analytics_results`
    collection (documents created by the cron job), sorted newest-first.
    """
    _require_api_key(x_api_key)

    try:
        result = databases.list_documents(
            database_id=APPWRITE_DATABASE_ID,
            collection_id=APPWRITE_ANALYTICS_COLLECTION_ID,
        )
        documents = result.get("documents", []) if isinstance(result, dict) else []
        # Filter analytics documents created by the cron job and sort newest-first
        documents = [d for d in documents if d.get("uploadedBy") == "cron_google_sheets"]
        documents = sorted(
            documents,
            key=lambda d: d.get("analyzedAt") or d.get("startedAt") or "",
            reverse=True,
        )[:limit]

        runs = []
        for d in documents:
            runs.append(
                {
                    "runId": d.get("runId"),
                    "startedAt": d.get("startedAt") or d.get("analyzedAt"),
                    "completedAt": d.get("completedAt") or d.get("analyzedAt"),
                    "status": d.get("status"),
                    "executionTime": d.get("executionTime"),
                    "analysisFileId": d.get("processedFileId"),
                    "salesRows": d.get("salesRows"),
                    "stockRows": d.get("stockRows"),
                    "deadStockRows": d.get("deadStockRows"),
                }
            )

        return {"total": len(runs), "runs": runs}
    except Exception as exc:
        logger.warning(f"Could not list cron runs from analytics collection: {exc}")
        raise HTTPException(
            status_code=503,
            detail=(
                f"Could not retrieve cron runs from Appwrite analytics collection: {exc}. "
            ),
        )


@app.get("/cron/raw-sheets/{run_id}/{sheet_type}", tags=["Google Sheets Cron"])
def cron_raw_sheets(
    run_id: str,
    sheet_type: str,
    x_api_key: str = Header(None, alias="X-API-Key"),
):
    """
    Return the raw Google Sheets snapshot JSON for a specific cron run.

    - **run_id** – the `runId` from `/cron/runs` (format: `YYYYMMDDHHmm`)
    - **sheet_type** – one of `sales`, `stock`, `dead_stock`

    The response contains the full row-level data as fetched from Google Sheets
    at the time the cron job ran.
    """
    _require_api_key(x_api_key)

    VALID_TYPES = {"sales", "stock", "dead_stock"}
    if sheet_type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"sheet_type must be one of: {sorted(VALID_TYPES)}",
        )

    # File ID is predictable — matches what sheets_cron.py writes
    type_abbrev = {"sales": "sale", "stock": "stoc", "dead_stock": "dead"}[sheet_type]
    file_id = f"raw_js_{type_abbrev}_{run_id}"

    try:
        file_bytes = storage.get_file_download(APPWRITE_BUCKET_ID, file_id)
    except Exception as exc:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Raw snapshot not found for run_id='{run_id}', "
                f"sheet_type='{sheet_type}' (file_id='{file_id}'). "
                f"Appwrite: {exc}"
            ),
        )

    try:
        payload = json.loads(file_bytes)
    except Exception:
        return JSONResponse(
            content={"raw": file_bytes.decode("utf-8", errors="replace")}
        )

    return JSONResponse(content=payload)


# ---------------------------------------------------------------------------
# Dev entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
