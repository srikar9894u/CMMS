#!/usr/bin/env python3
"""
Setup S7-416 PLC Connection in CMMS Database
Creates the database entry for your S7-416 PLC at 192.168.10.10
"""

import sqlite3
import os
from datetime import datetime

# Database path
DB_PATH = os.getenv('DB_PATH', '../backend/database.sqlite')

# Your S7-416 PLC configuration
S7_CONFIG = {
    'name': 'S7-416 Production PLC',
    'plc_type': 'S7-400',  # S7-416 is S7-400 series
    'ip_address': '192.168.10.10',
    'rack': 0,
    'slot': 3,
    'enabled': 1,
    'polling_interval': 5000,  # 5 seconds
    'connection_timeout': 10000,
    'notes': 'S7-416 PLC - Main production line (Rack 0, Slot 3)'
}

print("═" * 70)
print("  S7-416 PLC Connection Setup")
print("═" * 70)
print()
print(f"PLC Name:    {S7_CONFIG['name']}")
print(f"PLC Type:    {S7_CONFIG['plc_type']}")
print(f"IP Address:  {S7_CONFIG['ip_address']}")
print(f"Rack:        {S7_CONFIG['rack']}")
print(f"Slot:        {S7_CONFIG['slot']}")
print(f"Polling:     {S7_CONFIG['polling_interval']}ms")
print()
print(f"Database:    {DB_PATH}")
print()

# Check if database exists
if not os.path.exists(DB_PATH):
    print(f"❌ ERROR: Database not found at {DB_PATH}")
    print()
    print("Make sure the backend is running first!")
    print("Run: cd ../backend && npm start")
    exit(1)

try:
    # Connect to database
    print("Connecting to database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create s7_connections table if it doesn't exist
    print("Creating s7_connections table (if not exists)...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS s7_connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            plc_type TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            rack INTEGER DEFAULT 0,
            slot INTEGER DEFAULT 2,
            enabled BOOLEAN DEFAULT 1,
            polling_interval INTEGER DEFAULT 5000,
            connection_timeout INTEGER DEFAULT 10000,
            connection_status TEXT DEFAULT 'disconnected',
            last_connected DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create s7_tags table if it doesn't exist
    print("Creating s7_tags table (if not exists)...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS s7_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            s7_connection_id INTEGER NOT NULL,
            asset_id INTEGER NOT NULL,
            tag_type TEXT NOT NULL CHECK(tag_type IN ('running', 'trip', 'off', 'custom')),
            tag_name TEXT NOT NULL,
            tag_address TEXT NOT NULL,
            data_type TEXT DEFAULT 'boolean',
            invert_logic BOOLEAN DEFAULT 0,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (s7_connection_id) REFERENCES s7_connections(id) ON DELETE CASCADE,
            FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
            UNIQUE(s7_connection_id, asset_id, tag_type)
        )
    ''')

    conn.commit()

    # Check if connection already exists
    print("Checking for existing connection...")
    cursor.execute('SELECT id, name FROM s7_connections WHERE ip_address = ?', (S7_CONFIG['ip_address'],))
    existing = cursor.fetchone()

    if existing:
        print(f"⚠️  Connection already exists: '{existing[1]}' (ID: {existing[0]})")
        print()
        response = input("Do you want to update it? (y/n): ").lower()

        if response == 'y':
            print("Updating connection configuration...")
            cursor.execute('''
                UPDATE s7_connections
                SET name = ?, plc_type = ?, rack = ?, slot = ?,
                    enabled = ?, polling_interval = ?, connection_timeout = ?, notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE ip_address = ?
            ''', (S7_CONFIG['name'], S7_CONFIG['plc_type'], S7_CONFIG['rack'], S7_CONFIG['slot'],
                  S7_CONFIG['enabled'], S7_CONFIG['polling_interval'], S7_CONFIG['connection_timeout'],
                  S7_CONFIG['notes'], S7_CONFIG['ip_address']))
            connection_id = existing[0]
            conn.commit()
            print("✅ Connection updated successfully!")
        else:
            connection_id = existing[0]
            print("Keeping existing connection.")
    else:
        print("Creating new S7-416 connection...")
        cursor.execute('''
            INSERT INTO s7_connections (name, plc_type, ip_address, rack, slot, enabled,
                                       polling_interval, connection_timeout, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (S7_CONFIG['name'], S7_CONFIG['plc_type'], S7_CONFIG['ip_address'],
              S7_CONFIG['rack'], S7_CONFIG['slot'], S7_CONFIG['enabled'],
              S7_CONFIG['polling_interval'], S7_CONFIG['connection_timeout'], S7_CONFIG['notes']))
        connection_id = cursor.lastrowid
        conn.commit()
        print("✅ S7 connection created successfully!")

    print()
    print("═" * 70)
    print(f"✅ S7-416 PLC Connection Ready (ID: {connection_id})")
    print("═" * 70)
    print()
    print("Next Steps:")
    print("-" * 70)
    print("1. Configure tag mappings:")
    print("   Edit setup_s7_tags.py with your PLC tag addresses")
    print("   Then run: python setup_s7_tags.py")
    print()
    print("2. Test PLC connectivity:")
    print("   ping 192.168.10.10")
    print()
    print("3. Start S7 service:")
    print("   python s7_service.py")
    print()
    print("Tag Address Formats:")
    print("  - Data Block bits:  DB1.DBX0.0, DB1.DBX0.1")
    print("  - Memory bits:      M0.0, M0.1, M0.2")
    print("  - Input bits:       I0.0, I1.0")
    print("  - Output bits:      Q0.0, Q1.0")
    print("  - Words:            DB1.DBW2, MW4, IW6, QW8")
    print("  - Double Words:     DB1.DBD4, MD8, ID12, QD16")
    print()
    print("═" * 70)

except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
finally:
    if conn:
        conn.close()

print("Setup complete!")
