#!/bin/bash
#####################################################################
# CMMS Fully Automated Installation Script
# Installs everything needed and starts the server automatically
# No manual steps required!
#####################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

#####################################################################
# 1. Check System Requirements
#####################################################################

print_header "CMMS Automated Installation"

print_info "Checking system requirements..."

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
    print_success "Detected OS: $NAME $VERSION"
else
    print_error "Cannot detect OS. This script supports Ubuntu/Debian."
    exit 1
fi

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_warning "This script needs sudo privileges to install system packages."
    print_info "Please enter your password when prompted..."
    sudo -v
fi

#####################################################################
# 2. Install Docker and Docker Compose
#####################################################################

print_header "Installing Docker & Docker Compose"

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    print_success "Docker is already installed ($(docker --version))"
else
    print_info "Installing Docker..."

    # Update package index
    sudo apt-get update -qq

    # Install prerequisites
    sudo apt-get install -y -qq \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add current user to docker group (so we can run docker without sudo)
    sudo usermod -aG docker $USER

    print_success "Docker installed successfully!"
fi

# Check if Docker Compose is installed
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    print_success "Docker Compose is already installed"
else
    print_info "Installing Docker Compose..."
    sudo apt-get install -y -qq docker-compose-plugin
    print_success "Docker Compose installed successfully!"
fi

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

print_success "Docker service is running"

#####################################################################
# 3. Install Git (if not present)
#####################################################################

print_header "Checking Git Installation"

if command -v git &> /dev/null; then
    print_success "Git is already installed ($(git --version))"
else
    print_info "Installing Git..."
    sudo apt-get install -y -qq git
    print_success "Git installed successfully!"
fi

#####################################################################
# 4. Clone or Update Repository
#####################################################################

print_header "Setting Up CMMS Repository"

INSTALL_DIR="${INSTALL_DIR:-/opt/cmms}"
BRANCH="claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr"

# If we're already in the CMMS directory, use it
if [ -f "docker-compose.yml" ] && [ -d "backend" ] && [ -d "frontend" ]; then
    print_success "Already in CMMS directory"
    INSTALL_DIR=$(pwd)
else
    # Create install directory
    sudo mkdir -p $INSTALL_DIR
    sudo chown $USER:$USER $INSTALL_DIR

    if [ -d "$INSTALL_DIR/.git" ]; then
        print_info "CMMS already exists. Pulling latest changes..."
        cd $INSTALL_DIR
        git fetch origin
        git checkout $BRANCH
        git pull origin $BRANCH
        print_success "Repository updated!"
    else
        print_info "Cloning CMMS repository..."
        # Note: Replace with actual repository URL
        print_warning "Repository URL not configured. Using local files..."

        # If we have the files in current directory, copy them
        if [ -f "../docker-compose.yml" ]; then
            cp -r ../* $INSTALL_DIR/
            cd $INSTALL_DIR
        else
            print_error "Cannot find CMMS files. Please run this script from CMMS directory."
            exit 1
        fi
    fi
fi

cd $INSTALL_DIR
print_success "Working directory: $INSTALL_DIR"

#####################################################################
# 5. Create Data Directory
#####################################################################

print_header "Creating Data Directory"

mkdir -p ./data
print_success "Data directory created"

#####################################################################
# 6. Build Docker Containers
#####################################################################

print_header "Building Docker Containers"

print_info "This may take 5-10 minutes on first run..."
print_info "Downloading images and installing dependencies..."

# Use docker compose (new syntax) or docker-compose (old syntax)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Stop any running containers
$DOCKER_COMPOSE down 2>/dev/null || true

# Build all services
$DOCKER_COMPOSE build --no-cache

print_success "All containers built successfully!"

#####################################################################
# 7. Start All Services
#####################################################################

print_header "Starting CMMS Services"

# Start all services in background
$DOCKER_COMPOSE up -d

print_success "All services started!"

# Wait for services to be healthy
print_info "Waiting for services to be ready..."
sleep 10

#####################################################################
# 8. Verify Installation
#####################################################################

print_header "Verifying Installation"

# Check if containers are running
BACKEND_STATUS=$($DOCKER_COMPOSE ps -q backend 2>/dev/null)
FRONTEND_STATUS=$($DOCKER_COMPOSE ps -q frontend 2>/dev/null)
OPC_STATUS=$($DOCKER_COMPOSE ps -q opc-service 2>/dev/null)

if [ ! -z "$BACKEND_STATUS" ]; then
    print_success "Backend service is running"
else
    print_error "Backend service failed to start"
fi

if [ ! -z "$FRONTEND_STATUS" ]; then
    print_success "Frontend service is running"
else
    print_error "Frontend service failed to start"
fi

if [ ! -z "$OPC_STATUS" ]; then
    print_success "OPC service is running"
else
    print_warning "OPC service may not be running (optional)"
fi

# Check if ports are accessible
sleep 5

if curl -s http://localhost:3000/health > /dev/null; then
    print_success "Backend API is responding"
else
    print_warning "Backend API not yet ready (may need more time)"
fi

if curl -s http://localhost/ > /dev/null; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend not yet ready (may need more time)"
fi

#####################################################################
# 9. Create Update Script Link
#####################################################################

print_header "Setting Up Update System"

chmod +x update.sh 2>/dev/null || true
print_success "Update script is ready"

#####################################################################
# 10. Display Access Information
#####################################################################

print_header "Installation Complete! 🎉"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  CMMS is now running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Installation Directory:${NC} $INSTALL_DIR"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo -e "   Frontend:           ${GREEN}http://localhost${NC}"
echo -e "   Backend API:        ${GREEN}http://localhost:3000${NC}"
echo -e "   OPC Configuration:  ${GREEN}http://localhost/opc-config${NC}"
echo -e "   Real-Time Status:   ${GREEN}http://localhost/real-time-status${NC}"
echo ""
echo -e "${BLUE}🔑 Default Admin Credentials:${NC}"
echo -e "   Username: ${GREEN}admin${NC}"
echo -e "   Password: ${GREEN}admin123${NC}"
echo -e "   ${YELLOW}⚠️  Change password after first login!${NC}"
echo ""
echo -e "${BLUE}📊 Services Running:${NC}"
$DOCKER_COMPOSE ps
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo -e "   View all logs:       ${GREEN}cd $INSTALL_DIR && docker-compose logs -f${NC}"
echo -e "   View backend logs:   ${GREEN}cd $INSTALL_DIR && docker-compose logs -f backend${NC}"
echo -e "   View OPC logs:       ${GREEN}cd $INSTALL_DIR && docker-compose logs -f opc-service${NC}"
echo -e "   Stop services:       ${GREEN}cd $INSTALL_DIR && docker-compose down${NC}"
echo -e "   Start services:      ${GREEN}cd $INSTALL_DIR && docker-compose up -d${NC}"
echo -e "   Update CMMS:         ${GREEN}cd $INSTALL_DIR && ./update.sh${NC}"
echo -e "   Restart all:         ${GREEN}cd $INSTALL_DIR && docker-compose restart${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   OPC Connectivity:    ${GREEN}$INSTALL_DIR/OPC_CONNECTIVITY_GUIDE.md${NC}"
echo -e "   Update Guide:        ${GREEN}$INSTALL_DIR/UPDATE_INSTRUCTIONS.md${NC}"
echo ""
echo -e "${YELLOW}💡 Quick Start:${NC}"
echo -e "   1. Open browser: ${GREEN}http://localhost${NC}"
echo -e "   2. Login with admin/admin123"
echo -e "   3. Change your password"
echo -e "   4. Start managing your assets!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

# Create desktop shortcut for easy access (optional)
if [ -d "$HOME/Desktop" ]; then
    cat > "$HOME/Desktop/CMMS.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=CMMS
Comment=Open CMMS Web Application
Exec=xdg-open http://localhost
Icon=applications-internet
Terminal=false
Categories=Network;WebBrowser;
EOF
    chmod +x "$HOME/Desktop/CMMS.desktop"
    print_success "Desktop shortcut created!"
fi

# Final note
echo -e "${YELLOW}Note:${NC} If you had to enter your password, please log out and back in"
echo -e "      for Docker permissions to take effect (or run: ${GREEN}newgrp docker${NC})"
echo ""

exit 0
