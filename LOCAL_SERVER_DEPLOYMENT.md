# CMMS Local Server Deployment with Docker

Complete guide for deploying CMMS on your local server PC using Docker.

## 🖥️ System Requirements

- **OS**: Ubuntu 20.04+, Debian 11+, Windows 10/11 with WSL2, or macOS
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Ports**: 80 (frontend), 3000 (backend), 4840 (OPC UA - optional)

## 📥 Initial Setup (First Time Installation)

### Step 1: Install Docker

#### Ubuntu/Debian:
```bash
# Update system
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Log out and back in for group changes to take effect
# Or run: newgrp docker
```

#### Windows:
1. Install **Docker Desktop for Windows** from https://www.docker.com/products/docker-desktop
2. Enable WSL2 integration
3. Restart your computer

#### macOS:
1. Install **Docker Desktop for Mac** from https://www.docker.com/products/docker-desktop
2. Run the installer
3. Start Docker Desktop

### Step 2: Verify Docker Installation

```bash
docker --version
# Should show: Docker version 24.x.x or higher

docker compose version
# Should show: Docker Compose version v2.x.x or higher
```

### Step 3: Clone the Repository

```bash
# Clone from GitHub (replace with your repo URL)
git clone https://github.com/srikar9894u/CMMS.git
cd CMMS

# Checkout the latest branch
git checkout claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
```

Or if you already have the code:
```bash
cd /path/to/CMMS
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
```

### Step 4: Run Automated Installation

```bash
# Make installation script executable
chmod +x install.sh

# Run automated installation
./install.sh
```

**The installation script will automatically:**
- ✅ Check system requirements
- ✅ Install Docker (if needed)
- ✅ Build all containers
- ✅ Initialize database
- ✅ Create default admin user
- ✅ Start all services

**⏱️ Installation takes 5-10 minutes on first run.**

## 🔄 Updating the System

### Method 1: Automated Update Script (Recommended)

```bash
cd /path/to/CMMS
./update.sh
```

This will automatically:
1. Pull latest code from GitHub
2. Stop all services
3. Rebuild containers with new code
4. Start all services
5. Verify everything is working

### Method 2: Manual Update

```bash
# Navigate to CMMS directory
cd /path/to/CMMS

# Pull latest code
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr

# Stop all services
docker compose down

# Rebuild containers (--no-cache ensures fresh build)
docker compose build --no-cache

# Start all services
docker compose up -d

# Wait for services to start
sleep 10

# Check status
docker compose ps
```

### Method 3: Quick Update (Without Rebuilding - Faster)

Use this if only database or configuration changed (no code changes):

```bash
cd /path/to/CMMS
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
docker compose restart
```

## 🚀 Service Management

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### Restart Services
```bash
docker compose restart
```

### Restart Specific Service
```bash
docker compose restart backend
docker compose restart frontend
docker compose restart opc-service
```

### View Running Containers
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f opc-service

# Last 100 lines
docker compose logs --tail=100 backend
```

### Check Container Health
```bash
# Backend health endpoint
curl http://localhost:3000/health

# Frontend accessibility
curl http://localhost/

# Detailed container info
docker compose ps --format json | jq
```

## 🌐 Accessing the System

After successful installation:

- **Frontend**: http://localhost or http://YOUR_SERVER_IP
- **Backend API**: http://localhost:3000 or http://YOUR_SERVER_IP:3000
- **OPC Config**: http://localhost/opc-config
- **Real-Time Status**: http://localhost/real-time-status

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change password immediately after first login!**

## 📂 Important Files and Directories

```
CMMS/
├── docker-compose.yml          # Docker services configuration
├── install.sh                  # Automated installation script
├── update.sh                   # Automated update script
├── backend/
│   ├── Dockerfile             # Backend container definition
│   ├── database.sqlite        # Database file (auto-created)
│   └── src/                   # Backend source code
├── frontend/
│   ├── Dockerfile             # Frontend container definition
│   └── src/                   # Frontend source code
├── opc-service/
│   ├── Dockerfile             # OPC service container
│   ├── opc_service_v2.py      # Production OPC service
│   └── requirements.txt       # Python dependencies
└── data/                       # Persistent data (auto-created)
```

## 🔧 Troubleshooting

### Issue: Login Failed

**Solution:**
```bash
# Check if backend is running
docker compose ps backend

# View backend logs
docker compose logs backend

# Restart backend
docker compose restart backend

# Verify database exists
ls -lh backend/database.sqlite

# If database is missing, recreate it
docker compose down
rm -f backend/database.sqlite
docker compose up -d
```

### Issue: Containers Not Starting

**Solution:**
```bash
# Check Docker is running
docker ps

# View all logs for errors
docker compose logs

# Remove old containers and rebuild
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Issue: Port Already in Use

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :80    # Frontend
sudo lsof -i :3000  # Backend

# Kill the process or change ports in docker-compose.yml
```

### Issue: Permission Denied on Database

**Solution:**
```bash
# Fix database permissions
sudo chown -R $USER:$USER backend/database.sqlite

# Or restart with proper permissions
docker compose down
sudo rm backend/database.sqlite
docker compose up -d
```

### Issue: "Cannot connect to Docker daemon"

**Solution:**
```bash
# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Check Docker status
sudo systemctl status docker
```

## 🔄 Backup and Restore

### Backup

```bash
# Create backup directory
mkdir -p ~/cmms-backups

# Backup database
cp backend/database.sqlite ~/cmms-backups/database_$(date +%Y%m%d_%H%M%S).sqlite

# Backup entire data directory
tar -czf ~/cmms-backups/cmms_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/database.sqlite data/
```

### Restore

```bash
# Stop services
docker compose down

# Restore database
cp ~/cmms-backups/database_YYYYMMDD_HHMMSS.sqlite backend/database.sqlite

# Or restore from tar
tar -xzf ~/cmms-backups/cmms_backup_YYYYMMDD_HHMMSS.tar.gz

# Start services
docker compose up -d
```

## 🔒 Security Recommendations

### For Production Use:

1. **Change Default Password**
   - Login with admin/admin123
   - Go to Settings → Change Password

2. **Use HTTPS (SSL/TLS)**
   ```bash
   # Install nginx with Let's Encrypt
   sudo apt-get install nginx certbot python3-certbot-nginx

   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   ```

3. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

4. **Regular Backups**
   ```bash
   # Add to crontab for daily backups at 2 AM
   crontab -e
   # Add: 0 2 * * * /path/to/backup-script.sh
   ```

5. **Update Regularly**
   ```bash
   # Pull updates weekly
   cd /path/to/CMMS && ./update.sh
   ```

## 📊 Resource Monitoring

### View Container Resource Usage
```bash
docker stats

# Specific containers
docker stats cmms-backend cmms-frontend cmms-opc
```

### Check Disk Usage
```bash
# Docker disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## 🌍 Remote Access Setup

### Access from Other Devices on Same Network

1. **Find your server IP:**
   ```bash
   # Linux/Mac
   ip addr show | grep inet

   # Windows (PowerShell)
   ipconfig
   ```

2. **Access from other devices:**
   - Frontend: http://SERVER_IP
   - Backend: http://SERVER_IP:3000

3. **Update firewall:**
   ```bash
   sudo ufw allow from 192.168.1.0/24 to any port 80
   sudo ufw allow from 192.168.1.0/24 to any port 3000
   ```

### Access from Internet (Advanced)

1. **Port Forwarding** on your router (ports 80, 443)
2. **Dynamic DNS** service (if you don't have static IP)
3. **SSL Certificate** for HTTPS (use Let's Encrypt)
4. **Strong Authentication** (change default password!)

## 📝 Maintenance Tasks

### Weekly
- Review logs for errors
- Check disk space
- Monitor system resources

### Monthly
- Update to latest version
- Review user access
- Backup database
- Clean up old logs

### Quarterly
- Security audit
- Performance optimization
- Update documentation

## 🆘 Getting Help

If you encounter issues:

1. **Check Logs**: `docker compose logs -f`
2. **Check Status**: `docker compose ps`
3. **Review Documentation**:
   - OPC_CONNECTIVITY_GUIDE.md
   - OPC_INTEGRATION_DESIGN.md
4. **GitHub Issues**: Report bugs or ask questions
5. **Check Database**: `ls -lh backend/database.sqlite`

## 🎯 Quick Reference Commands

```bash
# Installation
./install.sh

# Update
./update.sh

# Start/Stop/Restart
docker compose up -d
docker compose down
docker compose restart

# View Logs
docker compose logs -f

# Check Status
docker compose ps
curl http://localhost:3000/health

# Backup
cp backend/database.sqlite ~/backup/

# Rebuild Everything
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## ✅ Post-Installation Checklist

- [ ] Services are running (`docker compose ps`)
- [ ] Backend is healthy (`curl http://localhost:3000/health`)
- [ ] Frontend is accessible (`curl http://localhost/`)
- [ ] Can login with admin/admin123
- [ ] Changed default password
- [ ] Created test asset
- [ ] Configured OPC connection (if using PLC monitoring)
- [ ] Set up backup schedule
- [ ] Documented server IP and access URLs

---

**Need Help?** Check logs with `docker compose logs -f` or review troubleshooting section above.
