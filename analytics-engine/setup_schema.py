
import os
import time
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException

# Load environment variables from the parent directory's .env file
load_dotenv('../.env')

# Configuration
ENDPOINT = os.getenv('NEXT_PUBLIC_APPWRITE_ENDPOINT')
PROJECT_ID = os.getenv('NEXT_PUBLIC_APPWRITE_PROJECT_ID')
API_KEY = os.getenv('APPWRITE_API_KEY')
DATABASE_ID = os.getenv('NEXT_PUBLIC_APPWRITE_DATABASE_ID')

if not all([ENDPOINT, PROJECT_ID, API_KEY, DATABASE_ID]):
    print("Error: Missing environment variables. Check ../.env")
    exit(1)

client = Client()
client.set_endpoint(ENDPOINT)
client.set_project(PROJECT_ID)
client.set_key(API_KEY)

db = Databases(client)

# Use fixed ID for easier configuration
FIXED_COLLECTION_ID = 'analytics_results'

def setup_schema():
    print(f"Updating schema in Database: {DATABASE_ID} for Collection: {FIXED_COLLECTION_ID}...")

    col_id = FIXED_COLLECTION_ID

    # 2. Define NEW Attributes for ZenZebra Triple Analysis
    attributes = [
        # File identifiers
        ('stockFileId', 'string', 255, True),
        ('stockFileName', 'string', 255, True),
        ('salesFileId', 'string', 255, True),
        ('salesFileName', 'string', 255, True),
        ('deadStockFileId', 'string', 255, False), # Optional
        ('deadStockFileName', 'string', 255, False), # Optional

        # User info
        ('uploadedBy', 'string', 255, True),
        ('uploadedById', 'string', 255, False),

        # Status and timing
        ('status', 'string', 50, True),
        ('analyzedAt', 'string', 50, True),
        ('executionTime', 'float', 0, False),

        # Period information
        ('salesPeriod', 'string', 255, False),
        ('stockPeriod', 'string', 255, False),

        # Key metrics
        ('totalRevenue', 'float', 0, False),
        ('totalOrders', 'integer', 0, False),
        ('totalItems', 'integer', 0, False),
        ('averageOrderValue', 'float', 0, False),
        ('overallMargin', 'float', 0, False),
        ('stockValue', 'float', 0, False),

        # Processed data reference
        ('processedFileId', 'string', 255, False),

        # Error handling
        ('error', 'string', 10000, False),
        ('errorTrace', 'string', 100000, False),
    ]

    print("Creating/Verifying attributes...")
    for attr in attributes:
        key, type_, size, required = attr
        try:
            # Add small delay to prevent rate limits
            time.sleep(0.5)

            if type_ == 'string':
                db.create_string_attribute(DATABASE_ID, col_id, key, size, required)
            elif type_ == 'integer':
                db.create_integer_attribute(DATABASE_ID, col_id, key, required)
            elif type_ == 'float':
                db.create_float_attribute(DATABASE_ID, col_id, key, required)
            print(f"   + Attribute '{key}' verified/created.")
        except AppwriteException as e:
            if 'already exists' in str(e):
                print(f"   + Attribute '{key}' exists.")
            else:
                print(f"   - Failed to create attribute '{key}': {e}")

    print("\n" + "="*50)
    print(f"SCHEMA UPDATE COMPLETE.")
    print("="*50)

if __name__ == '__main__':
    setup_schema()
