#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env.production ]; then
  export $(cat .env.production | grep -v '^#' | xargs)
fi

# Check required environment variables
required_vars=(
  "MONGO_ROOT_USER"
  "MONGO_ROOT_PASSWORD"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: Required environment variable $var is not set"
    exit 1
  fi
done

echo "🚀 Starting deployment process..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build and start production containers
echo "🏗️ Building production containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Start new containers
echo "🌟 Starting new containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for health checks
echo "🏥 Waiting for health checks..."
sleep 30

# Verify deployment
echo "✅ Verifying deployment..."
if curl -f http://localhost:3000/api/health; then
  echo "🎉 Deployment successful!"
else
  echo "❌ Deployment verification failed!"
  exit 1
fi

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "📝 Deployment complete! Logs will follow..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
