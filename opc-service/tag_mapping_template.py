"""
S7-416 PLC Tag Mapping Configuration Template
==============================================

INSTRUCTIONS:
1. This file contains example tag mappings for your assets
2. Replace the example tag addresses with your actual PLC addresses
3. Copy the configured mappings into setup_s7_tags.py
4. Run: python setup_s7_tags.py

YOUR ASSETS:
============
Asset ID: 1 | Hammer Mill Motor | Tag: 240800
Asset ID: 2 | Hammer Mill        | Tag: 240800_HM

"""

# ========================================================================
# CONFIGURE YOUR TAG MAPPINGS BELOW
# ========================================================================

TAG_MAPPINGS = [

    # Asset ID 1: Hammer Mill Motor (240800)
    # -----------------------------------------------------------------------
    # Replace these addresses with your actual PLC tag addresses
    {
        'asset_id': 1,
        'running': 'DB1.DBX0.0',    # REPLACE: Tag for motor running status
        'trip': 'DB1.DBX0.1',       # REPLACE: Tag for motor trip/fault
        'off': 'DB1.DBX0.2',        # REPLACE: Tag for motor stopped (or None)
        'invert_logic': False       # Change to True if 0=ON, 1=OFF
    },

    # Asset ID 2: Hammer Mill (240800_HM)
    # -----------------------------------------------------------------------
    # Replace these addresses with your actual PLC tag addresses
    {
        'asset_id': 2,
        'running': 'DB1.DBX1.0',    # REPLACE: Tag for mill running status
        'trip': 'DB1.DBX1.1',       # REPLACE: Tag for mill trip/fault
        'off': 'DB1.DBX1.2',        # REPLACE: Tag for mill stopped (or None)
        'invert_logic': False       # Change to True if 0=ON, 1=OFF
    },

]

"""
TAG ADDRESS FORMAT EXAMPLES:
============================

Data Block Bits (most common):
  DB1.DBX0.0  - Data Block 1, Byte 0, Bit 0
  DB1.DBX0.1  - Data Block 1, Byte 0, Bit 1
  DB1.DBX0.7  - Data Block 1, Byte 0, Bit 7
  DB1.DBX1.0  - Data Block 1, Byte 1, Bit 0
  DB2.DBX10.5 - Data Block 2, Byte 10, Bit 5

Memory Bits:
  M0.0        - Memory bit 0.0
  M0.1        - Memory bit 0.1
  M1.0        - Memory bit 1.0

Input Bits:
  I0.0        - Input bit 0.0
  I1.5        - Input bit 1.5

Output Bits:
  Q0.0        - Output bit 0.0
  Q2.3        - Output bit 2.3

Words (if needed):
  DB1.DBW2    - Data Block 1, Word at byte 2
  MW4         - Memory Word at byte 4
  IW6         - Input Word at byte 6

Double Words (if needed):
  DB1.DBD4    - Data Block 1, Double Word at byte 4
  MD8         - Memory Double Word at byte 8

COMMON PLC NAMING CONVENTIONS:
==============================

If your PLC uses Siemens TIA Portal or STEP 7:
- Look for symbols like "Motor_Run", "Motor_Fault", "Motor_Stop"
- Check the tag table or symbol table in your PLC program
- Data blocks are usually organized by equipment area

Example mapping by area:
- DB10.DBX0.0 - Motor 1 Running
- DB10.DBX0.1 - Motor 1 Fault
- DB10.DBX0.2 - Motor 1 Stop
- DB10.DBX1.0 - Motor 2 Running
- DB10.DBX1.1 - Motor 2 Fault
- DB10.DBX1.2 - Motor 2 Stop

HOW TO FIND YOUR TAG ADDRESSES:
================================

1. Connect to PLC with STEP 7 or TIA Portal
2. Open your PLC program
3. Look for the symbols/tags related to:
   - Hammer Mill Motor (240800)
   - Hammer Mill (240800_HM)
4. Note the addresses (e.g., DB1.DBX0.0)
5. Replace the example addresses above

STEPS TO APPLY CONFIGURATION:
==============================

After you've updated the TAG_MAPPINGS above:

1. Copy the TAG_MAPPINGS section
2. Open setup_s7_tags.py in a text editor
3. Find the TAG_MAPPINGS = [] section (around line 84)
4. Replace the empty list with your configured mappings
5. Save the file
6. Run: python setup_s7_tags.py

Or use the helper script:
  python apply_tag_config.py

TESTING:
========

After applying configuration:

1. Test PLC connectivity:
   ping 192.168.10.10

2. Start S7 service:
   python s7_service.py

3. Check CMMS web interface:
   - Go to Assets page
   - You should see real-time status updates

NEED HELP?
==========

If you don't know your PLC tag addresses:
1. Contact your PLC programmer
2. Check PLC documentation
3. Use STEP 7/TIA Portal to browse PLC tags
4. Look at your HMI/SCADA configuration

"""
