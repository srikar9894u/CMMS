# CMMS - Fully Automated Setup Guide

## One-Command Deployment

Everything is now fully automated. No manual Python scripts needed!

```cmd
cd C:\Users\Srikar.Tanukula\CMMS
update-docker.bat
```

That's it! This single command will:
- ✅ Pull latest code
- ✅ Create data directory
- ✅ Build all containers with snap7 included
- ✅ Start all services (backend, frontend, OPC/S7)
- ✅ Initialize database automatically

---

## What's Included

### Services Running Automatically in Docker:

1. **Backend API** (Port 3000)
   - User authentication
   - Asset management
   - Work order system
   - PLC configuration APIs

2. **Frontend Web App** (Port 80)
   - Dashboard UI
   - Asset monitoring
   - PLC configuration pages

3. **PLC Integration Services**
   - OPC UA service (for S7-1200/1500 with OPC UA)
   - S7 Protocol service (for S7-300/400/416 direct connection)
   - Both run automatically in Docker
   - No manual scripts needed!

---

## Configure PLCs from Dashboard

### Option 1: S7 Protocol (Direct Connection)

**For S7-300, S7-400, S7-416 PLCs:**

1. Open browser: **http://localhost**
2. Login: **admin / admin123**
3. Go to: **S7 PLC Configuration** (in sidebar)
4. Click: **+ Add S7 Connection**
5. Fill in:
   - Name: `S7-416 Production PLC`
   - PLC Type: `Siemens S7-400 (S7-416, etc.)`
   - IP Address: `192.168.10.10`
   - Rack: `0`
   - Slot: `3`
   - Polling Interval: `5000` ms
   - Enabled: ✅
6. Click: **Create Connection**

### Option 2: OPC UA Protocol

**For S7-1200, S7-1500, or any PLC with OPC UA:**

1. Open browser: **http://localhost**
2. Login: **admin / admin123**
3. Go to: **OPC Configuration** (in sidebar)
4. Click: **+ Add OPC Connection**
5. Fill in:
   - Name: `S7-1500 PLC`
   - PLC Type: `Siemens (S7-1200/1500)`
   - Server URL: `opc.tcp://192.168.1.10:4840`
   - Enabled: ✅
6. Click: **Create Connection**

---

## Configure Tag Mappings from Dashboard

### Add Tag Mappings:

1. In **S7 PLC Configuration** or **OPC Configuration** page
2. Find your PLC connection
3. Click: **Tags** button
4. In the "Add New Tag" section:
   - Select Asset (e.g., "Hammer Mill Motor")
   - Tag Type: `Running Status`
   - Tag Name: `Motor_1_Running`
   - Tag Address: `DB1.DBX0.0`
   - Click: **Add Tag**
5. Repeat for other tags:
   - Trip status: `DB1.DBX0.1`
   - Off status: `DB1.DBX0.2`

### S7 Tag Address Examples:

| Type | Format | Example | Description |
|------|--------|---------|-------------|
| Data Block Bit | `DB#.DBX#.#` | `DB1.DBX0.0` | DB 1, Byte 0, Bit 0 |
| Data Block Word | `DB#.DBW#` | `DB1.DBW2` | DB 1, Word at byte 2 |
| Memory Bit | `M#.#` | `M0.0` | Memory bit 0.0 |
| Input Bit | `I#.#` | `I0.0` | Input bit 0.0 |
| Output Bit | `Q#.#` | `Q0.0` | Output bit 0.0 |

---

## View Real-Time Status

1. Go to: **Real-Time Status** (in sidebar)
2. See all connected assets
3. Green = Running
4. Red = Tripped/Fault
5. Gray = Off/Stopped

---

## Directory Structure

```
CMMS/
├── backend/          # Node.js backend API
├── frontend/         # React frontend
├── opc-service/      # PLC integration services
│   ├── opc_service_v2.py    # OPC UA service
│   ├── s7_service.py        # S7 protocol service
│   ├── start_services.sh    # Auto-start both services
│   └── Dockerfile           # Includes snap7 library
├── data/             # SQLite database (auto-created)
│   └── database.sqlite
├── docker-compose.yml
└── update-docker.bat # One-command deployment

```

---

## Key Features

### ✅ Fully Automated
- No manual Python scripts
- No snap7.dll manual installation
- No database setup commands
- Everything in Docker

### ✅ Web-Based Configuration
- Add PLCs through dashboard
- Configure tag mappings through UI
- Enable/disable connections on the fly
- Real-time status monitoring

### ✅ Supports Multiple PLC Protocols
- **S7 Protocol**: Direct connection to S7-300/400/416
- **OPC UA**: For S7-1200/1500 and other modern PLCs
- Both services run simultaneously
- Configure both types through web UI

### ✅ Production Ready
- Automatic restart on failure
- Database persistence
- Logging and monitoring
- Secure authentication

---

## Troubleshooting

### Backend not accessible?

```cmd
docker compose ps
```

Should show all 3 containers running.

### Check logs:

```cmd
docker compose logs backend
docker compose logs frontend
docker compose logs opc-service
```

### Restart services:

```cmd
docker compose restart
```

### Complete reset:

```cmd
docker compose down -v
update-docker.bat
```

### PLC not connecting?

1. **Test network connectivity:**
   ```cmd
   ping 192.168.10.10
   ```

2. **Check PLC settings in dashboard:**
   - IP address correct?
   - Rack/Slot correct?
   - Connection enabled?

3. **Check logs:**
   ```cmd
   docker compose logs opc-service
   ```
   Look for S7 service connection attempts

4. **Verify firewall:**
   - S7 protocol uses port 102
   - OPC UA typically uses port 4840

---

## Update to Latest Version

```cmd
cd C:\Users\Srikar.Tanukula\CMMS
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
update-docker.bat
```

---

## Quick Reference

| Task | Command/URL |
|------|-------------|
| **Deploy** | `update-docker.bat` |
| **Access CMMS** | http://localhost |
| **Login** | admin / admin123 |
| **Configure S7 PLCs** | Settings → S7 PLC Configuration |
| **Configure OPC UA** | Settings → OPC Configuration |
| **View Status** | Dashboard → Real-Time Status |
| **Check Logs** | `docker compose logs -f` |
| **Restart** | `docker compose restart` |
| **Stop** | `docker compose down` |
| **Start** | `docker compose up -d` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                           │
│                   http://localhost                       │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│  Frontend Container (Nginx + React)                     │
│  Port 80                                                │
└────────────┬───────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│  Backend Container (Node.js + Express)                  │
│  Port 3000                                              │
│  APIs:                                                  │
│    /api/s7/*         → S7 PLC management               │
│    /api/opc/*        → OPC UA management               │
│    /api/assets/*     → Asset management                │
└────────────┬───────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│  Shared Volume: /data/database.sqlite                   │
└────────────┬───────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│  OPC-Service Container (Python)                         │
│  Services:                                              │
│    • OPC UA Service (opc_service_v2.py)                │
│    • S7 Service (s7_service.py)                        │
│  Libraries:                                             │
│    • asyncua (OPC UA)                                   │
│    • python-snap7 + libsnap7.so (S7 Protocol)          │
└────────────┬───────────────────────────────────────────┘
             │
             ↓
      ┌──────┴──────┐
      │             │
      ↓             ↓
┌─────────┐   ┌──────────┐
│ S7-416  │   │ S7-1500  │
│  (S7)   │   │ (OPC UA) │
└─────────┘   └──────────┘
```

---

## What Changed from Manual Setup

### Before (Manual):
```cmd
# Install snap7 manually
install_snap7_windows.bat

# Configure PLC manually
python setup_s7_connection.py
python setup_s7_tags.py

# Start service manually
python s7_service.py
```

### After (Fully Automated):
```cmd
# One command does everything
update-docker.bat

# Configure through web UI
# ✅ No Python scripts
# ✅ No manual installation
# ✅ Everything through dashboard
```

---

## Next Steps

1. **Deploy:**
   ```cmd
   update-docker.bat
   ```

2. **Login:**
   - URL: http://localhost
   - User: admin
   - Pass: admin123

3. **Add Your S7-416 PLC:**
   - Go to "S7 PLC Configuration"
   - Add connection (IP: 192.168.10.10, Rack: 0, Slot: 3)

4. **Map Your Assets:**
   - Click "Tags" on the PLC
   - Add tag mappings for your Hammer Mill Motor and Hammer Mill

5. **Monitor:**
   - Go to "Real-Time Status"
   - See live updates from your PLC!

---

## Support

- All configuration through web interface
- No command-line required
- No manual scripts
- Logs available: `docker compose logs`

**That's it! Everything is automated!** 🚀
