#!/bin/bash
#####################################################################
# CMMS Stop Script - Stop all services
#####################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${BLUE}🛑 Stopping CMMS Services...${NC}"
echo ""

$DOCKER_COMPOSE down

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""
echo -e "${BLUE}To start again:${NC} ./start.sh"
echo ""
