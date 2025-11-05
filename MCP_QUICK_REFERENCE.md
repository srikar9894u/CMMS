# MCP Servers - Quick Reference Card

## 🚀 Quick Commands

### Start/Stop
```bash
# Start all MCP servers
docker-compose -f docker-compose-mcp.yml up -d

# Stop all MCP servers
docker-compose -f docker-compose-mcp.yml down

# Restart specific server
docker-compose -f docker-compose-mcp.yml restart mcp-playwright

# View logs
docker-compose -f docker-compose-mcp.yml logs -f
```

### Testing
```bash
# Run all tests
npx playwright test

# Run specific test
npx playwright test tests/e2e/login.spec.ts

# Run with UI
npx playwright test --ui

# Debug mode
npx playwright test --debug

# View report
npx playwright show-report test-reports/html
```

### Status
```bash
# Check containers
docker-compose -f docker-compose-mcp.yml ps

# Health check
curl http://localhost:8080/health

# Resource usage
docker stats
```

---

## 📡 Server Endpoints

| Server | Port | Endpoint | Purpose |
|--------|------|----------|---------|
| **Gateway** | 8080 | http://localhost:8080 | Unified access |
| **SQLite** | 8081 | http://localhost:8081 | Database queries |
| **PostgreSQL** | 8082 | http://localhost:8082 | PostgreSQL ops |
| **Filesystem** | 8083 | http://localhost:8083 | File operations |
| **Git** | 8084 | http://localhost:8084 | Git operations |
| **Playwright** | 8085 | http://localhost:8085 | E2E testing |
| **Fetch** | 8086 | http://localhost:8086 | API testing |
| **Memory** | 8087 | http://localhost:8087 | Context storage |
| **Time** | 8088 | http://localhost:8088 | Time utilities |
| **Everything** | 8089 | http://localhost:8089 | Reference |

---

## 🎯 Common Tasks

### Run E2E Tests
```bash
# All E2E tests
npx playwright test tests/e2e/

# Login tests
npx playwright test tests/e2e/login.spec.ts

# Dashboard tests
npx playwright test tests/e2e/dashboard.spec.ts

# Work orders tests
npx playwright test tests/e2e/work-orders.spec.ts
```

### Run API Tests
```bash
# All API tests
npx playwright test tests/api/

# Assets API tests
npx playwright test tests/api/assets.api.spec.ts
```

### Query Database
```bash
# Via SQLite MCP
curl -X POST http://localhost:8081/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM assets LIMIT 10"}'
```

### Read File
```bash
# Via Filesystem MCP
curl http://localhost:8083/read?path=/workspace/package.json
```

### View Git Log
```bash
# Via Git MCP
curl http://localhost:8084/log?limit=10
```

---

## 🐛 Troubleshooting

### Tests Failing
```bash
# 1. Verify CMMS is running
curl http://localhost

# 2. Check MCP servers
docker-compose -f docker-compose-mcp.yml ps

# 3. Run in debug mode
npx playwright test --debug

# 4. Check Playwright container
docker exec -it cmms-mcp-playwright sh
```

### Port Conflicts
```bash
# Find process using port
netstat -ano | findstr "8080"

# Kill process (Windows)
taskkill /PID <pid> /F

# Change port in docker-compose-mcp.yml
```

### Container Issues
```bash
# View logs
docker-compose -f docker-compose-mcp.yml logs <service-name>

# Rebuild
docker-compose -f docker-compose-mcp.yml build --no-cache

# Remove and recreate
docker-compose -f docker-compose-mcp.yml down -v
docker-compose -f docker-compose-mcp.yml up -d
```

---

## 📊 Test Reports

### View HTML Report
```bash
npx playwright show-report test-reports/html
```

### View JSON Results
```bash
cat test-reports/results.json | jq
```

### Screenshots
```bash
# Located in: test-reports/artifacts/
ls -lh test-reports/artifacts/
```

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose-mcp.yml` | MCP servers configuration |
| `.env.mcp` | Environment variables template |
| `.env.mcp.local` | Local environment overrides |
| `playwright.config.ts` | Playwright test configuration |
| `mcp-config/nginx.conf` | Gateway routing configuration |

---

## 📁 Important Directories

| Directory | Contents |
|-----------|----------|
| `tests/e2e/` | End-to-end tests |
| `tests/api/` | API integration tests |
| `tests/unit/` | Unit tests |
| `test-reports/` | Test results and reports |
| `playwright-screenshots/` | Test screenshots |
| `logs/` | Application logs |
| `mcp-config/` | MCP configuration files |

---

## ✅ Daily Workflow

1. **Morning Setup**
   ```bash
   docker-compose up -d                          # Start CMMS
   docker-compose -f docker-compose-mcp.yml up -d # Start MCP servers
   ```

2. **Development**
   ```bash
   # Make changes to code
   # Run tests
   npx playwright test
   ```

3. **Before Commit**
   ```bash
   # Run all tests
   npx playwright test

   # View report
   npx playwright show-report

   # Fix any failures
   ```

4. **End of Day**
   ```bash
   # Optional: Stop MCP servers
   docker-compose -f docker-compose-mcp.yml down
   ```

---

## 🆘 Quick Help

**Full Documentation**: See `MCP_SERVERS_GUIDE.md`

**Support**:
- Playwright Docs: https://playwright.dev/
- MCP Docs: https://modelcontextprotocol.io/
- Docker Docs: https://docs.docker.com/

**Common Issues**:
- Port conflicts → Change ports in docker-compose-mcp.yml
- Tests failing → Check if CMMS is running
- Slow tests → Increase timeouts in playwright.config.ts
- Gateway not working → Check nginx.conf syntax

---

**Last Updated**: November 3, 2025
**Version**: 1.0.0
