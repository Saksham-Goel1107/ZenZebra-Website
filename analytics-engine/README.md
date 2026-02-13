# Data Analytics Engine

This is a FastAPI service powered by Pandas to process Excel/CSV files for the ZenZebra Admin Dashboard.

## Setup

1.  **Install Python Dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

2.  **Environment Variables**:
    Create a `.env` file in this directory based on your Next.js project's env vars.
    Key variables needed:

    ```
    NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=...
    APPWRITE_API_KEY=... (Must have execution rights)
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=...
    APPWRITE_ANALYTICS_COLLECTION_ID=... (Create this collection first!)
    NEXT_PUBLIC_APPWRITE_BUCKET_ID=...
    ```

3.  **Appwrite Setup**:
    - Create a Collection in your Database named `analytics_results`.
    - Add Attributes:
      - `fileId` (string, 255)
      - `fileName` (string, 255)
      - `status` (string, 50)
      - `analyzedAt` (string, 50) - we store ISO date
      - `rowCount` (integer)
      - `summaryStats` (string, 1000000) - Large text for JSON
      - `categoricalAnalysis` (string, 1000000) - Large text for JSON
      - `metadata` (string, 1000000) - Large text

4.  **Run Server**:
    ```bash
    uvicorn main:app --reload
    ```
    Server runs on `http://localhost:8000`.

## Architecture

- **Trigger**: Receives POST request from Next.js with `fileId`.
- **Process**: Downloads file from Appwrite Storage -> Pandas Analysis.
- **Result**: Uploads JSON results to Appwrite Database.
