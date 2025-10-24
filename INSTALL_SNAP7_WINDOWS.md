# Installing Snap7 Library for Windows - Step by Step

## Problem: "snap7 library not installed" even though python-snap7 is installed

You have python-snap7 (Python wrapper) but need snap7.dll (C library)

---

## SOLUTION: Download and Install snap7.dll

### Step 1: Download snap7.dll

**Option A - Direct Download (Easiest):**

1. Go to: https://github.com/Davinci/snap7/releases
2. Find latest release (currently 1.4.2)
3. Download: **snap7-full-1.4.2.7z** or **snap7-full-1.4.2.zip**

**Option B - Direct Link:**
- https://github.com/Davinci/snap7/releases/download/1.4.2/snap7-full-1.4.2.7z

---

### Step 2: Extract the Archive

1. Extract the downloaded file
2. Navigate to: `snap7-full-1.4.2\release\Windows\Win64-x64\`
3. Find file: **snap7.dll**

---

### Step 3: Copy snap7.dll to Python Directory

**Method 1 - Copy to Python Scripts folder (Recommended):**

1. Find your Python installation:
   ```cmd
   where python
   ```
   Example output: `C:\Users\Srikar.Tanukula\AppData\Local\Programs\Python\Python313\python.exe`

2. Copy `snap7.dll` to same folder as `python.exe`
   ```cmd
   copy snap7.dll "C:\Users\Srikar.Tanukula\AppData\Local\Programs\Python\Python313\"
   ```

**Method 2 - Copy to CMMS folder:**

```cmd
copy snap7.dll "C:\Users\Srikar.Tanukula\CMMS\opc-service\"
```

**Method 3 - Copy to System32 (Requires Admin):**

```cmd
copy snap7.dll "C:\Windows\System32\"
```

---

### Step 4: Verify Installation

Run this Python command:

```cmd
python -c "import snap7; print('Snap7 version:', snap7.common.check_text(snap7.client.Cli_ListBlocksOfType))"
```

If it works, you'll see version info. If not, try another copy method.

---

## QUICK INSTALL SCRIPT

Save this as `install-snap7.bat`:

```batch
@echo off
echo Downloading snap7...
curl -L https://github.com/Davinci/snap7/releases/download/1.4.2/snap7-full-1.4.2.7z -o snap7.7z

echo.
echo Please extract snap7.7z manually
echo Then copy snap7.dll from: release\Windows\Win64-x64\snap7.dll
echo To: %~dp0
echo.
pause
```

---

## Alternative: Install Pre-compiled Version

```cmd
pip install snap7-python
```

This sometimes includes the DLL, but python-snap7 is more reliable.

---

## After Installing snap7.dll

Try running the service again:

```cmd
cd C:\Users\Srikar.Tanukula\CMMS\opc-service
python s7_service.py
```

You should see:
```
Starting S7 Protocol Service for CMMS
Database path: ../backend/database.sqlite
Initializing S7 Connection Manager
...
```

---

## Troubleshooting

**Still getting error "snap7 library not installed"?**

1. Check if snap7.dll is in the right place:
   ```cmd
   dir snap7.dll
   ```

2. Try copying to multiple locations:
   ```cmd
   REM Copy to Python folder
   copy snap7.dll "%LOCALAPPDATA%\Programs\Python\Python313\"

   REM Copy to current folder
   copy snap7.dll .

   REM Copy to System32 (as admin)
   copy snap7.dll C:\Windows\System32\
   ```

3. Verify Python can find it:
   ```cmd
   python -c "import ctypes; ctypes.CDLL('snap7.dll')"
   ```

**If you see "FileNotFoundError":**
- snap7.dll is not in a location Python can find
- Copy it to the opc-service folder

**If you see "OSError: [WinError 193]":**
- Wrong architecture (32-bit vs 64-bit)
- Download Win64-x64 version for 64-bit Python
- Download Win32-i386 version for 32-bit Python

Check Python architecture:
```cmd
python -c "import platform; print(platform.architecture())"
```

---

## What You Need

- **Python-snap7**: ✅ Already installed
- **snap7.dll**: ⏳ Need to download and copy

---

## Files Locations Summary

After installation you should have:

```
C:\Users\Srikar.Tanukula\
├── AppData\Roaming\Python\Python313\site-packages\snap7\   (python-snap7)
└── AppData\Local\Programs\Python\Python313\snap7.dll       (C library)

OR

C:\Users\Srikar.Tanukula\CMMS\opc-service\snap7.dll         (C library)
```

---

## Quick Test

After installing snap7.dll, test with:

```python
python -c "import snap7; client = snap7.client.Client(); print('Snap7 OK!')"
```

Should print: `Snap7 OK!`

---

## Next Steps

Once snap7.dll is working:

1. Configure S7 connection in CMMS database
2. Run s7_service.py
3. Connect to your S7-416 PLC

I can help with database configuration next!
