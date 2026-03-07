
import os
import time
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException

# Load environment variables from the parent directory's .env file
load_dotenv('../.env')

# Configuration
ENDPOINT    = os.getenv('NEXT_PUBLIC_APPWRITE_ENDPOINT')
PROJECT_ID  = os.getenv('NEXT_PUBLIC_APPWRITE_PROJECT_ID')
API_KEY     = os.getenv('APPWRITE_API_KEY')
DATABASE_ID = os.getenv('NEXT_PUBLIC_APPWRITE_DATABASE_ID')

if not all([ENDPOINT, PROJECT_ID, API_KEY, DATABASE_ID]):
    print("Error: Missing environment variables. Check ../.env")
    exit(1)

client = Client()
client.set_endpoint(ENDPOINT)
client.set_project(PROJECT_ID)
client.set_key(API_KEY)

db = Databases(client)

# Fixed collection IDs
ANALYTICS_COLLECTION_ID = 'analytics_results'


def _create_attributes(collection_id: str, attributes: list) -> None:
    """Helper: create attributes on a collection, skipping already-existing ones."""
    for attr in attributes:
        key, type_, size, required = attr
        try:
            time.sleep(0.5)  # avoid rate limits
            if type_ == 'string':
                db.create_string_attribute(DATABASE_ID, collection_id, key, size, required)
            elif type_ == 'integer':
                db.create_integer_attribute(DATABASE_ID, collection_id, key, required)
            elif type_ == 'float':
                db.create_float_attribute(DATABASE_ID, collection_id, key, required)
            print(f"   + Attribute '{key}' created.")
        except AppwriteException as e:
            if 'already exists' in str(e):
                print(f"   ~ Attribute '{key}' already exists.")
            else:
                print(f"   ! Failed to create attribute '{key}': {e}")


def setup_schema():
    """Create / verify the analytics_results collection schema."""
    print(f"\nUpdating schema: Database={DATABASE_ID}, Collection={ANALYTICS_COLLECTION_ID}")

    attributes = [
        # File identifiers
        ('stockFileId',         'string',  255,    True),
        ('stockFileName',       'string',  255,    True),
        ('salesFileId',         'string',  255,    True),
        ('salesFileName',       'string',  255,    True),
        ('deadStockFileId',     'string',  255,    False),
        ('deadStockFileName',   'string',  255,    False),

        # User info
        ('uploadedBy',          'string',  255,    True),
        ('uploadedById',        'string',  255,    False),

        # Status and timing
        ('status',              'string',   50,    True),
        ('analyzedAt',          'string',   50,    True),
        ('executionTime',       'float',     0,    False),

        # Period information
        ('salesPeriod',         'string',  255,    False),
        ('stockPeriod',         'string',  255,    False),

        # Key metrics
        ('totalRevenue',        'float',     0,    False),
        ('totalOrders',         'integer',   0,    False),
        ('totalItems',          'integer',   0,    False),
        ('averageOrderValue',   'float',     0,    False),
        ('overallMargin',       'float',     0,    False),
        ('stockValue',          'float',     0,    False),

        # Processed data reference
        ('processedFileId',     'string',  255,    False),

        # Error handling
        ('error',               'string', 10000,   False),
        ('errorTrace',          'string', 100000,  False),

        # Legacy UI fields
        ('fileId',              'string',  255,    False),
        ('fileName',            'string',  255,    False),
    ]

    print("Creating / verifying attributes…")
    _create_attributes(ANALYTICS_COLLECTION_ID, attributes)

    print("\n" + "=" * 50)
    print("analytics_results SCHEMA UPDATE COMPLETE.")
    print("=" * 50)




if __name__ == '__main__':
    setup_schema()
