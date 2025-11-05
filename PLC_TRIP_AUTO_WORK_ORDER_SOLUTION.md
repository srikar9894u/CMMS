# PLC Trip Automatic Work Order Creation - Solution

## 📋 Issue Reported

**Problem**: Flaker 1 showing TRIP status from PLC monitoring, but no work order was being created automatically.

**Date**: November 3, 2025
**Asset**: Flaker 1 (233000_M)
**Status**: ✅ **RESOLVED**

---

## 🔍 Root Cause Analysis

### What Was Happening:

1. **S7 PLC monitoring service** was successfully:
   - ✅ Connecting to PLC (S7-416 at 192.168.10.10)
   - ✅ Reading trip tag (I1.0)
   - ✅ Detecting trip status
   - ✅ Updating asset status to 'trip'
   - ✅ Logging status changes

2. **What Was Missing**:
   - ❌ No automatic work order creation when trip detected
   - ❌ No integration between PLC monitoring and work order system

### The Gap:

The S7 service (`opc-service/s7_service.py`) had logic to detect trips but **did not create work orders** automatically. It only updated the asset status in the database.

---

## ✅ Solution Implemented

### Code Changes: `opc-service/s7_service.py`

Modified the `update_asset_status()` method to include automatic work order creation:

**Location**: Lines 557-637

**New Functionality**:

```python
async def update_asset_status(self, asset_id: int, status: str, ...):
    """Update asset status in database and create work order for trips"""

    # Get previous status
    previous_status = ... # from database

    # Update asset status
    ...

    # AUTO-CREATE WORK ORDER for trip detection
    if status == 'trip' and previous_status != 'trip':
        # Check if work order already exists
        existing_count = ... # check for recent AUTO-TRIP work orders

        if existing_count == 0:
            # Create urgent corrective work order
            INSERT INTO work_orders (
                title = 'AUTO-TRIP: {asset_name} - PLC Detected',
                priority = 'urgent',
                work_type = 'corrective',
                status = 'open',
                ...
            )

            logger.info(f"✅ AUTO-CREATED WORK ORDER for trip")
```

### Key Features:

1. **Detects Status Change**: Only creates work order when status changes from non-trip to trip
2. **Prevents Duplicates**: Checks for existing AUTO-TRIP work orders in the last hour
3. **Urgent Priority**: All PLC-detected trips are marked as URGENT
4. **Clear Title**: Work orders titled `AUTO-TRIP: {Asset Name} - PLC Detected`
5. **Detailed Description**: Includes asset info, detection time, and action required

---

## 🎯 How It Works Now

### Automatic Work Order Creation Flow:

```
PLC Trip Bit (I1.0) Changes
    ↓
S7 Service Reads Tag (every polling interval)
    ↓
Status Changes: 'running' → 'trip'
    ↓
update_asset_status() called
    ↓
Checks: Is previous_status != 'trip'?
    ↓ Yes
Checks: Any AUTO-TRIP work orders in last hour?
    ↓ No
✅ CREATE URGENT WORK ORDER
    - Title: AUTO-TRIP: Flaker 1 - PLC Detected
    - Priority: urgent
    - Type: corrective
    - Status: open
    ↓
Log: "✅ AUTO-CREATED WORK ORDER for trip on asset..."
    ↓
Work Order appears in Work Orders page
```

---

## 📊 Test Results

### Test Work Order Created:

**Asset**: Flaker 1
**Work Order ID**: #6
**Title**: AUTO-TRIP: Flaker 1 - PLC Detected
**Priority**: Urgent 🔴
**Status**: Open
**Type**: Corrective
**Created**: 2025-11-03 09:05:00

### Work Order Details:

```json
{
  "id": 6,
  "title": "AUTO-TRIP: Flaker 1 - PLC Detected",
  "description": "AUTOMATIC WORK ORDER - PLC TRIP DETECTED\n\nAsset: Flaker 1\nTrip Detected: 2025-11-03T09:05:00.544Z\nDetection Method: S7 PLC Real-Time Monitoring\n\nTrip Status: ACTIVE\nAction Required: Investigate and resolve equipment trip immediately.",
  "asset_id": 3,
  "priority": "urgent",
  "status": "open",
  "work_type": "corrective"
}
```

---

## 🔧 Configuration

### Prerequisites:

1. **S7 Connection** configured (PLC Configuration page)
2. **Trip Tag** created for asset (Tags Management page)
3. **S7 Service** running (opc-service container)

### Tag Configuration for Flaker 1:

- **Connection**: S7-416 Production PLC (192.168.10.10)
- **Tag Type**: Trip/Fault Status
- **Tag Name**: Trip
- **Address**: I1.0
- **Data Type**: boolean
- **Invert Logic**: true

---

## 📱 User Experience

### In the UI:

1. **Real-Time Status Page**:
   - Shows Flaker 1 with TRIP status (red indicator)
   - "Tripped" count incremented
   - Status history shows trip events

2. **Work Orders Page**:
   - New work order appears: "AUTO-TRIP: Flaker 1 - PLC Detected"
   - Priority badge shows: Urgent (red)
   - Status shows: Open
   - Can be assigned to technician

3. **Tags Management Page**:
   - Shows trip tag is actively monitored
   - Connection status: connected

---

## 🆚 Comparison: Manual vs Automatic Trip Reporting

### Manual Trip Reporting (Trip Feedback Page):

- **Trigger**: User submits trip report via form
- **Work Order Title**: `TRIP: {Asset} - {User-Specified Reason}`
- **Data**: User-provided trip time, reason, description
- **Use Case**: When operator manually reports a trip

### Automatic PLC Trip Detection (This Solution):

- **Trigger**: PLC trip bit detected by S7 service
- **Work Order Title**: `AUTO-TRIP: {Asset} - PLC Detected`
- **Data**: Automatic detection time from PLC monitoring
- **Use Case**: Real-time automatic detection from PLC

**Both create work orders with URGENT priority!**

---

## 🔄 How to Test

### Test Scenario 1: Simulate Trip

1. Go to **Tags Management** page
2. Find Flaker 1 trip tag
3. Trigger the PLC trip bit (I1.0)
4. Wait for polling interval (~5 seconds)
5. Check **Real-Time Status** - should show TRIP
6. Check **Work Orders** - AUTO-TRIP work order created
7. Check logs: `docker-compose logs opc-service | grep AUTO`

### Test Scenario 2: Status Change

```bash
# Reset asset to running
docker exec cmms-backend node -e "
  const db = require('better-sqlite3')('/data/database.sqlite');
  db.prepare('UPDATE assets SET real_time_status = ? WHERE id = ?').run('running', 3);
  console.log('Status reset to running');
"

# Wait for S7 service to detect trip again
# Work order will be auto-created when trip bit detected
```

---

## 📝 Differences from Manual Trip Feedback

| Feature | Trip Feedback (Manual) | PLC Auto-Detection |
|---------|------------------------|-------------------|
| **Trigger** | User form submission | PLC bit change |
| **Title** | TRIP: Asset - Reason | AUTO-TRIP: Asset - PLC Detected |
| **Reason** | User-specified | PLC Detected |
| **Trip Time** | User-specified | Real-time from PLC |
| **Priority** | Urgent | Urgent |
| **Type** | Corrective | Corrective |
| **Table** | `trip_feedback` linked | Work orders only |
| **Use Case** | Manual reporting | Automatic 24/7 monitoring |

---

## 🛡️ Duplicate Prevention

The system prevents duplicate work orders:

1. **Time-based**: Only creates if no AUTO-TRIP work order in last hour
2. **Status-based**: Only creates on status change (not trip → trip)
3. **Asset-based**: Checks per asset
4. **Open status**: Only checks open/assigned/in_progress work orders

**Result**: One work order per trip event, no spam!

---

## 📊 Expected Behavior

### When Trip Occurs:

1. ⚡ **PLC trip bit activates** (I1.0 = true)
2. 🔄 **S7 service detects** change (within polling interval)
3. 📝 **Asset status updates** to 'trip'
4. 🚨 **Work order auto-created** if conditions met
5. 📧 **Managers notified** (future enhancement)
6. 👨‍🔧 **Technician can be assigned**
7. ✅ **Work completed** and asset restored

### When Trip Clears:

1. 🔄 PLC trip bit deactivates
2. 📝 Asset status updates to 'running'
3. 🔧 Work order remains open until manually completed
4. 📋 Technician closes work order with notes

---

## 🔮 Future Enhancements

### Potential Improvements:

1. **Email Notifications**: Send email to managers on auto-trip detection
2. **SMS Alerts**: Critical trips send SMS
3. **Auto-Assignment**: Assign to on-call technician automatically
4. **Trip Analysis**: Analyze trip frequency and patterns
5. **Preventive Recommendations**: Suggest PM based on trip history
6. **Integration with Trip Feedback**: Link AUTO-TRIP work orders to trip_feedback table

---

## ✅ Verification Checklist

- [x] S7 service connects to PLC
- [x] Trip tag reads correctly
- [x] Asset status updates to 'trip'
- [x] Status history logs trip events
- [x] Work order auto-created on trip detection
- [x] Work order has correct title format
- [x] Work order priority is 'urgent'
- [x] Work order type is 'corrective'
- [x] Duplicate prevention works
- [x] Work order visible in Work Orders page
- [x] Work order can be assigned and completed

---

## 📚 Related Documentation

- **TRIP_WORK_ORDER_VERIFICATION.md** - Manual trip feedback verification
- **S7_TAG_FORMATS.md** - S7 tag addressing guide
- **S7-416_CONNECTIVITY_GUIDE.md** - PLC connection setup

---

## 🎓 Summary

### Problem:
PLC-detected trips were not creating work orders automatically.

### Solution:
Enhanced S7 monitoring service to automatically create urgent corrective work orders when trip status is detected from PLC.

### Result:
✅ **Automatic work order creation for all PLC-detected trips**
✅ **No manual intervention required**
✅ **Immediate notification via work order system**
✅ **Urgent priority for fast response**
✅ **Duplicate prevention built-in**

**Status**: 🎉 **FULLY IMPLEMENTED AND WORKING!**

---

**Implemented By**: Claude Code
**Date**: November 3, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
