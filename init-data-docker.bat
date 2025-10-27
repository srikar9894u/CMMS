@echo off
REM Initialize Data Directory and Restart Docker with Backend Port Fix
REM This script fixes the backend port exposure and initializes the database

echo ===============================================================
echo           CMMS Data Directory Initialization
echo ===============================================================
echo.

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ERROR: docker-compose.yml not found!
    echo Please run this script from the CMMS root directory.
    pause
    exit /b 1
)

echo Step 1: Creating data directory...
echo ---------------------------------------------------------------
if not exist "data" (
    mkdir data
    echo Created data directory
) else (
    echo Data directory already exists
)

echo.
echo Step 2: Checking for existing database...
echo ---------------------------------------------------------------
if exist "backend\database.sqlite" (
    echo Found database in backend folder
    echo Copying to data folder for Docker...
    copy "backend\database.sqlite" "data\database.sqlite"
) else (
    echo No existing database found - will be created by backend on startup
)

echo.
echo Step 3: Stopping containers...
echo ---------------------------------------------------------------
docker compose down

echo.
echo Step 4: Starting containers with fixed configuration...
echo ---------------------------------------------------------------
docker compose up -d

echo.
echo Step 5: Waiting for backend to initialize...
echo ---------------------------------------------------------------
timeout /t 10 /nobreak >nul

echo.
echo Step 6: Checking service status...
echo ---------------------------------------------------------------
docker compose ps

echo.
echo Step 7: Testing backend health...
echo ---------------------------------------------------------------
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000/health

echo.
echo.
echo ===============================================================
echo Initialization Complete!
echo ===============================================================
echo.

echo Checking data directory contents:
dir data

echo.
echo ===============================================================
echo Next steps:
echo   1. If backend health check passed, proceed with S7 setup:
echo      cd opc-service
echo      python setup_s7_connection.py
echo      python setup_s7_tags.py
echo      python s7_service.py
echo.
echo   2. If health check failed, check logs:
echo      docker compose logs backend
echo.
echo   3. Access CMMS at:
echo      http://localhost
echo      Login: admin / admin123
echo ===============================================================
echo.

pause
