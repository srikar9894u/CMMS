#!/bin/bash
#####################################################################
# CMMS Start Script - Start all services
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

echo -e "${GREEN}🚀 Starting CMMS Services...${NC}"
echo ""

$DOCKER_COMPOSE up -d

echo ""
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 5

echo ""
$DOCKER_COMPOSE ps

echo ""
echo -e "${GREEN}✅ CMMS is now running!${NC}"
echo ""
echo -e "${BLUE}Access at:${NC} http://localhost"
echo -e "${BLUE}View logs:${NC} docker-compose logs -f"
echo ""
