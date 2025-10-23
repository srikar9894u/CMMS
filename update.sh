#!/bin/bash
# CMMS Update Script
# This script pulls latest code and updates all services

echo "🔄 Updating CMMS with latest features..."

# Step 1: Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr

# Step 2: Stop all running containers
echo "🛑 Stopping all services..."
docker-compose down

# Step 3: Rebuild all containers with new dependencies
echo "🔨 Rebuilding containers with new dependencies..."
docker-compose build --no-cache

# Step 4: Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Step 5: Check service status
echo "✅ Checking service status..."
docker-compose ps

echo ""
echo "🎉 Update complete!"
echo ""
echo "Services running:"
echo "  - Backend API: http://localhost:3000"
echo "  - Frontend: http://localhost (port 80)"
echo "  - OPC Service: Running in background"
echo ""
echo "📝 View logs:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f frontend"
echo "  docker-compose logs -f opc-service"
echo ""
echo "🔌 OPC Configuration: http://localhost/opc-config"
echo "📊 Real-Time Status: http://localhost/real-time-status"
