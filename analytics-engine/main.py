
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
from appwrite.client import Client
from appwrite.services.storage import Storage
from appwrite.services.databases import Databases
from appwrite.services.users import Users
from appwrite.id import ID
from appwrite.input_file import InputFile
import json
import logging
import io
from datetime import datetime
import traceback
from dotenv import load_dotenv
from typing import List, Optional, Any
from zenzebra_analytics import ZenZebraAnalytics, process_triple_reports

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Appwrite Configuration
APPWRITE_ENDPOINT = os.getenv("NEXT_PUBLIC_APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
APPWRITE_PROJECT_ID = os.getenv("NEXT_PUBLIC_APPWRITE_PROJECT_ID")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")
APPWRITE_DATABASE_ID = os.getenv("NEXT_PUBLIC_APPWRITE_DATABASE_ID")
APPWRITE_ANALYTICS_COLLECTION_ID = os.getenv("APPWRITE_ANALYTICS_COLLECTION_ID")
APPWRITE_BUCKET_ID = os.getenv("NEXT_PUBLIC_APPWRITE_BUCKET_ID")
ANALYTICS_SECRET_KEY = os.getenv("ANALYTICS_SECRET_KEY")

# Initialize Appwrite Client
client = Client()
client.set_endpoint(APPWRITE_ENDPOINT)
client.set_project(APPWRITE_PROJECT_ID)
client.set_key(APPWRITE_API_KEY)

storage = Storage(client)
databases = Databases(client)
users = Users(client)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TripleAnalyzeRequest(BaseModel):
    stockFileId: str
    stockFileName: str
    salesFileId: str
    salesFileName: str
    deadStockFileId: Optional[str] = None
    deadStockFileName: Optional[str] = None
    uploadedBy: str

@app.get("/")
def read_root():
    return {"message": "ZenZebra Analytics Engine Running", "status": "active", "version": "3.0"}

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

@app.post("/analyze-triple")
async def analyze_triple_reports(
    request: TripleAnalyzeRequest,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(None, alias="X-API-Key")
):
    """
    Trigger analysis for 3 reports
    """
    if not x_api_key or x_api_key != ANALYTICS_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")

    # Basic filename check
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

# Keep dual endpoint for backward compatibility (maps to triple logic)
@app.post("/analyze-dual")
async def analyze_dual_reports(
    request: TripleAnalyzeRequest,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(None, alias="X-API-Key")
):
    return await analyze_triple_reports(request, background_tasks, x_api_key)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
