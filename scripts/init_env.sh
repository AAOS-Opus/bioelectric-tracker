#!/bin/bash

set -e

echo "Initializing development environment..."

# Apply Next.js client component fixes
echo "Applying client component fixes..."
chmod +x ./scripts/fix-client-components.sh
./scripts/fix-client-components.sh

# Build and start containers in detached mode
echo "Building Docker containers..."
docker-compose build

echo "Starting services..."
docker-compose up -d

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to initialize..."
sleep 10

# Seed the database
echo "Seeding database with test data..."
docker-compose exec app node ./scripts/db-seed.js

echo "Creating test user..."
docker-compose exec app node ./scripts/create-test-user.js

echo "Initialization complete!"
echo "Access the application at: http://localhost:3000"
echo "Login with test@example.com / Test123!"
