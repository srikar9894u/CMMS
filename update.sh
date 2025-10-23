#!/bin/bash
#####################################################################
# CMMS Automated Update Script
# Updates code and rebuilds services - Fully Automated!
#####################################################################

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  CMMS Automated Update${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

# Detect docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Step 1: Pull latest code
echo -e "${BLUE}📥 Pulling latest code from GitHub...${NC}"
git fetch origin
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# Step 2: Stop all services
echo -e "${BLUE}🛑 Stopping all services...${NC}"
$DOCKER_COMPOSE down
echo -e "${GREEN}✅ Services stopped${NC}"
echo ""

# Step 3: Rebuild containers
echo -e "${BLUE}🔨 Rebuilding containers with new dependencies...${NC}"
echo -e "${YELLOW}   This may take a few minutes...${NC}"
$DOCKER_COMPOSE build --no-cache
echo -e "${GREEN}✅ Containers rebuilt${NC}"
echo ""

# Step 4: Start all services
echo -e "${BLUE}🚀 Starting all services...${NC}"
$DOCKER_COMPOSE up -d
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Step 5: Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Step 6: Verify services
echo -e "${BLUE}🔍 Verifying services...${NC}"
$DOCKER_COMPOSE ps
echo ""

# Check backend health
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may need more time to start${NC}"
fi

# Check frontend
if curl -s http://localhost/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may need more time to start${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Update Complete! 🎉${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  Frontend:           http://localhost"
echo "  Backend API:        http://localhost:3000"
echo "  OPC Configuration:  http://localhost/opc-config"
echo "  Real-Time Status:   http://localhost/real-time-status"
echo ""
echo -e "${BLUE}📝 View Logs:${NC}"
echo "  All logs:     $DOCKER_COMPOSE logs -f"
echo "  Backend:      $DOCKER_COMPOSE logs -f backend"
echo "  Frontend:     $DOCKER_COMPOSE logs -f frontend"
echo "  OPC Service:  $DOCKER_COMPOSE logs -f opc-service"
echo ""
