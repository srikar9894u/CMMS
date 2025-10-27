# Fix Docker Database Access Issue

## Problem

After running `docker compose up -d`, you see:
- ✅ Containers are running
- ❌ Backend health check fails: `curl: Failed to connect to localhost port 3000`
- ❌ S7 setup fails: `Database not found at ../backend/database.sqlite`

## Root Causes

1. **Backend port not exposed**: docker-compose.yml was missing port mapping for backend
2. **Database path mismatch**: Docker uses `./data/database.sqlite` but scripts looked for `../backend/database.sqlite`
3. **Data directory doesn't exist**: The `./data` folder needs to be created

## Quick Fix (Recommended)

Run the initialization script:

```cmd
cd C:\Users\Srikar.Tanukula\CMMS
init-data-docker.bat
```

This will:
1. Create `data` directory
2. Copy existing database (if any)
3. Restart Docker with fixed configuration
4. Test backend health

## Manual Fix Steps

### 1. Stop Containers
```cmd
docker compose down
```

### 2. Create Data Directory
```cmd
mkdir data
```

### 3. Copy Database (if exists)
```cmd
copy backend\database.sqlite data\database.sqlite
```

### 4. Verify docker-compose.yml Has Port Mapping

Check that `backend` service has:
```yaml
services:
  backend:
    ports:
      - "3000:3000"
```

If not, add the `ports:` section under `backend` service.

### 5. Restart Containers
```cmd
docker compose up -d
```

### 6. Wait and Test
```cmd
timeout /t 10
curl http://localhost:3000/health
```

Expected output:
```json
{"status":"ok","database":"connected"}
```

## Verify Database Exists

### Check Docker Volume
```cmd
dir data
```

Should show:
```
database.sqlite
```

### Check Inside Container
```cmd
docker compose exec backend ls -la /data/
```

Should show:
```
database.sqlite
```

## If Database Still Missing

The backend creates the database automatically on startup. Check logs:

```cmd
docker compose logs backend
```

Look for:
```
Database initialized successfully
Created default admin user
Server running on port 3000
```

## After Fix: Run S7 Setup

Once backend health check passes:

```cmd
cd opc-service
python setup_s7_connection.py
python setup_s7_tags.py
```

Expected output:
```
✅ SUCCESS! S7-416 connection configured
```

## Troubleshooting

### Backend Health Still Failing

**Check if backend is running:**
```cmd
docker compose ps
```

**View backend logs:**
```cmd
docker compose logs backend
```

**Check port 3000 is free:**
```cmd
netstat -ano | findstr :3000
```

**Restart just backend:**
```cmd
docker compose restart backend
timeout /t 5
curl http://localhost:3000/health
```

### Database Permission Issues

**Windows - Run as Administrator:**
```cmd
# Right-click CMD and "Run as administrator"
cd C:\Users\Srikar.Tanukula\CMMS
docker compose down
rmdir /s data
mkdir data
docker compose up -d
```

**Check file permissions:**
```cmd
icacls data\database.sqlite
```

### Database Locked Error

```cmd
# Stop all services
docker compose down

# Remove lock file
del data\database.sqlite-shm
del data\database.sqlite-wal

# Restart
docker compose up -d
```

### Port 3000 Already in Use

**Find what's using the port:**
```cmd
netstat -ano | findstr :3000
```

**Kill the process:**
```cmd
taskkill /PID <pid> /F
```

**Or change CMMS backend port in docker-compose.yml:**
```yaml
backend:
  ports:
    - "3001:3000"  # Use 3001 on host, 3000 in container
```

Then use: `curl http://localhost:3001/health`

## Database Paths Reference

| Context | Database Path | Notes |
|---------|--------------|-------|
| **Docker backend** | `/data/database.sqlite` | Inside container |
| **Docker volume** | `./data/database.sqlite` | On host (from CMMS root) |
| **Setup scripts** | `../data/database.sqlite` | From opc-service folder |
| **Local npm** | `backend/database.sqlite` | When running without Docker |

## Environment Variables

Override database path:

### Windows CMD:
```cmd
set DB_PATH=../data/database.sqlite
python setup_s7_connection.py
```

### PowerShell:
```powershell
$env:DB_PATH="../data/database.sqlite"
python setup_s7_connection.py
```

## Complete Reset (Last Resort)

**⚠️ WARNING: This deletes your database!**

```cmd
docker compose down -v
rmdir /s data
docker compose build --no-cache
docker compose up -d
```

This creates a fresh database with default admin user (admin/admin123).

## After Successful Fix

1. ✅ Test backend: `curl http://localhost:3000/health`
2. ✅ Test frontend: Open http://localhost in browser
3. ✅ Login: admin / admin123
4. ✅ Setup S7-416: `python opc-service\setup_s7_connection.py`
5. ✅ Start monitoring: `python opc-service\s7_service.py`

## Need More Help?

Check these files for details:
- `DOCKER_UPDATE_GUIDE.md` - Updating Docker setup
- `S7-416_CONNECTIVITY_GUIDE.md` - PLC connection help
- `TROUBLESHOOTING_LOGIN.md` - Login issues
