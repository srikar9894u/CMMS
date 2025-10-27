#!/usr/bin/env python3
"""
Diagnose snap7 installation issues on Windows
"""

import os
import sys
import platform
import subprocess

print("═" * 70)
print("  snap7 Installation Diagnostics")
print("═" * 70)
print()

# System info
print("System Information:")
print("-" * 70)
print(f"  Platform: {platform.system()}")
print(f"  Architecture: {platform.machine()}")
print(f"  Python: {sys.version}")
print(f"  Python Path: {sys.executable}")
print()

# Check Python architecture
is_64bit = sys.maxsize > 2**32
print(f"  Python Architecture: {'64-bit' if is_64bit else '32-bit'}")
print()

# Check python-snap7 package
print("Python Package Check:")
print("-" * 70)
try:
    result = subprocess.run([sys.executable, '-m', 'pip', 'list'],
                          capture_output=True, text=True, timeout=10)
    pip_list = result.stdout

    if 'python-snap7' in pip_list:
        # Extract version
        for line in pip_list.split('\n'):
            if 'python-snap7' in line:
                print(f"  ✅ python-snap7 installed: {line.strip()}")
                break
    else:
        print("  ❌ python-snap7 NOT installed")
        print("     Install with: python -m pip install python-snap7")
except Exception as e:
    print(f"  ⚠️  Could not check pip packages: {e}")
print()

# Try to import snap7
print("Import Test:")
print("-" * 70)
try:
    import snap7
    print("  ✅ snap7 module imported successfully")
    print(f"     Module path: {snap7.__file__}")

    # Try to get version
    try:
        version = snap7.__version__
        print(f"     Version: {version}")
    except:
        pass

    print()

    # Try to create client (this will fail if DLL not found)
    print("Client Creation Test:")
    print("-" * 70)
    try:
        client = snap7.client.Client()
        print("  ✅ snap7.client.Client() created successfully")
        print("     snap7.dll is properly installed and accessible")
        print()
        print("═" * 70)
        print("✅ snap7 IS WORKING CORRECTLY!")
        print("═" * 70)
        sys.exit(0)
    except Exception as e:
        print(f"  ❌ Failed to create client: {e}")
        print()
        print("     This usually means snap7.dll is not installed or not found")
        dll_error = True

except ImportError as e:
    print(f"  ❌ Failed to import snap7: {e}")
    print()
    print("     Install with: python -m pip install python-snap7")
    sys.exit(1)
print()

# If we get here, DLL is the problem
print("snap7.dll Check:")
print("-" * 70)

# Check common DLL locations
dll_name = 'snap7.dll'
search_paths = [
    'C:\\Windows\\System32',
    'C:\\Windows\\SysWOW64',
    os.path.dirname(sys.executable),
    os.path.join(os.path.dirname(sys.executable), 'DLLs'),
    os.path.join(os.path.dirname(sys.executable), 'Library', 'bin'),
]

# Add PATH directories
path_env = os.environ.get('PATH', '')
search_paths.extend(path_env.split(';'))

dll_found = False
dll_locations = []

for path in search_paths:
    if not path or not os.path.exists(path):
        continue
    dll_path = os.path.join(path, dll_name)
    if os.path.exists(dll_path):
        dll_found = True
        dll_locations.append(dll_path)
        print(f"  ✅ Found: {dll_path}")

if not dll_found:
    print(f"  ❌ {dll_name} NOT FOUND in any of these locations:")
    for path in search_paths[:8]:  # Show first 8 paths
        if path and os.path.exists(path):
            print(f"     - {path}")
    print()
else:
    print()
    print(f"  Found {len(dll_locations)} copy(ies) of {dll_name}")
    print()

print()
print("═" * 70)
print("DIAGNOSIS:")
print("═" * 70)

if not dll_found:
    print("❌ snap7.dll is NOT installed on your system")
    print()
    print("SOLUTION:")
    print("-" * 70)
    print("Run the installation script:")
    print("  install_snap7_windows.bat")
    print()
    print("Or manual installation:")
    print("  1. Download snap7 from:")
    print("     https://github.com/SCADACS/snap7/releases")
    print("  2. Get snap7-full-1.4.2.7z (or latest version)")
    print("  3. Extract the archive")
    if is_64bit:
        print("  4. Copy snap7.dll from: release\\Windows\\Win64-x64\\")
    else:
        print("  4. Copy snap7.dll from: release\\Windows\\Win32-i386\\")
    print("  5. Paste to: C:\\Windows\\System32\\")
    print("  6. Run this script again to verify")
else:
    print("⚠️  snap7.dll is installed but Python can't load it")
    print()
    print("POSSIBLE ISSUES:")
    print("-" * 70)
    print("  1. Wrong architecture (32-bit vs 64-bit mismatch)")
    print(f"     Your Python is {' 64-bit' if is_64bit else '32-bit'}")
    print(f"     snap7.dll must also be {'64-bit' if is_64bit else '32-bit'}")
    print()
    print("  2. Missing Visual C++ Redistributables")
    print("     Download from:")
    print("     https://aka.ms/vs/17/release/vc_redist.x64.exe")
    print()
    print("  3. DLL not in correct location for Python")
    print("     Try copying to Python directory:")
    print(f"     copy snap7.dll \"{os.path.dirname(sys.executable)}\"")
    print()
    print("SOLUTION:")
    print("-" * 70)
    print("Run: install_snap7_windows.bat")

print()
print("═" * 70)
