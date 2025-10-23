# CMMS - Computerized Maintenance Management System

Complete web-based maintenance management system with real-time OPC UA connectivity for industrial asset monitoring.

## 🚀 One-Command Installation

Install everything automatically with a single command:

```bash
chmod +x install.sh && ./install.sh
```

**That's it!** The script will:
- ✅ Automatically install Docker & Docker Compose
- ✅ Automatically install all dependencies
- ✅ Automatically build all containers
- ✅ Automatically start all services
- ✅ Automatically create database

**Access CMMS at:** http://localhost

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**⏱️ Installation Time:** 5-10 minutes (first time)

---

## 📋 Features

### Core CMMS Features
- ✅ **Asset Management** - Track equipment, locations, criticality
- ✅ **Work Order Management** - Create, assign, track maintenance tasks
- ✅ **Preventive Maintenance** - Schedule recurring maintenance
- ✅ **52-Week Calendar** - Visual PM schedule with quarterly layout
- ✅ **Inventory Management** - Parts, stock levels, suppliers
- ✅ **Leave Management** - Employee leave requests and approvals
- ✅ **Reports** - Work orders, PM compliance, inventory, downtime
- ✅ **User Management** - Role-based access control
- ✅ **Auto-Assignment** - Intelligent work order distribution

### OPC UA Connectivity
- 🔌 **Real-Time Monitoring** - Live asset status from PLCs
- 🏭 **Multi-PLC Support** - Siemens, Allen Bradley, Schneider, Mitsubishi, Generic OPC UA
- 📊 **Status Dashboard** - Auto-refresh monitoring
- 📈 **Historical Logging** - Track status changes
- ⚡ **Inverted Logic Support** - Reverse bit logic (0=ON, 1=OFF)
- 🔄 **Auto-Reconnect** - Automatic failure recovery

### User Experience
- 🎨 **5 Themes** - Light, Dark, Blue, Green, Purple
- 📱 **Fully Responsive** - Mobile, tablet, desktop
- 🌐 **Modern UI** - Tailwind CSS
- 🔐 **Secure** - JWT authentication

---

## 🛠️ Management Commands

All commands are fully automated - no manual steps!

### Start Services
```bash
./start.sh
```

### Stop Services
```bash
./stop.sh
```

### Update to Latest Version
```bash
./update.sh
```
*Automatically pulls code, rebuilds, and restarts everything*

### View Logs
```bash
docker-compose logs -f
```

---

## 🔌 OPC Setup (5-Minute Guide)

1. **Login as Admin** → http://localhost
2. **Go to OPC Configuration** → `/opc-config`
3. **Click "Show Examples"** → See connection formats
4. **Add Connection:**
   - Select Asset
   - Choose PLC Type
   - Enter Server URL (e.g., `opc.tcp://192.168.1.10:4840`)
5. **Add Tags:**
   - Running tag: `ns=3;s="DB1"."Running"`
   - Trip tag: `ns=3;s="DB1"."Trip"`
   - Off tag: `ns=3;s="DB1"."Stop"`
6. **Monitor** → `/real-time-status`

**Detailed Guide:** See `OPC_CONNECTIVITY_GUIDE.md`

---

## 📚 Documentation

- **`README.md`** - This file (quick start)
- **`OPC_CONNECTIVITY_GUIDE.md`** - Complete OPC guide
- **`UPDATE_INSTRUCTIONS.md`** - Update & troubleshooting
- **`opc-service/README.md`** - OPC service details

---

## 🚨 Troubleshooting

### Services Won't Start
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### View Logs
```bash
docker-compose logs backend
docker-compose logs opc-service
```

### Reset Everything
```bash
docker-compose down -v
./install.sh
```

---

## 📈 System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 2 GB
- Disk: 5 GB

**Recommended:**
- CPU: 4 cores
- RAM: 4 GB
- Disk: 20 GB

---

## 🎉 Quick Reference

### URLs
- **Frontend:** http://localhost
- **Backend API:** http://localhost:3000
- **OPC Config:** http://localhost/opc-config
- **Real-Time Status:** http://localhost/real-time-status

### Commands
```bash
./install.sh          # First-time install
./start.sh            # Start services
./stop.sh             # Stop services
./update.sh           # Update CMMS
```

### Credentials
- **User:** admin
- **Pass:** admin123
- **⚠️ Change after first login!**

---

**Built with:** Node.js • React • SQLite • Python • Docker • OPC UA

**Perfect for:** Manufacturing • Facilities • Industrial Maintenance
