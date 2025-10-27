#!/usr/bin/env python3
"""
Helper script to apply tag configuration from tag_mapping_template.py
"""

import os
import sys

print("═" * 70)
print("  Tag Configuration Helper")
print("═" * 70)
print()

# Check if template exists
if not os.path.exists('tag_mapping_template.py'):
    print("❌ ERROR: tag_mapping_template.py not found!")
    print()
    print("Make sure you're in the opc-service directory")
    exit(1)

# Import the template
try:
    from tag_mapping_template import TAG_MAPPINGS
except ImportError as e:
    print(f"❌ ERROR: Could not import TAG_MAPPINGS from template: {e}")
    exit(1)

if not TAG_MAPPINGS:
    print("❌ ERROR: TAG_MAPPINGS is empty in tag_mapping_template.py")
    print()
    print("Please edit tag_mapping_template.py and configure your tags first")
    exit(1)

print("Found tag mappings in template:")
print("-" * 70)
for mapping in TAG_MAPPINGS:
    print(f"  Asset ID {mapping['asset_id']}:")
    print(f"    Running: {mapping.get('running', 'Not set')}")
    print(f"    Trip:    {mapping.get('trip', 'Not set')}")
    print(f"    Off:     {mapping.get('off', 'Not set')}")
    print(f"    Invert:  {mapping.get('invert_logic', False)}")
    print()

# Read setup_s7_tags.py
try:
    with open('setup_s7_tags.py', 'r') as f:
        content = f.read()
except Exception as e:
    print(f"❌ ERROR: Could not read setup_s7_tags.py: {e}")
    exit(1)

# Find TAG_MAPPINGS section
start_marker = "    TAG_MAPPINGS = ["
end_marker = "    ]"

start_idx = content.find(start_marker)
if start_idx == -1:
    print("❌ ERROR: Could not find TAG_MAPPINGS in setup_s7_tags.py")
    exit(1)

# Find the closing bracket
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("❌ ERROR: Could not find closing bracket for TAG_MAPPINGS")
    exit(1)

# Create new TAG_MAPPINGS section
import pprint
mappings_str = pprint.pformat(TAG_MAPPINGS, indent=8, width=80)

# Replace TAG_MAPPINGS = [...] with configured version
new_content = (
    content[:start_idx] +
    f"    TAG_MAPPINGS = {mappings_str}" +
    content[end_idx + len(end_marker):]
)

# Backup original
backup_file = 'setup_s7_tags.py.backup'
try:
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"✅ Backup created: {backup_file}")
except Exception as e:
    print(f"⚠️  Warning: Could not create backup: {e}")

# Write updated file
try:
    with open('setup_s7_tags.py', 'w') as f:
        f.write(new_content)
    print(f"✅ Updated setup_s7_tags.py with your tag mappings")
except Exception as e:
    print(f"❌ ERROR: Could not write setup_s7_tags.py: {e}")
    # Restore backup
    if os.path.exists(backup_file):
        with open(backup_file, 'r') as f:
            backup_content = f.read()
        with open('setup_s7_tags.py', 'w') as f:
            f.write(backup_content)
    exit(1)

print()
print("═" * 70)
print("✅ Configuration Applied!")
print("═" * 70)
print()
print("Next steps:")
print("  1. Review the changes in setup_s7_tags.py")
print("  2. Run: python setup_s7_tags.py")
print("  3. Run: python s7_service.py")
print()
