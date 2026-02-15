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

## Monitoring

- **Health Endpoint**: `GET /health` returns the service status and current timestamp. This is used by Docker for container health monitoring.

## Docker Deployment

1.  **Build the Docker image**:

    ```bash
    docker build -t zenzebra-analytics .
    ```

2.  **Run the container**:

    ```bash
    docker run -p 8000:8000 --env-file .env zenzebra-analytics
    ```

3.  **Using Docker Compose**:
    ```bash
    # Make sure you have a .env file in this directory first!
    docker-compose up -d --build
    ```

## Automated Deployment

A `deploy.sh` script is provided to automate the deployment process. It pulls the latest code, fetches environment variables from Doppler, and restarts the containers.

**Prerequisites:**

- Doppler CLI is not required, but a `DOPPLER_TOKEN` (Service Token) must be available.

**Usage:**

```bash
# Set your Doppler Service Token
export DOPPLER_TOKEN="dp.pt..."

# Run the deploy script
chmod +x deploy.sh
./deploy.sh
```
