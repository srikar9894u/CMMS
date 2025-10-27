# CMMS Docker Update Guide

## Quick Update (Recommended)

### For Windows:
```cmd
cd C:\Users\Srikar.Tanukula\CMMS
update-docker.bat
```

This script will:
1. Pull latest code from Git
2. Stop all containers
3. Pull latest base images
4. Rebuild containers (fresh, no cache)
5. Start all services
6. Verify they're running

---

## Manual Update Commands

### Full Fresh Rebuild (No Cache):
```cmd
cd C:\Users\Srikar.Tanukula\CMMS
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
docker compose down
docker compose pull
docker compose build --no-cache
docker compose up -d
```

### Quick Rebuild (Uses Cache):
```cmd
cd C:\Users\Srikar.Tanukula\CMMS
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr
docker compose down
docker compose build
docker compose up -d
```

### Update Single Service:
```cmd
# Update only backend:
docker compose build --no-cache backend
docker compose up -d backend

# Update only frontend:
docker compose build --no-cache frontend
docker compose up -d frontend
```

---

## After Update: Verify Services

### Check Container Status:
```cmd
docker compose ps
```

### Check Logs:
```cmd
# All services:
docker compose logs

# Specific service:
docker compose logs backend
docker compose logs frontend

# Follow logs (live):
docker compose logs -f
```

### Test Backend Health:
```cmd
curl http://localhost:3000/health
```

### Test Frontend:
Open browser: http://localhost:5173

---

## Common Update Scenarios

### 1. Code Changes Only (Fast):
```cmd
docker compose restart
```

### 2. Dependencies Changed (npm/pip):
```cmd
docker compose build
docker compose up -d
```

### 3. Database Schema Changes:
```cmd
# Backup first!
copy backend\database.sqlite backend\database.sqlite.backup

# Then rebuild:
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

### 4. Complete Fresh Start:
```cmd
# WARNING: Deletes database!
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## Troubleshooting

### Update Failed - Port Already in Use:
```cmd
# Find what's using port 3000 or 5173:
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Kill process by PID:
taskkill /PID <pid> /F

# Then try update again:
update-docker.bat
```

### Update Failed - Build Errors:
```cmd
# Clean everything:
docker compose down
docker system prune -a
docker volume prune

# Rebuild:
docker compose build --no-cache
docker compose up -d
```

### Git Pull Conflicts:
```cmd
# Stash local changes:
git stash

# Pull updates:
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr

# Reapply changes (if needed):
git stash pop
```

### Docker Out of Space:
```cmd
# Clean unused images/containers:
docker system prune -a

# Check disk usage:
docker system df
```

---

## After Successful Update

### 1. Test Login:
- Navigate to http://localhost:5173
- Login: admin / admin123

### 2. Configure S7-416 PLC:
```cmd
cd opc-service
python setup_s7_connection.py
python setup_s7_tags.py
python s7_service.py
```

### 3. Verify PLC Connection:
- Check CMMS Assets page
- Look for real-time status updates
- Check s7_service.py logs

---

## Backup Before Update

### Backup Database:
```cmd
copy backend\database.sqlite backend\database.sqlite.backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%
```

### Backup Configuration:
```cmd
copy .env .env.backup
copy opc-service\.env opc-service\.env.backup
```

### Restore Backup:
```cmd
copy backend\database.sqlite.backup backend\database.sqlite
docker compose restart backend
```

---

## Update Schedule Recommendation

- **Daily**: Quick restart (`docker compose restart`)
- **Weekly**: Code updates (`git pull` + `docker compose build`)
- **Monthly**: Fresh rebuild (`update-docker.bat`)
- **Before Major Changes**: Full backup + fresh rebuild

---

## Quick Reference

| Task | Command |
|------|---------|
| Update everything | `update-docker.bat` |
| View logs | `docker compose logs -f` |
| Restart services | `docker compose restart` |
| Stop services | `docker compose down` |
| Start services | `docker compose up -d` |
| Check status | `docker compose ps` |
| Test backend | `curl http://localhost:3000/health` |
| Clean Docker | `docker system prune -a` |

---

## Need Help?

If update fails:
1. Check `docker compose logs`
2. Verify Docker Desktop is running
3. Check disk space: `docker system df`
4. Try clean rebuild: `docker system prune -a` then `update-docker.bat`
