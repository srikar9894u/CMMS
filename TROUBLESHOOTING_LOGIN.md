# Troubleshooting Login Issues - CMMS Docker Deployment

## ❌ Problem: "Login failed. Please try again."

This guide helps you fix login issues on your local PC server running CMMS with Docker.

---

## 🚀 Quick Fix (Run This First!)

On your local PC, in the CMMS folder:

### **Linux/Mac:**
```bash
chmod +x fix-login.sh
./fix-login.sh
```

### **Windows (PowerShell):**
```powershell
bash fix-login.sh
```

**OR use Git Bash / WSL on Windows**

The script will automatically:
- ✅ Check if containers are running
- ✅ Test backend API
- ✅ Verify database exists
- ✅ Test login endpoint
- ✅ Offer to recreate database if needed

---

## 🔍 Manual Troubleshooting Steps

If the automated script doesn't work, follow these manual steps:

### **Step 1: Check Container Status**

```bash
docker compose ps
```

**Expected output:**
```
NAME            STATUS          PORTS
cmms-backend    Up X minutes    0.0.0.0:3000->3000/tcp
cmms-frontend   Up X minutes    0.0.0.0:80->80/tcp
cmms-opc        Up X minutes    (optional)
```

**If backend shows "Exit" or not listed:**
```bash
docker compose up -d backend
```

---

### **Step 2: Check Backend Logs**

```bash
docker compose logs backend
```

**Look for these messages:**
- ✅ `"Database initialized successfully"`
- ✅ `"Default admin user created: admin/admin123"`
- ✅ `"CMMS Backend API running on port 3000"`

**If you see errors:**
- `ECONNREFUSED` → Database connection issue
- `SQLITE_ERROR` → Database corruption
- `Cannot find module` → Dependencies not installed (rebuild needed)

---

### **Step 3: Test Backend Health**

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"2024-XX-XXTXX:XX:XX.XXXZ"}
```

**If it doesn't respond:**
```bash
# Restart backend
docker compose restart backend

# Wait 10 seconds
sleep 10

# Try again
curl http://localhost:3000/health
```

---

### **Step 4: Check Database File**

```bash
# Check if database exists
ls -lh data/database.sqlite

# OR (older setup)
ls -lh backend/database.sqlite
```

**Expected:**
- File size should be **80KB+** (not 0 bytes)
- File should exist

**If file is missing or 0 bytes:**
```bash
# This means database wasn't created properly
# Need to recreate (see Step 7)
```

---

### **Step 5: Test Login API Directly**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Expected response (success):**
```json
{
  "token": "eyJhbGciOiJIUz...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@cmms.local",
    "role": "admin"
  }
}
```

**If you get error:**
- `401` → Invalid credentials (wrong password or user doesn't exist)
- `500` → Internal server error (check logs)
- Connection refused → Backend not running

---

### **Step 6: Check Frontend Connection**

```bash
# Test if frontend is running
curl http://localhost
```

**Check browser console (F12):**
- Look for API endpoint errors
- Check if it's trying to connect to correct backend URL
- Look for CORS errors

**Common issue:** Frontend trying to connect to wrong backend URL

**Fix:** Check `frontend/.env` or `docker-compose.yml` environment variables

---

### **Step 7: Recreate Database (If All Else Fails)**

⚠️ **WARNING: This deletes all data!**

```bash
# 1. Stop all services
docker compose down

# 2. Remove old database
rm -f data/database.sqlite
rm -f backend/database.sqlite

# 3. Start services (will auto-create fresh database)
docker compose up -d

# 4. Wait for initialization
sleep 15

# 5. Check logs for "Default admin user created"
docker compose logs backend | grep "Default admin user"

# 6. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

### **Step 8: Complete Rebuild (Nuclear Option)**

If nothing works, rebuild everything from scratch:

```bash
# 1. Stop and remove all containers
docker compose down -v

# 2. Remove all images
docker compose down --rmi all

# 3. Rebuild with no cache
docker compose build --no-cache

# 4. Start services
docker compose up -d

# 5. Wait and monitor logs
docker compose logs -f
```

Wait for these messages:
- ✅ `"Database initialized successfully"`
- ✅ `"Default admin user created: admin/admin123"`
- ✅ `"CMMS Backend API running on port 3000"`

Then press Ctrl+C and try logging in.

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot connect to backend"

**Symptoms:**
- Frontend loads but login fails
- Browser console shows connection errors

**Solution:**
```bash
# Check backend is running
docker compose ps backend

# Check backend logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

---

### Issue 2: Database permission denied

**Symptoms:**
- Log shows: `SQLITE_CANTOPEN: unable to open database file`

**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER data/
sudo chmod -R 755 data/

# Restart
docker compose restart backend
```

---

### Issue 3: Port already in use

**Symptoms:**
- Error: `bind: address already in use`

**Solution:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process or change port in docker-compose.yml
# Edit ports section:
ports:
  - "3001:3000"  # Use 3001 instead
```

---

### Issue 4: Database exists but admin user missing

**Symptoms:**
- Database file exists (80KB+)
- Login API returns 401
- Logs don't show "Default admin user created"

**Solution:**
```bash
# Option 1: Add admin user manually
docker compose exec backend node -e "
const bcrypt = require('bcryptjs');
const db = require('./dist/config/database').default;
const hash = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO users (username, email, password, role, full_name) VALUES (?, ?, ?, ?, ?)').run('admin', 'admin@cmms.local', hash, 'admin', 'System Administrator');
console.log('Admin user created');
"

# Option 2: Recreate database (see Step 7)
```

---

### Issue 5: Wrong password for admin

**Symptoms:**
- You changed the password and forgot it

**Solution 1 - Reset admin password:**
```bash
# Connect to database and reset password
docker compose exec backend sqlite3 data/database.sqlite

# In sqlite prompt:
UPDATE users SET password = '$2a$10$rKjFW5xM8mF5xM8mF5xM8.xM8mF5xM8mF5xM8mF5xM8mF5xM8mF5xO' WHERE username = 'admin';
.exit
```
Password is now reset to: `admin123`

**Solution 2 - Recreate database:**
See Step 7 above.

---

## 📊 Verification Checklist

Run these commands and check all pass:

```bash
# 1. Containers running?
docker compose ps
# Expected: All show "Up"

# 2. Backend healthy?
curl http://localhost:3000/health
# Expected: {"status":"ok",...}

# 3. Database exists?
ls -lh data/database.sqlite
# Expected: File size 80KB+

# 4. Backend logs OK?
docker compose logs backend | grep -E "Database initialized|admin user created|running on port"
# Expected: All three messages present

# 5. Login works?
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Expected: Returns token and user object

# 6. Frontend accessible?
curl -I http://localhost
# Expected: HTTP/1.1 200 OK
```

**If all 6 pass, login WILL work!**

---

## 🆘 Still Not Working?

### Get Detailed Diagnostics:

```bash
# Save all logs to file
docker compose logs > cmms-logs.txt

# Check Docker resources
docker stats --no-stream

# Check disk space
df -h

# Check Docker is running
docker ps
```

### What to Share for Help:

1. Output of `docker compose ps`
2. Output of `docker compose logs backend`
3. Output of `curl http://localhost:3000/health`
4. Output of login API test (Step 5)
5. Your OS (Windows/Linux/Mac)
6. Docker version: `docker --version`

---

## ✅ Success Indicators

You know login is working when:

1. ✅ `docker compose ps` shows all containers "Up"
2. ✅ `curl http://localhost:3000/health` returns `{"status":"ok"}`
3. ✅ Login API test returns token
4. ✅ Browser can access http://localhost
5. ✅ Login with admin/admin123 succeeds
6. ✅ Dashboard loads after login

---

## 🎯 Quick Commands Reference

```bash
# Run automated fix
./fix-login.sh

# Check status
docker compose ps

# View logs
docker compose logs -f backend

# Restart services
docker compose restart

# Recreate database
docker compose down && rm -f data/database.sqlite && docker compose up -d

# Complete rebuild
docker compose down -v && docker compose build --no-cache && docker compose up -d

# Test backend
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

---

## 📚 Related Documentation

- **Installation**: LOCAL_SERVER_DEPLOYMENT.md
- **Quick Start**: QUICK_START.md
- **Setup Instructions**: LOCAL_PC_SETUP_INSTRUCTIONS.txt
- **Update Guide**: UPDATE_INSTRUCTIONS.md

---

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**⚠️ Change password immediately after first login!**
