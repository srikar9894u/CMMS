@echo off
echo ===============================================================
echo Python Installation Diagnostics
echo ===============================================================
echo.

echo 1. Python version:
python --version
echo.

echo 2. Python location:
where python
echo.

echo 3. Pip version:
pip --version
echo.

echo 4. Pip location:
where pip
echo.

echo 5. Installed packages (snap7 related):
pip list | findstr snap7
echo.

echo 6. Python architecture:
python -c "import platform; print('Architecture:', platform.architecture())"
python -c "import sys; print('Python executable:', sys.executable)"
echo.

echo 7. Site packages location:
python -c "import site; print('User site-packages:', site.getusersitepackages()); print('Global site-packages:', site.getsitepackages())"
echo.

echo ===============================================================
echo Testing different import methods:
echo ===============================================================
echo.

echo Test 1: import snap7
python -c "import snap7" 2>&1
if errorlevel 1 (
    echo FAILED: import snap7
) else (
    echo SUCCESS: import snap7
)
echo.

echo Test 2: import python_snap7
python -c "import python_snap7" 2>&1
if errorlevel 1 (
    echo FAILED: import python_snap7
) else (
    echo SUCCESS: import python_snap7
)
echo.

echo Test 3: Check sys.path
python -c "import sys; print('Python path:'); [print('  -', p) for p in sys.path]"
echo.

pause
