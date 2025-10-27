@echo off
REM Quick rebuild script - Forces fresh build of frontend with new S7 Configuration page

echo ===============================================================
echo           CMMS - Force Rebuild (Fresh Frontend)
echo ===============================================================
echo.

echo This will rebuild Docker to include the new S7 Configuration page
echo.

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ERROR: docker-compose.yml not found!
    echo Please run this script from the CMMS root directory.
    pause
    exit /b 1
)

echo Step 1: Stopping all containers...
echo ---------------------------------------------------------------
docker compose down

echo.
echo Step 2: Rebuilding with no cache (ensures fresh build)...
echo ---------------------------------------------------------------
docker compose build --no-cache

echo.
echo Step 3: Starting all services...
echo ---------------------------------------------------------------
docker compose up -d

echo.
echo Step 4: Waiting for services to start...
echo ---------------------------------------------------------------
timeout /t 10 /nobreak >nul

echo.
echo Step 5: Checking service status...
echo ---------------------------------------------------------------
docker compose ps

echo.
echo Step 6: Testing backend health...
echo ---------------------------------------------------------------
curl -s http://localhost:3000/health

echo.
echo.
echo ===============================================================
echo Rebuild Complete!
echo ===============================================================
echo.
echo Services should be running:
echo   - Backend:  http://localhost:3000
echo   - Frontend: http://localhost
echo.
echo New Features Available:
echo   - S7 PLC Configuration page (in Settings menu)
echo   - Tag mapping through dashboard
echo   - Automatic S7 service in Docker
echo.
echo Login at http://localhost with:
echo   Username: admin
echo   Password: admin123
echo.
echo Then check the sidebar menu for:
echo   "S7 PLC Configuration" - NEW!
echo.
echo ===============================================================
echo.

pause
