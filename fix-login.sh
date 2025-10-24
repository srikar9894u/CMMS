#!/bin/bash
#####################################################################
# CMMS Login Fix Script
# Diagnoses and fixes login issues on local Docker deployment
#####################################################################

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║        CMMS Login Troubleshooting & Fix Script                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect docker compose command
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}ERROR: Docker Compose not found!${NC}"
    echo "Please install Docker Desktop or Docker Compose first."
    exit 1
fi

echo -e "${BLUE}Step 1: Checking Docker containers...${NC}"
echo "─────────────────────────────────────────────────────────────"
$DOCKER_COMPOSE ps
echo ""

# Check if backend is running
BACKEND_RUNNING=$($DOCKER_COMPOSE ps -q backend 2>/dev/null)
if [ -z "$BACKEND_RUNNING" ]; then
    echo -e "${RED}✗ Backend container is NOT running${NC}"
    echo -e "${YELLOW}  Starting backend...${NC}"
    $DOCKER_COMPOSE up -d backend
    sleep 5
else
    echo -e "${GREEN}✓ Backend container is running${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Checking backend logs for errors...${NC}"
echo "─────────────────────────────────────────────────────────────"
echo "Last 20 lines:"
$DOCKER_COMPOSE logs --tail=20 backend
echo ""

echo -e "${BLUE}Step 3: Testing backend API health...${NC}"
echo "─────────────────────────────────────────────────────────────"
HEALTH_CHECK=$(curl -s http://localhost:3000/health 2>/dev/null)
if [ -z "$HEALTH_CHECK" ]; then
    echo -e "${RED}✗ Backend API is NOT responding${NC}"
    echo -e "${YELLOW}  Backend might still be starting up...${NC}"
    echo -e "${YELLOW}  Waiting 10 seconds...${NC}"
    sleep 10
    HEALTH_CHECK=$(curl -s http://localhost:3000/health 2>/dev/null)
fi

if [ ! -z "$HEALTH_CHECK" ]; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
    echo "  Response: $HEALTH_CHECK"
else
    echo -e "${RED}✗ Backend API still not responding${NC}"
    echo -e "${YELLOW}  Restarting backend container...${NC}"
    $DOCKER_COMPOSE restart backend
    sleep 10
fi

echo ""
echo -e "${BLUE}Step 4: Checking database file...${NC}"
echo "─────────────────────────────────────────────────────────────"

# Check if running from correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ Not in CMMS directory!${NC}"
    echo "  Please run this script from the CMMS directory"
    exit 1
fi

# Check database in data directory (Docker volume mount)
if [ -f "data/database.sqlite" ]; then
    DB_SIZE=$(ls -lh data/database.sqlite | awk '{print $5}')
    echo -e "${GREEN}✓ Database exists: data/database.sqlite (${DB_SIZE})${NC}"
elif [ -f "backend/database.sqlite" ]; then
    DB_SIZE=$(ls -lh backend/database.sqlite | awk '{print $5}')
    echo -e "${YELLOW}⚠ Database found in wrong location: backend/database.sqlite${NC}"
    echo -e "${YELLOW}  Moving to correct location...${NC}"
    mkdir -p data
    cp backend/database.sqlite data/
else
    echo -e "${RED}✗ Database file not found${NC}"
    echo -e "${YELLOW}  This means the backend never initialized properly${NC}"
fi

echo ""
echo -e "${BLUE}Step 5: Testing login endpoint...${NC}"
echo "─────────────────────────────────────────────────────────────"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>/dev/null)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Login API is working!${NC}"
    echo "  HTTP Status: $HTTP_CODE"
    echo "  Admin user exists and password is correct"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Login should work now!${NC}"
    echo -e "${GREEN}Try logging in again at: http://localhost${NC}"
    echo -e "${GREEN}Username: admin${NC}"
    echo -e "${GREEN}Password: admin123${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
else
    echo -e "${RED}✗ Login failed with HTTP $HTTP_CODE${NC}"
    echo "  Response: $RESPONSE_BODY"
    echo ""
    echo -e "${YELLOW}Database may need to be recreated...${NC}"
    echo ""

    read -p "Do you want to recreate the database? (WARNING: This will delete all data) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Recreating database...${NC}"

        # Stop services
        echo "  Stopping services..."
        $DOCKER_COMPOSE down

        # Remove old database
        echo "  Removing old database..."
        rm -f data/database.sqlite
        rm -f backend/database.sqlite

        # Start services (will auto-create database)
        echo "  Starting services..."
        $DOCKER_COMPOSE up -d

        echo "  Waiting 15 seconds for initialization..."
        sleep 15

        # Test again
        echo ""
        echo "  Testing login..."
        LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/login \
          -H "Content-Type: application/json" \
          -d '{"username":"admin","password":"admin123"}' 2>/dev/null)

        HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)

        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ Database recreated successfully!${NC}"
            echo -e "${GREEN}✓ Login is now working!${NC}"
            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}You can now login at: http://localhost${NC}"
            echo -e "${GREEN}Username: admin${NC}"
            echo -e "${GREEN}Password: admin123${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        else
            echo -e "${RED}✗ Still having issues. See detailed logs below:${NC}"
            echo ""
            $DOCKER_COMPOSE logs backend
        fi
    else
        echo "Skipping database recreation."
    fi
fi

echo ""
echo -e "${BLUE}Step 6: Frontend connectivity check...${NC}"
echo "─────────────────────────────────────────────────────────────"

FRONTEND_RUNNING=$($DOCKER_COMPOSE ps -q frontend 2>/dev/null)
if [ -z "$FRONTEND_RUNNING" ]; then
    echo -e "${RED}✗ Frontend container is NOT running${NC}"
    echo -e "${YELLOW}  Starting frontend...${NC}"
    $DOCKER_COMPOSE up -d frontend
else
    echo -e "${GREEN}✓ Frontend container is running${NC}"
fi

# Test if frontend can be accessed
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null)
if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is accessible at http://localhost${NC}"
else
    echo -e "${YELLOW}⚠ Frontend returned HTTP $FRONTEND_CHECK${NC}"
    echo -e "${YELLOW}  It may still be starting up...${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Summary & Next Steps${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Access URLs:"
echo "  Frontend:    http://localhost"
echo "  Backend API: http://localhost:3000"
echo ""
echo "Default Login:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "If login still fails, try these commands:"
echo ""
echo "  1. View backend logs:"
echo "     $DOCKER_COMPOSE logs -f backend"
echo ""
echo "  2. Restart all services:"
echo "     $DOCKER_COMPOSE restart"
echo ""
echo "  3. Rebuild from scratch:"
echo "     $DOCKER_COMPOSE down"
echo "     $DOCKER_COMPOSE build --no-cache"
echo "     $DOCKER_COMPOSE up -d"
echo ""
echo "  4. Check backend health:"
echo "     curl http://localhost:3000/health"
echo ""
echo "  5. Test login API directly:"
echo "     curl -X POST http://localhost:3000/api/auth/login \\"
echo "       -H \"Content-Type: application/json\" \\"
echo "       -d '{\"username\":\"admin\",\"password\":\"admin123\"}'"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
