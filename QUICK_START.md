# CMMS Quick Start Guide

The fastest way to get CMMS running on your server PC.

## 5-Minute Setup (Docker Method)

### 1. Install Docker

**Windows:**
- Download: https://www.docker.com/products/docker-desktop
- Run installer and restart computer
- Verify: Open Command Prompt and type `docker --version`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Log out and back in
```

### 2. Download CMMS

**Option A - Using Git:**
```bash
git clone https://github.com/srikar9894u/CMMS.git
cd CMMS
git checkout claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
```

**Option B - Download ZIP:**
- Download ZIP from GitHub
- Extract to a folder
- Open terminal/command prompt in that folder

### 3. Start the Application

```bash
# Create data folder
mkdir data

# Start CMMS
docker compose up -d
```

Wait 5-10 minutes for first-time build.

### 4. Open Firewall Port

**Windows (PowerShell as Admin):**
```powershell
New-NetFirewallRule -DisplayName "CMMS" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

**Linux:**
```bash
sudo ufw allow 80/tcp
```

### 5. Find Your Server IP

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Linux:**
```bash
hostname -I
```

### 6. Access CMMS

1. Open browser on any computer on your network
2. Go to: `http://YOUR-SERVER-IP`
3. Login:
   - Username: `admin`
   - Password: `admin123`

## ✅ That's it! You're done!

---

## Important First Steps

### Change Default Password
1. Click on your username (top right)
2. Change password from `admin123` to something secure

### Create Your First Asset
1. Click "Assets" in sidebar
2. Click "+ Add Asset"
3. Fill in equipment details

### Create Your First Work Order
1. Click "Work Orders" in sidebar
2. Click "+ New Work Order"
3. Assign to yourself or a technician

---

## Common Commands

```bash
# Stop CMMS
docker compose down

# Start CMMS
docker compose up -d

# View logs
docker compose logs

# Restart CMMS
docker compose restart

# Update CMMS (after pulling new code)
docker compose down
git pull
docker compose up -d --build
```

---

## Troubleshooting

**Can't access from other computers?**
- Check firewall is open (step 4)
- Make sure computers are on same network
- Try accessing from server first: http://localhost

**Port 80 already in use?**
Edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8080:80"  # Change to 8080
```
Then access: `http://YOUR-SERVER-IP:8080`

**Forgot admin password?**
```bash
# Stop app
docker compose down

# Delete database (WARNING: Deletes all data!)
rm data/database.sqlite

# Restart (creates fresh database with default password)
docker compose up -d
```

---

## Get Full Details

See `INSTALLATION_GUIDE.md` for complete installation instructions including manual installation, static IP setup, and advanced configuration.

---

**Default Login:** admin / admin123
**Change this immediately after first login!**
