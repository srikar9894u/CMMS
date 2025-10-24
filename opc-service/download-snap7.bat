@echo off
REM Download and install snap7.dll for Windows

echo ===============================================================
echo           Snap7 DLL Installer for Windows
echo ===============================================================
echo.

echo This script will guide you through installing snap7.dll
echo.

REM Check if we're in the right directory
if not exist "s7_service.py" (
    echo ERROR: Please run this script from the opc-service folder
    pause
    exit /b 1
)

echo Step 1: Checking if snap7.dll already exists...
if exist "snap7.dll" (
    echo snap7.dll found in current directory!
    goto :test
)

echo snap7.dll not found. Need to download it.
echo.

echo ===============================================================
echo DOWNLOAD INSTRUCTIONS:
echo ===============================================================
echo.
echo 1. Go to: https://github.com/Davinci/snap7/releases
echo 2. Download: snap7-full-1.4.2.7z (or latest version)
echo 3. Extract the archive
echo 4. Navigate to: release\Windows\Win64-x64\
echo 5. Copy snap7.dll to this folder:
echo    %CD%
echo.
echo ===============================================================
echo.

echo Opening download page in browser...
start https://github.com/Davinci/snap7/releases
echo.

echo Press any key after you've copied snap7.dll to this folder...
pause >nul

if not exist "snap7.dll" (
    echo.
    echo ERROR: snap7.dll still not found!
    echo Please copy snap7.dll to: %CD%
    echo.
    pause
    exit /b 1
)

:test
echo.
echo ===============================================================
echo Step 2: Testing snap7 installation...
echo ===============================================================
echo.

python -c "import snap7; print('SUCCESS: Snap7 is working!')" 2>nul
if errorlevel 1 (
    echo.
    echo WARNING: Python can't load snap7.dll
    echo.
    echo Trying to copy to Python directory...

    REM Try to find Python directory
    for /f "tokens=*" %%i in ('where python 2^>nul') do set PYTHON_PATH=%%~dpi

    if defined PYTHON_PATH (
        echo Found Python at: %PYTHON_PATH%
        echo Copying snap7.dll to Python directory...
        copy /Y snap7.dll "%PYTHON_PATH%snap7.dll"

        echo.
        echo Testing again...
        python -c "import snap7; print('SUCCESS: Snap7 is working!')" 2>nul
        if errorlevel 1 (
            echo.
            echo Still not working. Manual steps needed:
            echo.
            echo 1. Copy snap7.dll to one of these locations:
            echo    - %PYTHON_PATH%
            echo    - C:\Windows\System32\
            echo.
            echo 2. Or run this script as Administrator
            echo.
            pause
            exit /b 1
        )
    ) else (
        echo Could not find Python installation
        echo.
        echo Manual installation required:
        echo 1. Find your Python installation folder
        echo 2. Copy snap7.dll there
        echo 3. Or copy to C:\Windows\System32\
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ===============================================================
echo Installation Complete!
echo ===============================================================
echo.
echo You can now run the S7 service:
echo   python s7_service.py
echo.
pause
