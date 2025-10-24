@echo off
REM ===================================================================
REM CMMS Login Fix Script for Windows
REM Diagnoses and fixes login issues on Docker deployment
REM ===================================================================

echo ===============================================================
echo        CMMS Login Troubleshooting ^& Fix Script
echo ===============================================================
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop for Windows
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo Step 1: Checking Docker containers...
echo ---------------------------------------------------------------
docker compose ps
echo.

echo Step 2: Checking backend logs...
echo ---------------------------------------------------------------
echo Last 20 lines:
docker compose logs --tail=20 backend
echo.

echo Step 3: Testing backend API health...
echo ---------------------------------------------------------------
curl -s http://localhost:3000/health
if errorlevel 1 (
    echo Backend API is NOT responding
    echo Waiting 10 seconds...
    timeout /t 10 /nobreak >nul
    curl -s http://localhost:3000/health
)
echo.

echo Step 4: Checking database file...
echo ---------------------------------------------------------------
if exist "data\database.sqlite" (
    echo Database exists: data\database.sqlite
    dir data\database.sqlite | find "database.sqlite"
) else if exist "backend\database.sqlite" (
    echo WARNING: Database found in wrong location: backend\database.sqlite
    echo Moving to correct location...
    if not exist "data" mkdir data
    copy backend\database.sqlite data\database.sqlite
) else (
    echo ERROR: Database file not found
    echo This means the backend never initialized properly
)
echo.

echo Step 5: Testing login endpoint...
echo ---------------------------------------------------------------
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
echo.
echo.

echo If you see a token above, login is working!
echo If you see an error, database needs to be recreated.
echo.

set /p RECREATE="Do you want to recreate the database? (WARNING: Deletes all data) [Y/N]: "
if /i "%RECREATE%"=="Y" (
    echo.
    echo Recreating database...
    echo.

    echo Stopping services...
    docker compose down

    echo Removing old database...
    if exist "data\database.sqlite" del /f /q data\database.sqlite
    if exist "backend\database.sqlite" del /f /q backend\database.sqlite

    echo Starting services...
    docker compose up -d

    echo Waiting 15 seconds for initialization...
    timeout /t 15 /nobreak >nul

    echo.
    echo Testing login...
    curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
    echo.
    echo.

    echo ===============================================================
    echo Database recreated!
    echo You can now login at: http://localhost
    echo Username: admin
    echo Password: admin123
    echo ===============================================================
) else (
    echo Skipping database recreation.
)

echo.
echo ===============================================================
echo Summary
echo ===============================================================
echo.
echo Access URLs:
echo   Frontend:    http://localhost
echo   Backend API: http://localhost:3000
echo.
echo Default Login:
echo   Username: admin
echo   Password: admin123
echo.
echo If login still fails, try these commands:
echo.
echo   View logs:         docker compose logs -f backend
echo   Restart services:  docker compose restart
echo   Rebuild:           docker compose down
echo                      docker compose build --no-cache
echo                      docker compose up -d
echo.
echo ===============================================================
echo.
pause
