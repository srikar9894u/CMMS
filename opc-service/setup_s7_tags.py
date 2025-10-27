#!/usr/bin/env python3
"""
Setup S7 Tag Mappings for Assets
Configure which PLC tags monitor which assets
"""

import sqlite3
import os

# Database path
# For Docker: ../data/database.sqlite
# For local npm: ../backend/database.sqlite
DB_PATH = os.getenv('DB_PATH', '../data/database.sqlite')

print("═" * 70)
print("  S7 Tag Mapping Setup")
print("═" * 70)
print()

# Check if database exists
if not os.path.exists(DB_PATH):
    print(f"❌ ERROR: Database not found at {DB_PATH}")
    print()
    print("Run setup_s7_connection.py first!")
    exit(1)

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get S7 connection ID
    cursor.execute('SELECT id, name, ip_address FROM s7_connections WHERE ip_address = ?', ('192.168.10.10',))
    connection = cursor.fetchone()

    if not connection:
        print("❌ ERROR: S7-416 connection not found!")
        print()
        print("Run setup_s7_connection.py first to create the PLC connection.")
        exit(1)

    connection_id = connection[0]
    print(f"PLC Connection: {connection[1]} (ID: {connection_id})")
    print(f"IP Address: {connection[2]}")
    print()

    # Get available assets
    cursor.execute('SELECT id, name, asset_tag FROM assets ORDER BY name')
    assets = cursor.fetchall()

    if not assets:
        print("❌ ERROR: No assets found in database!")
        print()
        print("Please create assets in CMMS first:")
        print("  1. Login to CMMS web interface")
        print("  2. Go to Assets page")
        print("  3. Create your equipment (motors, pumps, etc.)")
        print()
        exit(1)

    print("Available Assets:")
    print("-" * 70)
    for asset in assets:
        print(f"  ID: {asset[0]:3d} | {asset[1]:30s} | Tag: {asset[2]}")
    print()

    # ========================================================================
    # CONFIGURE YOUR TAG MAPPINGS HERE
    # ========================================================================

    # Example configuration - MODIFY THIS with your actual PLC tags!
    #
    # Format:
    # TAG_MAPPINGS = [
    #     {
    #         'asset_id': 1,              # Asset ID from list above
    #         'running': 'DB1.DBX0.0',    # Tag address for running status
    #         'trip': 'DB1.DBX0.1',       # Tag address for trip/fault
    #         'off': 'DB1.DBX0.2',        # Tag address for off/stopped (optional)
    #         'invert_logic': False       # Set to True if 0=ON, 1=OFF
    #     },
    #     # Add more assets here...
    # ]

    TAG_MAPPINGS = [
        # ============================================================
        # EXAMPLE - Motor 1
        # ============================================================
        # {
        #     'asset_id': 1,
        #     'running': 'DB1.DBX0.0',    # Data Block 1, Byte 0, Bit 0
        #     'trip': 'DB1.DBX0.1',       # Data Block 1, Byte 0, Bit 1
        #     'off': 'DB1.DBX0.2',        # Data Block 1, Byte 0, Bit 2
        #     'invert_logic': False
        # },
        # ============================================================
        # EXAMPLE - Using Memory Bits
        # ============================================================
        # {
        #     'asset_id': 2,
        #     'running': 'M0.0',          # Memory bit 0.0
        #     'trip': 'M0.1',             # Memory bit 0.1
        #     'off': 'M0.2',              # Memory bit 0.2
        #     'invert_logic': False
        # },
        # ============================================================
        # ADD YOUR MAPPINGS BELOW:
        # ============================================================

        # Uncomment and configure for your assets:

        # {
        #     'asset_id': 1,              # Change to your asset ID
        #     'running': 'DB1.DBX0.0',    # Change to your PLC tag address
        #     'trip': 'DB1.DBX0.1',       # Change to your PLC tag address
        #     'off': None,                # Optional - set to None if not used
        #     'invert_logic': False       # True if your PLC uses inverted logic
        # },

    ]

    # ========================================================================

    if not TAG_MAPPINGS:
        print("⚠️  No tag mappings configured!")
        print()
        print("Please edit setup_s7_tags.py and configure TAG_MAPPINGS")
        print()
        print("Steps:")
        print("1. Open setup_s7_tags.py in a text editor")
        print("2. Find the TAG_MAPPINGS section")
        print("3. Uncomment the example and add your tag addresses")
        print("4. Save the file")
        print("5. Run this script again: python setup_s7_tags.py")
        print()
        exit(0)

    print("Configuring tag mappings...")
    print("-" * 70)

    tags_added = 0
    tags_updated = 0

    for mapping in TAG_MAPPINGS:
        asset_id = mapping['asset_id']
        invert_logic = mapping.get('invert_logic', False)

        # Get asset name
        cursor.execute('SELECT name FROM assets WHERE id = ?', (asset_id,))
        asset = cursor.fetchone()
        if not asset:
            print(f"⚠️  Asset ID {asset_id} not found - skipping")
            continue

        asset_name = asset[0]
        print(f"\nAsset: {asset_name} (ID: {asset_id})")

        # Add/update tags
        for tag_type in ['running', 'trip', 'off']:
            tag_address = mapping.get(tag_type)

            if tag_address is None:
                print(f"  {tag_type:8s}: (not configured)")
                continue

            tag_name = f"{asset_name}_{tag_type}"

            # Check if tag exists
            cursor.execute('''
                SELECT id FROM s7_tags
                WHERE s7_connection_id = ? AND asset_id = ? AND tag_type = ?
            ''', (connection_id, asset_id, tag_type))

            existing_tag = cursor.fetchone()

            if existing_tag:
                # Update existing tag
                cursor.execute('''
                    UPDATE s7_tags
                    SET tag_name = ?, tag_address = ?, invert_logic = ?
                    WHERE id = ?
                ''', (tag_name, tag_address, invert_logic, existing_tag[0]))
                print(f"  {tag_type:8s}: {tag_address:20s} (updated)")
                tags_updated += 1
            else:
                # Insert new tag
                cursor.execute('''
                    INSERT INTO s7_tags
                    (s7_connection_id, asset_id, tag_type, tag_name, tag_address, data_type, invert_logic)
                    VALUES (?, ?, ?, ?, ?, 'boolean', ?)
                ''', (connection_id, asset_id, tag_type, tag_name, tag_address, invert_logic))
                print(f"  {tag_type:8s}: {tag_address:20s} (added)")
                tags_added += 1

    conn.commit()

    print()
    print("═" * 70)
    print(f"✅ Tag Configuration Complete!")
    print("═" * 70)
    print(f"  Tags added:   {tags_added}")
    print(f"  Tags updated: {tags_updated}")
    print()
    print("Next Step:")
    print("-" * 70)
    print("Start the S7 service to begin monitoring:")
    print("  python s7_service.py")
    print()
    print("The service will:")
    print("  1. Connect to S7-416 at 192.168.10.10")
    print("  2. Read configured tags every 5 seconds")
    print("  3. Update asset status in CMMS database")
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
