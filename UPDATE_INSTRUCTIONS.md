# CMMS Update Instructions

Complete guide to update your CMMS installation with the latest features including OPC UA connectivity.

## Quick Update (Docker - Recommended)

If you're using Docker, this is the easiest method:

### Step 1: Pull Latest Code
```bash
cd /path/to/CMMS
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
```

### Step 2: Run Update Script
```bash
chmod +x update.sh
./update.sh
```

That's it! The script will:
- Pull latest code
- Stop all services
- Rebuild containers with new dependencies
- Start all services including new OPC service
- Show service status

### Step 3: Verify Installation
```bash
# Check all services are running
docker-compose ps

# Should show:
# cmms-backend    - running
# cmms-frontend   - running
# cmms-opc        - running

# View logs
docker-compose logs -f opc-service
```

### Access Updated Application
- Frontend: http://localhost
- Backend API: http://localhost:3000
- OPC Configuration: http://localhost/opc-config
- Real-Time Status: http://localhost/real-time-status

---

## Manual Update (Without Docker)

If you're running CMMS manually without Docker:

### Step 1: Pull Latest Code
```bash
cd /path/to/CMMS
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
```

### Step 2: Update Backend

```bash
cd backend

# Install new dependencies (automatically installs new packages)
npm install

# The database will auto-migrate when backend starts
# No manual migration needed!

# Rebuild TypeScript
npm run build

# Restart backend (if running with PM2)
pm2 restart cmms-backend

# Or if running manually, stop and restart:
# Ctrl+C to stop
npm start
```

### Step 3: Update Frontend

```bash
cd frontend

# Install new dependencies
npm install

# Rebuild production bundle
npm run build

# If using nginx, copy built files
sudo cp -r dist/* /var/www/html/

# Or if using development server, restart:
npm run dev
```

### Step 4: Install OPC Service (NEW)

```bash
cd opc-service

# Install Python (if not already installed)
# Ubuntu/Debian:
sudo apt update
sudo apt install python3 python3-pip -y

# Install Python dependencies
pip3 install -r requirements.txt

# Test run (Ctrl+C to stop)
python3 opc_client.py

# Install as system service for auto-start
sudo nano /etc/systemd/system/cmms-opc.service
```

**Add this content to cmms-opc.service:**
```ini
[Unit]
Description=CMMS OPC UA Service
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/CMMS/opc-service
Environment="DB_PATH=/path/to/CMMS/backend/database.sqlite"
ExecStart=/usr/bin/python3 opc_client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start the service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable cmms-opc
sudo systemctl start cmms-opc

# Check status
sudo systemctl status cmms-opc

# View logs
sudo journalctl -u cmms-opc -f
```

### Step 5: Verify Database Migration

The database automatically migrates when backend starts. Verify:

```bash
sqlite3 backend/database.sqlite

# Check new tables exist
.tables

# Should show:
# opc_connections
# opc_tags
# asset_status_log

# Check new columns in assets table
PRAGMA table_info(assets);

# Should include:
# real_time_status
# last_opc_update

.quit
```

---

## What's New in This Update

### 1. OPC UA Connectivity
- **Real-time asset monitoring** from PLCs
- Support for **5 PLC types**: Siemens, Allen Bradley, Schneider, Mitsubishi, Generic OPC UA
- **Python OPC service** for PLC communication
- **Tag mapping** for Running/Trip/Off status
- **Inverted logic support** for reverse bit logic

### 2. New Frontend Pages
- **OPC Configuration** (`/opc-config`) - Admin/Manager only
- **Real-Time Status Dashboard** (`/real-time-status`) - All users

### 3. Database Changes
- **4 new tables**: opc_connections, opc_tags, asset_status_log
- **2 new columns** in assets table: real_time_status, last_opc_update
- **Auto-migration** on backend startup

### 4. New Dependencies

**Backend (Node.js):**
- No new npm packages (uses existing dependencies)

**Frontend (React):**
- No new npm packages (uses existing dependencies)

**OPC Service (Python - NEW):**
- opcua==0.98.13
- asyncua==1.0.4
- requests==2.31.0
- python-dotenv==1.0.0

---

## Troubleshooting

### Issue: Docker build fails

**Solution:**
```bash
# Clean rebuild
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Database migration doesn't run

**Solution:**
Database migrations run automatically when backend starts. Check backend logs:
```bash
# Docker
docker-compose logs backend | grep -i "Added.*column"

# Manual
# Look for messages like:
# "Added real_time_status column to assets table"
# "Added last_opc_update column to assets table"
```

### Issue: OPC service won't start

**Check Python version:**
```bash
python3 --version
# Need Python 3.8 or higher
```

**Check dependencies:**
```bash
cd opc-service
pip3 install -r requirements.txt
```

**Check database path:**
```bash
# Verify DB_PATH environment variable points to correct location
echo $DB_PATH

# Should be: /path/to/CMMS/backend/database.sqlite
```

**View OPC service logs:**
```bash
# Docker
docker-compose logs -f opc-service

# Systemd
sudo journalctl -u cmms-opc -f

# Manual
cat opc-service/opc_service.log
```

### Issue: Frontend shows old version

**Clear browser cache:**
- Press Ctrl+Shift+R (Windows/Linux)
- Press Cmd+Shift+R (Mac)

**Verify build:**
```bash
cd frontend
npm run build
ls -la dist/
# Should see updated files
```

### Issue: New pages (OPC Config) not showing

**Check routing:**
```bash
# Verify new routes in App.tsx
grep -i "opc" frontend/src/App.tsx

# Should show:
# import OPCConfiguration from './pages/OPCConfiguration';
# import RealTimeStatus from './pages/RealTimeStatus';
```

**Rebuild frontend:**
```bash
cd frontend
npm run build
```

---

## Verify Update Success

### 1. Check Backend
```bash
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"..."}

# Check OPC endpoint
curl http://localhost:3000/api/opc/connections
# Should return: [] (empty array if no connections configured)
```

### 2. Check Frontend
- Open browser: http://localhost
- Login with admin credentials
- Check navigation menu shows:
  - ✅ Real-Time Status (all users)
  - ✅ OPC Configuration (admin/manager only)
- Navigate to Real-Time Status page
- Navigate to OPC Configuration page

### 3. Check OPC Service
```bash
# Docker
docker-compose logs opc-service | tail -20

# Should show:
# "OPC Monitoring Service Starting..."
# "Found X active OPC connections"

# Systemd
sudo systemctl status cmms-opc

# Should show: active (running)
```

### 4. Check Database
```bash
sqlite3 backend/database.sqlite "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'opc%';"

# Should return:
# opc_connections
# opc_tags
```

---

## Rollback (If Needed)

If you need to rollback to previous version:

```bash
# Stop services
docker-compose down
# or
pm2 stop all

# Restore previous code
git log --oneline
git checkout <previous-commit-hash>

# Rebuild
docker-compose build --no-cache
docker-compose up -d
# or
cd backend && npm install && npm run build && npm start
cd frontend && npm install && npm run build
```

**Note:** Database changes are backward compatible. The old version will simply ignore the new tables/columns.

---

## Performance Notes

### OPC Service Resource Usage
- **CPU**: Low (async architecture)
- **Memory**: ~50-100MB for 100 connections
- **Network**: Minimal (configurable polling)

### Recommended Polling Intervals
- Critical assets: 3-5 seconds
- Normal monitoring: 5-10 seconds
- Low priority: 30-60 seconds

### Database Size
- Status logs grow over time
- ~1MB per 10,000 status changes
- Consider cleanup after 90 days:
  ```sql
  DELETE FROM asset_status_log WHERE timestamp < datetime('now', '-90 days');
  ```

---

## Post-Update Steps

### 1. Configure First OPC Connection
1. Login as admin
2. Go to OPC Configuration
3. Click examples to see connection formats
4. Add your first PLC connection
5. Configure tags
6. Monitor on Real-Time Status page

### 2. Install UaExpert (Optional but Recommended)
- Download: https://www.unified-automation.com/products/development-tools/uaexpert.html
- Use to browse PLC OPC servers
- Find exact tag addresses
- Test connections before adding to CMMS

### 3. Read Documentation
- `OPC_CONNECTIVITY_GUIDE.md` - Complete OPC guide
- `opc-service/README.md` - OPC service details

---

## Support

### Check Logs

**Docker:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f opc-service
```

**Manual:**
```bash
# Backend
pm2 logs cmms-backend

# OPC Service
tail -f opc-service/opc_service.log
```

### Common Files to Check
- `backend/database.sqlite` - Database
- `backend/src/routes/opc.routes.ts` - OPC API
- `opc-service/opc_client.py` - OPC service
- `frontend/src/pages/OPCConfiguration.tsx` - Config UI
- `frontend/src/pages/RealTimeStatus.tsx` - Status UI

### Get Help
- Check `OPC_CONNECTIVITY_GUIDE.md` for detailed OPC documentation
- Review `opc-service/README.md` for PLC-specific examples
- Check logs for error messages

---

## Success Checklist

After update, verify:

- [ ] Backend starts without errors
- [ ] Frontend loads and shows login page
- [ ] Can login successfully
- [ ] Dashboard shows all existing data
- [ ] "Real-Time Status" appears in navigation
- [ ] "OPC Configuration" appears for admin/manager
- [ ] Can access OPC Configuration page
- [ ] Can access Real-Time Status page
- [ ] OPC service is running (check logs)
- [ ] Database has new tables (opc_connections, opc_tags, asset_status_log)
- [ ] Assets table has new columns (real_time_status, last_opc_update)

If all items checked, update successful! 🎉

---

## Next Steps

1. **Configure PLCs**: Enable OPC UA servers on your PLCs
2. **Find Tag Addresses**: Use UaExpert to browse PLC tags
3. **Add Connections**: Configure PLC connections in CMMS
4. **Monitor Assets**: Watch real-time status updates
5. **Optimize Polling**: Adjust intervals based on needs

For detailed PLC configuration examples, see `OPC_CONNECTIVITY_GUIDE.md`.
