# CMMS Server Installation Guide

This guide will help you install the CMMS application on your server PC for LAN access.

## Prerequisites

Your server PC should have:
- A stable network connection (preferably wired Ethernet)
- At least 2GB RAM
- At least 5GB free disk space
- A modern operating system (Windows 10/11, Ubuntu 20.04+, or similar)

## Installation Methods

Choose the method that best fits your needs:
- **Method 1: Docker Installation (Recommended)** - Easiest, works on all platforms
- **Method 2: Manual Installation** - More control, good for development

---

## Method 1: Docker Installation (Recommended)

This is the easiest method and works on Windows, Linux, and macOS.

### Step 1: Install Docker

#### On Windows 10/11:

1. **Download Docker Desktop**
   - Go to: https://www.docker.com/products/docker-desktop
   - Click "Download for Windows"
   - Run the installer (Docker Desktop Installer.exe)

2. **Install Docker Desktop**
   - Follow the installation wizard
   - Enable WSL 2 if prompted
   - Restart your computer when prompted

3. **Verify Installation**
   - Open Command Prompt or PowerShell
   - Run:
     ```powershell
     docker --version
     docker-compose --version
     ```
   - You should see version numbers

#### On Ubuntu/Debian Linux:

```bash
# Update package list
sudo apt update

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
# Then verify installation
docker --version
docker compose version
```

#### On CentOS/RHEL:

```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Verify
docker --version
docker compose version
```

### Step 2: Download the CMMS Application

#### Option A: Using Git (Recommended)

```bash
# Install git if not already installed
# Windows: Download from https://git-scm.com/download/win
# Linux: sudo apt install git (Ubuntu) or sudo yum install git (CentOS)

# Clone the repository
git clone https://github.com/srikar9894u/CMMS.git
cd CMMS

# Switch to the correct branch
git checkout claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
```

#### Option B: Download ZIP file

1. Go to your repository URL
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file to a folder (e.g., `C:\CMMS` on Windows or `/home/user/CMMS` on Linux)
4. Open terminal/command prompt in that folder

### Step 3: Configure the Application

1. **Edit docker-compose.yml** (optional but recommended)

   Open `docker-compose.yml` in a text editor and change the JWT_SECRET:

   ```yaml
   environment:
     - JWT_SECRET=your-secure-random-string-here-at-least-32-characters
   ```

   Generate a secure random string online or use:
   ```bash
   # Linux/Mac
   openssl rand -base64 32

   # Windows PowerShell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

2. **Create data directory** (for database persistence)
   ```bash
   # Linux/Mac
   mkdir -p data

   # Windows (Command Prompt)
   mkdir data
   ```

### Step 4: Start the Application

```bash
# Build and start the application
docker compose up -d

# This will:
# 1. Build the backend container
# 2. Build the frontend container
# 3. Start both containers in the background
# 4. Create the database
# 5. Make the app available on port 80
```

**Note:** First build may take 5-10 minutes depending on your internet speed.

### Step 5: Verify Installation

```bash
# Check if containers are running
docker ps

# You should see two containers:
# - cmms-backend
# - cmms-frontend

# Check logs
docker compose logs

# Test the application
# Open browser and go to: http://localhost
```

### Step 6: Configure Firewall

#### Windows Firewall:

```powershell
# Open PowerShell as Administrator
New-NetFirewallRule -DisplayName "CMMS Web Application" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

Or use GUI:
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter "80" → Next
6. Select "Allow the connection" → Next
7. Check all profiles → Next
8. Name it "CMMS Web App" → Finish

#### Linux Firewall (UFW):

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw reload

# Check status
sudo ufw status
```

#### Linux Firewall (firewalld):

```bash
# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

### Step 7: Find Your Server IP Address

#### Windows:
```powershell
ipconfig
# Look for "IPv4 Address" under your network adapter
```

#### Linux:
```bash
ip addr show
# or
hostname -I
```

Your server IP will look like: `192.168.1.100` or `10.0.0.50`

### Step 8: Access from LAN

1. On any device connected to the same network
2. Open a web browser
3. Go to: `http://<your-server-ip>`
   - Example: `http://192.168.1.100`
4. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

---

## Method 2: Manual Installation

Use this if you want more control or need to customize the setup.

### Step 1: Install Node.js

#### Windows:
1. Download Node.js from: https://nodejs.org (LTS version)
2. Run installer (accept all defaults)
3. Verify in Command Prompt:
   ```
   node --version
   npm --version
   ```

#### Linux (Ubuntu/Debian):
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

### Step 2: Download the Application

Same as Docker method - clone or download the repository.

### Step 3: Install Backend

```bash
# Navigate to backend folder
cd CMMS/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file and set:
# PORT=3000
# NODE_ENV=production
# JWT_SECRET=your-secure-random-string
# DB_PATH=./database.sqlite
# CORS_ORIGIN=http://localhost

# Build the backend
npm run build

# Start the backend
npm start
```

The backend will run on port 3000.

**To run backend in background on Linux:**
```bash
# Install PM2
sudo npm install -g pm2

# Start backend
cd backend
pm2 start npm --name "cmms-backend" -- start

# Make it auto-start on reboot
pm2 startup
pm2 save
```

**To run backend as Windows service:**
```powershell
# Install node-windows
npm install -g node-windows

# Create a service script (backend-service.js):
```

Then create `backend-service.js`:
```javascript
var Service = require('node-windows').Service;

var svc = new Service({
  name: 'CMMS Backend',
  description: 'CMMS Backend API Service',
  script: 'C:\\CMMS\\backend\\dist\\index.js'
});

svc.on('install', function(){
  svc.start();
});

svc.install();
```

### Step 4: Install Frontend

```bash
# Navigate to frontend folder
cd CMMS/frontend

# Install dependencies
npm install

# Build the frontend
npm run build

# The built files will be in the "dist" folder
```

### Step 5: Install and Configure Nginx

#### On Windows:
1. Download Nginx from: http://nginx.org/en/download.html
2. Extract to `C:\nginx`
3. Replace `C:\nginx\conf\nginx.conf` with the content below

#### On Linux:
```bash
# Install Nginx
sudo apt install nginx  # Ubuntu/Debian
# or
sudo yum install nginx  # CentOS/RHEL

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Nginx Configuration:**

Create/edit nginx config (Linux: `/etc/nginx/sites-available/cmms`, Windows: `C:\nginx\conf\nginx.conf`):

```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    root /path/to/CMMS/frontend/dist;  # Change this path!
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Linux:**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/cmms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

**Windows:**
```powershell
# Navigate to nginx folder
cd C:\nginx

# Test configuration
nginx.exe -t

# Start nginx
start nginx.exe
```

---

## Post-Installation Steps

### 1. Set Static IP Address (Recommended)

#### Windows:
1. Open Control Panel → Network and Sharing Center
2. Click on your network connection
3. Click "Properties"
4. Select "Internet Protocol Version 4 (TCP/IPv4)"
5. Click "Properties"
6. Select "Use the following IP address"
7. Enter:
   - IP address: `192.168.1.100` (choose an available IP)
   - Subnet mask: `255.255.255.0`
   - Default gateway: `192.168.1.1` (your router's IP)
   - DNS: `8.8.8.8` and `8.8.4.4`

#### Linux (Ubuntu with Netplan):
```bash
# Edit netplan configuration
sudo nano /etc/netplan/01-netcfg.yaml

# Add:
network:
  version: 2
  ethernets:
    eth0:  # or your interface name
      dhcp4: no
      addresses: [192.168.1.100/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]

# Apply changes
sudo netplan apply
```

### 2. Change Default Password

1. Login to application: http://your-server-ip
2. Login with `admin` / `admin123`
3. Go to Users section
4. Edit admin user
5. Change password to something secure

### 3. Create Additional Users

1. Go to Users page
2. Click "+ Add User"
3. Fill in details
4. Assign appropriate role
5. Give credentials to users

### 4. Configure Automatic Startup

#### Docker (Linux):
```bash
# Docker starts automatically by default
# To ensure containers restart on reboot:
docker compose up -d
# (The restart: unless-stopped in docker-compose.yml handles this)
```

#### Docker (Windows):
Docker Desktop starts automatically. Ensure "Start Docker Desktop when you log in" is enabled in Docker Desktop settings.

---

## Management Commands

### Docker Installation

```bash
# View logs
docker compose logs -f

# Stop application
docker compose down

# Restart application
docker compose restart

# Update application (after pulling new code)
docker compose down
git pull
docker compose up -d --build

# Backup database
cp data/database.sqlite data/backup-$(date +%Y%m%d).sqlite
```

### Manual Installation

```bash
# Backend (with PM2)
pm2 status              # Check status
pm2 logs cmms-backend  # View logs
pm2 restart cmms-backend  # Restart
pm2 stop cmms-backend  # Stop

# Nginx
sudo systemctl status nginx   # Check status
sudo systemctl restart nginx  # Restart
sudo systemctl stop nginx     # Stop
```

---

## Troubleshooting

### Can't access from other computers

1. **Check server is running:**
   ```bash
   docker ps  # Docker installation
   # or
   pm2 status  # Manual installation
   ```

2. **Check firewall:**
   ```bash
   # Windows: Check firewall rules in Windows Defender
   # Linux: sudo ufw status
   ```

3. **Ping the server:**
   ```bash
   # From another computer
   ping 192.168.1.100
   ```

4. **Check port is listening:**
   ```bash
   # Windows
   netstat -an | findstr :80

   # Linux
   sudo netstat -tlnp | grep :80
   ```

### Application not starting

1. **Check Docker logs:**
   ```bash
   docker compose logs
   ```

2. **Check disk space:**
   ```bash
   df -h  # Linux
   # or check in File Explorer (Windows)
   ```

3. **Rebuild containers:**
   ```bash
   docker compose down
   docker compose up -d --build
   ```

### Database errors

1. **Check permissions:**
   ```bash
   # Linux
   ls -la data/
   sudo chown -R $USER:$USER data/
   ```

2. **Reset database (WARNING: This deletes all data):**
   ```bash
   # Stop application
   docker compose down

   # Delete database
   rm data/database.sqlite

   # Restart (will create fresh database)
   docker compose up -d
   ```

### Port 80 already in use

If port 80 is already used by another application:

1. **Change port in docker-compose.yml:**
   ```yaml
   frontend:
     ports:
       - "8080:80"  # Change 80 to 8080 (or any available port)
   ```

2. **Access using new port:**
   ```
   http://192.168.1.100:8080
   ```

---

## System Requirements

### Minimum Requirements:
- CPU: 2 cores
- RAM: 2GB
- Disk: 5GB free space
- Network: 100 Mbps

### Recommended Requirements:
- CPU: 4 cores
- RAM: 4GB
- Disk: 20GB free space (SSD preferred)
- Network: Gigabit Ethernet

---

## Security Checklist

- [ ] Changed default admin password
- [ ] Changed JWT_SECRET in docker-compose.yml
- [ ] Configured firewall to allow only port 80
- [ ] Set up regular database backups
- [ ] Server has static IP address
- [ ] Created separate user accounts (not using admin for daily use)
- [ ] Server is in a secure location

---

## Support

If you encounter issues:
1. Check the logs: `docker compose logs`
2. Review this guide's troubleshooting section
3. Check the main README.md file
4. Verify all prerequisites are installed correctly

---

## Quick Reference

**Start Application (Docker):**
```bash
docker compose up -d
```

**Stop Application (Docker):**
```bash
docker compose down
```

**View Logs:**
```bash
docker compose logs -f
```

**Access Application:**
```
http://<server-ip>
Default: admin / admin123
```

**Backup Database:**
```bash
cp data/database.sqlite data/backup.sqlite
```

---

**Version:** 1.0.0
**Last Updated:** 2025
