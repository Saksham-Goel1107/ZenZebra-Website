#!/bin/bash

# Stop on error
set -e

# Configuration
DOPPLER_PROJECT="zenzebra-website"
DOPPLER_CONFIG="prd-python-backend"

# Navigate to the analytics-engine directory
cd "$(dirname "$0")"

echo "🚀 Starting deployment for ZenZebra Analytics Engine..."

# 1. Pull latest code from git
echo "📥 Pulling latest code from git..."
git pull origin main --force

# 2. Setup environment variables using Doppler
# Note: DOPPLER_TOKEN should be set in the environment where this script runs
if [ -z "$DOPPLER_TOKEN" ]; then
    echo "❌ Error: DOPPLER_TOKEN is not set. Please provide a Doppler Service Token."
    exit 1
fi

echo "🔐 Fetching secrets from Doppler (${DOPPLER_PROJECT}/${DOPPLER_CONFIG})..."
curl -s -L --max-redirs 5 --user "$DOPPLER_TOKEN:" \
  "https://api.doppler.com/v3/configs/config/secrets/download?project=${DOPPLER_PROJECT}&config=${DOPPLER_CONFIG}&format=docker" \
  > .env

if [ -s .env ]; then
    echo "✅ .env file created successfully."
else
    echo "❌ Error: .env file is empty. Check your Doppler token and project/config names."
    exit 1
fi

# 3. Docker Compose Build and Deploy
echo "🐳 Building and deploying Docker containers..."
docker-compose up -d --build

# 4. Clean up unused images (optional but recommended)
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✨ Analytics Engine is up and running!"
echo "📍 Health check: http://localhost:8000/health"
