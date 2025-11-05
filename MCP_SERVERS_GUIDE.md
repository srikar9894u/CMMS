# MCP Servers Setup Guide for CMMS Project

## 📋 Overview

This guide covers the Model Context Protocol (MCP) servers configured for the CMMS project. These servers provide AI-assisted development, testing, and operations capabilities.

**Date**: November 3, 2025
**Version**: 1.0.0
**Status**: Production Ready

---

## 🏗️ Architecture

The MCP setup consists of:
- **9 MCP Servers** running in Docker containers
- **1 Gateway** (Nginx) for unified access
- **Dedicated network** for inter-server communication
- **Integration** with existing CMMS services

---

## 📦 Installed MCP Servers

### **1. SQLite MCP Server**
- **Port**: 8081
- **Image**: `mcp/sqlite`
- **Purpose**: Database inspection and queries
- **Use Cases**:
  - Query CMMS database
  - Analyze data patterns
  - Generate reports
  - Debug data issues
- **Access**: http://localhost:8081

### **2. PostgreSQL MCP Server**
- **Port**: 8082
- **Image**: `mcp/postgres`
- **Purpose**: PostgreSQL operations (for future migration)
- **Use Cases**:
  - Test PostgreSQL migration
  - Query optimization
  - Schema design
  - Performance analysis
- **Access**: http://localhost:8082

### **3. Filesystem MCP Server**
- **Port**: 8083
- **Image**: `mcp/filesystem`
- **Purpose**: File operations with security controls
- **Use Cases**:
  - Read/write code files
  - Analyze logs
  - Manage configuration files
  - Access build artifacts
- **Access**: http://localhost:8083
- **Allowed Paths**: `/workspace`, `/data`, `/logs`

### **4. Git MCP Server**
- **Port**: 8084
- **Image**: `mcp/git`
- **Purpose**: Git repository operations
- **Use Cases**:
  - View commit history
  - Analyze code changes
  - Branch management
  - Code review assistance
- **Access**: http://localhost:8084

### **5. Playwright MCP Server**
- **Port**: 8085
- **Image**: `mcr.microsoft.com/playwright:latest`
- **Purpose**: E2E testing and browser automation
- **Use Cases**:
  - Run automated tests
  - Generate test reports
  - Visual regression testing
  - Performance testing
- **Access**: http://localhost:8085
- **Test Reports**: `./test-reports/`

### **6. Fetch MCP Server**
- **Port**: 8086
- **Image**: `mcp/fetch`
- **Purpose**: Web content fetching and API testing
- **Use Cases**:
  - Test API endpoints
  - Fetch external data
  - Integration testing
  - Web scraping for test data
- **Access**: http://localhost:8086

### **7. Memory MCP Server**
- **Port**: 8087
- **Image**: `mcp/memory`
- **Purpose**: Persistent context and knowledge graph
- **Use Cases**:
  - Store test data
  - Maintain session context
  - Track configuration changes
  - Knowledge retention
- **Access**: http://localhost:8087

### **8. Time MCP Server**
- **Port**: 8088
- **Image**: `mcp/time`
- **Purpose**: Time and timezone conversions
- **Use Cases**:
  - Test timezone handling
  - Time calculations
  - Date formatting
  - Timestamp conversions
- **Access**: http://localhost:8088

### **9. Everything MCP Server**
- **Port**: 8089
- **Image**: `mcp/everything`
- **Purpose**: Reference implementation with all features
- **Use Cases**:
  - MCP learning
  - Feature testing
  - Server development reference
- **Access**: http://localhost:8089

### **10. MCP Gateway**
- **Port**: 8080
- **Image**: `nginx:alpine`
- **Purpose**: Unified access to all MCP servers
- **Access**: http://localhost:8080
- **Endpoints**:
  - `/mcp/sqlite/` → SQLite server
  - `/mcp/postgres/` → PostgreSQL server
  - `/mcp/filesystem/` → Filesystem server
  - `/mcp/git/` → Git server
  - `/mcp/playwright/` → Playwright server
  - `/mcp/fetch/` → Fetch server
  - `/mcp/memory/` → Memory server
  - `/mcp/time/` → Time server
  - `/mcp/everything/` → Everything server

---

## 🚀 Quick Start

### **1. Start All MCP Servers**

```bash
# Start all MCP servers in background
docker-compose -f docker-compose-mcp.yml up -d

# View logs
docker-compose -f docker-compose-mcp.yml logs -f

# View specific server logs
docker-compose -f docker-compose-mcp.yml logs -f mcp-playwright
```

### **2. Verify Servers Are Running**

```bash
# Check all containers
docker-compose -f docker-compose-mcp.yml ps

# Test gateway
curl http://localhost:8080/health

# Test individual server
curl http://localhost:8081
```

### **3. Run Playwright Tests**

```bash
# Install Playwright locally (one-time)
npm install -D @playwright/test

# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/login.spec.ts

# Run tests with UI
npx playwright test --ui

# Generate HTML report
npx playwright show-report test-reports/html
```

### **4. Stop MCP Servers**

```bash
# Stop all MCP servers
docker-compose -f docker-compose-mcp.yml down

# Stop and remove volumes
docker-compose -f docker-compose-mcp.yml down -v
```

---

## 📁 Project Structure

```
CMMS/
├── docker-compose-mcp.yml          # MCP servers configuration
├── .env.mcp                        # MCP environment variables
├── mcp-config/
│   └── nginx.conf                  # Gateway configuration
├── tests/
│   ├── e2e/                        # End-to-end tests
│   │   ├── login.spec.ts
│   │   ├── dashboard.spec.ts
│   │   └── work-orders.spec.ts
│   ├── api/                        # API tests
│   │   └── assets.api.spec.ts
│   └── unit/                       # Unit tests
├── test-reports/                   # Test results and artifacts
│   ├── html/                       # HTML reports
│   ├── results.json                # JSON results
│   └── junit.xml                   # JUnit format
├── playwright-screenshots/         # Test screenshots
├── logs/                           # Application logs
└── playwright.config.ts            # Playwright configuration
```

---

## 🔧 Configuration

### **Environment Variables**

Copy `.env.mcp` to `.env.mcp.local` and customize:

```bash
# Database
SQLITE_DB_PATH=/data/database.sqlite
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Filesystem
FILESYSTEM_ALLOWED_PATHS=/workspace,/data,/logs

# Playwright
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_BROWSER=chromium
PLAYWRIGHT_BASE_URL=http://cmms-frontend

# Fetch
FETCH_TIMEOUT=30000

# Logging
MCP_LOG_LEVEL=info
```

### **Gateway Configuration**

Edit `mcp-config/nginx.conf` to customize routing and add authentication.

### **Playwright Configuration**

Edit `playwright.config.ts` to:
- Add/remove browsers
- Configure timeouts
- Set viewport sizes
- Enable/disable video recording

---

## 📊 Testing Workflows

### **Manual Testing Workflow**

1. **Start CMMS Application**
   ```bash
   docker-compose up -d
   ```

2. **Start MCP Servers**
   ```bash
   docker-compose -f docker-compose-mcp.yml up -d
   ```

3. **Run Tests**
   ```bash
   npx playwright test
   ```

4. **View Results**
   ```bash
   npx playwright show-report test-reports/html
   ```

### **CI/CD Integration**

```yaml
# Example GitHub Actions workflow
name: CMMS Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start CMMS
        run: docker-compose up -d

      - name: Start MCP Servers
        run: docker-compose -f docker-compose-mcp.yml up -d

      - name: Install Playwright
        run: npm install -D @playwright/test

      - name: Run Tests
        run: npx playwright test

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-reports/
```

---

## 🎯 Use Cases

### **Development**

**Code Analysis**
```bash
# Use Filesystem MCP to read code
curl http://localhost:8083/read?path=/workspace/frontend/src/App.tsx

# Use Git MCP to view history
curl http://localhost:8084/log?path=frontend/src
```

**Database Queries**
```bash
# Query assets via SQLite MCP
curl http://localhost:8081/query -d "SELECT * FROM assets"
```

### **Testing**

**E2E Testing**
```bash
# Run login tests
npx playwright test tests/e2e/login.spec.ts

# Run all E2E tests
npx playwright test tests/e2e/

# Run with specific browser
npx playwright test --project=chromium
```

**API Testing**
```bash
# Run API tests
npx playwright test tests/api/

# Use Fetch MCP directly
curl http://localhost:8086/fetch?url=http://localhost:3000/api/assets
```

### **Debugging**

**View Logs**
```bash
# Backend logs
docker-compose logs backend

# MCP server logs
docker-compose -f docker-compose-mcp.yml logs mcp-playwright

# Filesystem logs via MCP
curl http://localhost:8083/read?path=/logs/app.log
```

**Interactive Debugging**
```bash
# Run Playwright in debug mode
npx playwright test --debug

# Run with headed browser
PLAYWRIGHT_HEADLESS=false npx playwright test
```

---

## 🔒 Security Considerations

### **Filesystem Access**

- Read-only access to `/workspace` (code)
- Read-write access to `/data` and `/logs`
- Configurable allowed paths in `.env.mcp`

### **Database Access**

- SQLite: Read-only by default
- PostgreSQL: Read-only mode enabled
- No destructive operations in production

### **Network Isolation**

- MCP servers on dedicated `mcp-network`
- Gateway provides controlled access
- Can add authentication to gateway

### **Secrets Management**

- Use `.env.mcp.local` for sensitive data
- Never commit tokens to git
- Use Docker secrets for production

---

## 📈 Monitoring & Logs

### **Health Checks**

```bash
# Gateway health
curl http://localhost:8080/health

# Individual server health
curl http://localhost:8081/health
curl http://localhost:8082/health
# ... etc
```

### **Logs**

```bash
# All MCP servers
docker-compose -f docker-compose-mcp.yml logs

# Specific server
docker-compose -f docker-compose-mcp.yml logs mcp-playwright

# Follow logs
docker-compose -f docker-compose-mcp.yml logs -f --tail=100
```

### **Resource Usage**

```bash
# Container stats
docker stats

# MCP containers only
docker stats $(docker ps --filter "name=cmms-mcp" --format "{{.Names}}")
```

---

## 🛠️ Troubleshooting

### **Servers Won't Start**

```bash
# Check for port conflicts
netstat -ano | findstr "8080"

# Check Docker logs
docker-compose -f docker-compose-mcp.yml logs

# Rebuild images
docker-compose -f docker-compose-mcp.yml build --no-cache
```

### **Tests Failing**

```bash
# Verify CMMS is running
curl http://localhost

# Check Playwright container
docker exec -it cmms-mcp-playwright sh

# Run tests in debug mode
npx playwright test --debug

# Check test reports
npx playwright show-report
```

### **Gateway Issues**

```bash
# Test gateway directly
curl http://localhost:8080/health

# Check nginx config syntax
docker exec cmms-mcp-gateway nginx -t

# Reload nginx config
docker exec cmms-mcp-gateway nginx -s reload
```

---

## 📚 Additional Resources

### **Documentation**

- [MCP Official Docs](https://modelcontextprotocol.io/)
- [Playwright Docs](https://playwright.dev/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

### **GitHub Repositories**

- [MCP Servers Registry](https://github.com/modelcontextprotocol/registry)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)

### **Docker Hub**

- [MCP Catalog](https://hub.docker.com/mcp)
- [Playwright Images](https://hub.docker.com/r/mcr.microsoft.com/playwright)

---

## ✅ Next Steps

1. **Configure GitHub Token** (optional)
   - Generate token at https://github.com/settings/tokens
   - Add to `.env.mcp.local`
   - Add GitHub MCP server to docker-compose

2. **Add More Tests**
   - Create tests for all pages
   - Add API integration tests
   - Configure CI/CD pipeline

3. **Set Up Monitoring**
   - Add Prometheus metrics
   - Configure Grafana dashboards
   - Set up alerting

4. **Production Deployment**
   - Add authentication to gateway
   - Enable HTTPS
   - Configure backup for Memory MCP
   - Set up log aggregation

---

## 🎓 Training & Examples

### **Example: Query Database**

```bash
# Using SQLite MCP
curl -X POST http://localhost:8081/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) as total FROM assets"}'
```

### **Example: Read File**

```bash
# Using Filesystem MCP
curl http://localhost:8083/read?path=/workspace/package.json
```

### **Example: Run Single Test**

```bash
# Run login test only
npx playwright test tests/e2e/login.spec.ts --headed
```

---

**Created By**: Claude Code
**Date**: November 3, 2025
**Version**: 1.0.0
**License**: Internal Use Only
