@echo off
REM snap7 Installation Script for Windows
REM Installs python-snap7 package and snap7.dll

echo ===============================================================
echo           snap7 Installation for Windows
echo ===============================================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: Not running as Administrator
    echo Some operations may fail without admin rights.
    echo.
    echo Please RIGHT-CLICK this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Step 1: Installing python-snap7 package...
echo ---------------------------------------------------------------
python -m pip install --upgrade python-snap7
if errorlevel 1 (
    echo ERROR: Failed to install python-snap7
    pause
    exit /b 1
)
echo.

echo Step 2: Checking Python architecture...
echo ---------------------------------------------------------------
python -c "import sys; print('64-bit Python' if sys.maxsize > 2**32 else '32-bit Python')"
python -c "import sys; arch='64' if sys.maxsize > 2**32 else '32'; print('Need: snap7.dll for Win' + arch)"
echo.

echo Step 3: Checking for snap7.dll...
echo ---------------------------------------------------------------

REM Check if snap7.dll exists in System32
if exist "C:\Windows\System32\snap7.dll" (
    echo Found snap7.dll in C:\Windows\System32\
    echo.
    goto :test_installation
)

REM Check if snap7.dll exists in current directory
if exist "snap7.dll" (
    echo Found snap7.dll in current directory
    echo Copying to System32...
    copy /Y snap7.dll C:\Windows\System32\
    if errorlevel 1 (
        echo ERROR: Failed to copy snap7.dll to System32
        echo.
        goto :manual_install
    )
    echo Done!
    echo.
    goto :test_installation
)

echo snap7.dll not found!
echo.

:manual_install
echo ===============================================================
echo MANUAL INSTALLATION REQUIRED
echo ===============================================================
echo.
echo snap7.dll needs to be downloaded and installed manually.
echo.
echo Steps:
echo ---------------------------------------------------------------
echo 1. Download snap7 from:
echo    https://github.com/davenardella/snap7/releases
echo.
echo 2. Look for: snap7-full-1.4.2.7z (or latest version)
echo    Click to download the file
echo.
echo 3. Extract the .7z file (use 7-Zip or WinRAR)
echo.
echo 4. Navigate to one of these folders in the extracted files:
python -c "import sys; print('   release\\\\Windows\\\\Win64-x64\\\\' if sys.maxsize > 2**32 else '   release\\\\Windows\\\\Win32-i386\\\\')"
echo.
echo 5. Find snap7.dll in that folder
echo.
echo 6. Copy snap7.dll to:
echo    C:\Windows\System32\
echo.
echo 7. Come back here and press any key to test installation
echo.
echo ===============================================================
echo.
echo Opening download page in browser...
start https://github.com/davenardella/snap7/releases
echo.
echo After completing steps above, press any key to test...
pause >nul
echo.

:test_installation
echo Step 4: Testing snap7 installation...
echo ---------------------------------------------------------------
python -c "import snap7; client = snap7.client.Client(); print('SUCCESS! snap7 is working!')" 2>nul
if errorlevel 1 (
    echo.
    echo ❌ FAILED: snap7 is not working yet
    echo.
    echo Running diagnostics...
    echo.
    python diagnose_snap7.py
    pause
    exit /b 1
)

echo.
echo ===============================================================
echo ✅ SUCCESS! snap7 is installed and working!
echo ===============================================================
echo.
echo You can now run:
echo   python s7_service.py
echo.
echo This will connect to your S7-416 PLC at 192.168.10.10
echo.

pause
