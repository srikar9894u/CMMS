@echo off
REM Manual snap7.dll fix for Windows

echo ===============================================================
echo           Manual Snap7.dll Installation
echo ===============================================================
echo.

REM Check if snap7.dll exists
if not exist "snap7.dll" (
    echo ERROR: snap7.dll not found in current directory!
    echo Please download it first from: https://github.com/Davinci/snap7/releases
    pause
    exit /b 1
)

echo snap7.dll found!
echo.

REM Find Python path
echo Finding Python installation...
for /f "tokens=*" %%i in ('where python 2^>nul') do (
    set PYTHON_EXE=%%i
    goto :found
)

:found
if not defined PYTHON_EXE (
    echo ERROR: Could not find Python!
    echo Please install Python or add it to PATH
    pause
    exit /b 1
)

echo Python found at: %PYTHON_EXE%
echo.

REM Get directory path
for %%i in ("%PYTHON_EXE%") do set PYTHON_DIR=%%~dpi

echo Python directory: %PYTHON_DIR%
echo.

echo Copying snap7.dll to Python directory...
copy /Y snap7.dll "%PYTHON_DIR%snap7.dll"

if errorlevel 1 (
    echo Copy failed!
    echo Trying to copy to System32 (requires admin)...
    copy /Y snap7.dll "C:\Windows\System32\snap7.dll"
)

echo.
echo Testing snap7 installation...
python -c "import snap7; print('SUCCESS: Snap7 is working!')"

if errorlevel 1 (
    echo.
    echo ===============================================================
    echo Still not working!
    echo.
    echo Please run this script as Administrator:
    echo   1. Right-click on this script
    echo   2. Select "Run as administrator"
    echo.
    echo Or manually copy snap7.dll to C:\Windows\System32\
    echo ===============================================================
) else (
    echo.
    echo ===============================================================
    echo Installation successful!
    echo You can now run: python s7_service.py
    echo ===============================================================
)

echo.
pause
