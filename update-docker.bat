@echo off
REM CMMS Docker Update Script
REM Updates and rebuilds all Docker containers with latest code

echo ===============================================================
echo           CMMS Docker Update - Fresh Rebuild
echo ===============================================================
echo.

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ERROR: docker-compose.yml not found!
    echo Please run this script from the CMMS root directory.
    pause
    exit /b 1
)

echo Step 1: Pulling latest code from Git...
echo ---------------------------------------------------------------
git pull origin claude/build-cmms-webapp-011CUMdU5DjLj8D3AJLooDTr

if errorlevel 1 (
    echo.
    echo WARNING: Git pull failed or not in a git repository
    echo Continuing with Docker rebuild anyway...
    echo.
)

echo.
echo Step 2: Stopping all containers...
echo ---------------------------------------------------------------
docker compose down

echo.
echo Step 3: Pulling latest base images...
echo ---------------------------------------------------------------
docker compose pull

echo.
echo Step 4: Rebuilding containers (no cache)...
echo ---------------------------------------------------------------
docker compose build --no-cache

echo.
echo Step 5: Starting all services...
echo ---------------------------------------------------------------
docker compose up -d

echo.
echo Step 6: Checking service status...
echo ---------------------------------------------------------------
timeout /t 5 /nobreak >nul
docker compose ps

echo.
echo ===============================================================
echo Docker Update Complete!
echo ===============================================================
echo.

echo Verifying backend health...
timeout /t 3 /nobreak >nul
curl -s http://localhost:3000/health

echo.
echo.
echo ===============================================================
echo Services should be running:
echo   - Backend:  http://localhost:3000
echo   - Frontend: http://localhost:5173
echo.
echo Next steps:
echo   1. Test login at http://localhost:5173
echo   2. Configure S7-416: python opc-service\setup_s7_connection.py
echo   3. Setup tag mappings: python opc-service\setup_s7_tags.py
echo   4. Start S7 service: python opc-service\s7_service.py
echo ===============================================================
echo.

pause
