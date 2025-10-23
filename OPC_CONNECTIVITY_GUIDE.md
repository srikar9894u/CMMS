# OPC UA Connectivity for Real-Time Asset Monitoring

Complete guide for connecting PLCs to CMMS for real-time asset status monitoring via OPC UA protocol.

## Overview

The OPC connectivity feature allows you to monitor real-time status of assets directly from PLCs (Programmable Logic Controllers). The system supports:

- **Siemens** (S7-1200, S7-1500 with OPC UA Server)
- **Allen Bradley** (ControlLogix, CompactLogix via FactoryTalk)
- **Schneider Electric** (Modicon M580, M340 with OPC UA)
- **Mitsubishi** (iQ-R Series with OPC UA)
- **Generic OPC UA** (Any OPC UA compliant server)

## Architecture

```
┌─────────────┐      OPC UA       ┌──────────────┐      REST API     ┌──────────────┐
│ PLC/SCADA   │ ◄──────────────► │ OPC Service  │ ◄────────────────► │   Backend    │
│  (Siemens,  │    TCP/IP Port   │  (Python)    │    SQLite DB      │  (Node.js)   │
│   AB, etc)  │      4840         │              │                   │              │
└─────────────┘                   └──────────────┘                   └──────────────┘
                                                                              │
                                                                              │
                                                                              ▼
                                                                      ┌──────────────┐
                                                                      │   Frontend   │
                                                                      │   (React)    │
                                                                      └──────────────┘
```

## Features

### 1. Real-Time Status Monitoring
- Monitor asset status: Running, Trip/Fault, Off/Stopped
- Automatic status updates based on configurable polling intervals
- Historical status tracking with timestamps
- Visual dashboard with status indicators

### 2. Multi-PLC Support
- Connect to different PLC brands simultaneously
- PLC-specific connection profiles
- Flexible tag addressing for different protocols

### 3. Tag Mapping
- Map PLC tags to asset status (Running, Trip, Off)
- Support for inverted logic (0=ON, 1=OFF)
- Custom tag monitoring
- Boolean, Integer, Float, String data types

### 4. Connection Management
- Enable/disable connections without deletion
- Configurable polling intervals (1-60 seconds)
- Connection timeout settings
- Secure credential storage
- Connection status monitoring

### 5. Status History
- Log all status changes
- Query history by time range
- Export status data for analysis
- Trend analysis capabilities

## Installation

### 1. Backend Setup

The OPC routes are already integrated into the backend. No additional setup required.

### 2. Python OPC Service Setup

#### Install Python Dependencies
```bash
cd opc-service
pip install -r requirements.txt
```

Requirements:
- Python 3.8 or higher
- opcua (OPC UA client library)
- asyncua (Async OPC UA)
- sqlite3
- requests

#### Run OPC Service Standalone
```bash
python opc_client.py
```

#### Run with Docker
```bash
cd opc-service
docker build -t cmms-opc-service .
docker run -d \
  --name cmms-opc \
  -v $(pwd)/../backend:/data \
  --network host \
  cmms-opc-service
```

#### Add to Docker Compose
Edit `docker-compose.yml`:
```yaml
services:
  # ... existing services ...

  opc-service:
    build: ./opc-service
    container_name: cmms-opc
    volumes:
      - ./backend:/data
    environment:
      - DB_PATH=/data/database.sqlite
    network_mode: host
    restart: unless-stopped
    depends_on:
      - backend
```

Then run:
```bash
docker-compose up -d opc-service
```

### 3. Frontend Access

Navigate to:
- **OPC Configuration**: `/opc-config` (Admin/Manager only)
- **Real-Time Status**: `/real-time-status` (All users)

## Configuration Guide

### Step 1: Configure OPC Connection

1. Go to **OPC Configuration** page
2. Click **"+ Add OPC Connection"**
3. Fill in the connection details:

   - **Asset**: Select the asset to monitor
   - **PLC Type**: Choose your PLC brand
   - **Server URL**: Enter OPC UA server address
   - **Polling Interval**: How often to read tags (default: 5000ms)
   - **Connection Timeout**: Max wait time (default: 10000ms)
   - **Username/Password**: If PLC requires authentication
   - **Enabled**: Check to activate connection

4. Click **"Create"**

### Step 2: Configure Tags

1. Click **"Tags"** button for the connection
2. Click **"Add New Tag"**
3. Configure each tag:

   - **Tag Type**: Running, Trip, Off, or Custom
   - **Tag Name**: Descriptive name (e.g., "Motor_Running")
   - **Tag Address**: OPC UA NodeId (e.g., `ns=3;s="DB1"."Running"`)
   - **Data Type**: Boolean (most common), Integer, Float, or String
   - **Invert Logic**: Check if logic is inverted (0=ON, 1=OFF)
   - **Description**: Optional notes

4. Click **"Add Tag"**
5. Repeat for Trip and Off tags

### Step 3: Verify Connection

1. Wait for polling interval
2. Check connection status in table (should show "Connected")
3. Navigate to **Real-Time Status** page
4. Verify asset shows current status

## Finding PLC Tag Addresses

### Method 1: Using UaExpert (Recommended)

UaExpert is a free OPC UA client from Unified Automation.

1. Download UaExpert: https://www.unified-automation.com/products/development-tools/uaexpert.html
2. Install and launch UaExpert
3. Add Server:
   - Right-click "Servers" → "Add..."
   - Enter OPC UA URL (e.g., `opc.tcp://192.168.1.10:4840`)
   - Click "OK"
4. Connect to server
5. Browse Address Space in left panel
6. Find your tag
7. Right-click tag → "Copy NodeId"
8. Use this NodeId as Tag Address in CMMS

### Method 2: PLC Programming Software

#### Siemens TIA Portal
1. Open TIA Portal project
2. Navigate to PLC → Communication → OPC UA Server
3. Tags are in format: `ns=3;s="DataBlockName"."TagName"`
4. Example: `ns=3;s="DB_Motors"."Motor1_Running"`

#### Allen Bradley Studio 5000
1. Install FactoryTalk Linx Gateway
2. Configure OPC UA endpoint
3. Use RSLinx to browse tags
4. Tag format: `ns=2;s=ChannelName.DeviceName.TagName`
5. Example: `ns=2;s=Local.PLC1.Motor_Status`

#### Schneider Control Expert
1. Open Control Expert project
2. Check OPC UA Server configuration
3. Tags use memory addresses: `ns=4;s=%MW100`
4. %MW = Memory Word, %MX = Memory Bit

## Connection Examples

### Siemens S7-1500

```
Server URL: opc.tcp://192.168.1.10:4840
Running Tag: ns=3;s="DB_Status"."Motor1_Run"
Trip Tag:    ns=3;s="DB_Status"."Motor1_Trip"
Off Tag:     ns=3;s="DB_Status"."Motor1_Stop"
```

**Finding Namespace (ns):**
- Usually `ns=3` for user data blocks
- Use UaExpert to verify

**Data Block Format:**
- `"DataBlockName"."VariableName"`
- Must include quotes for string identifiers

### Allen Bradley ControlLogix

```
Server URL: opc.tcp://192.168.1.20:49320
Running Tag: ns=2;s=Channel1.Device1.Motor_Running
Trip Tag:    ns=2;s=Channel1.Device1.Motor_Tripped
Off Tag:     ns=2;s=Channel1.Device1.Motor_Stopped
```

**Notes:**
- Requires FactoryTalk Gateway
- Default OPC UA port: 49320
- No quotes needed in tag path

### Schneider Modicon M580

```
Server URL: opc.tcp://192.168.1.30:4840
Running Tag: ns=4;s=%MW100
Trip Tag:    ns=4;s=%MW101
Off Tag:     ns=4;s=%MW102
```

**Memory Types:**
- `%MW` = Memory Word (16-bit)
- `%MD` = Memory Double Word (32-bit)
- `%MX` = Memory Bit

### Mitsubishi iQ-R

```
Server URL: opc.tcp://192.168.1.40:4840
Running Tag: ns=2;s=D100
Trip Tag:    ns=2;s=D101
Off Tag:     ns=2;s=D102
```

**Device Types:**
- `D` = Data register
- `M` = Auxiliary relay
- `X` = Input
- `Y` = Output

## Tag Address Format

OPC UA NodeId format: `ns=X;[identifier]`

**Namespace (ns):**
- `ns=0`: Standard OPC UA namespace
- `ns=1-65535`: Vendor-specific namespaces

**Identifier Types:**
- `s=StringName`: String identifier (most common)
- `i=1234`: Integer identifier
- `g=UUID`: GUID identifier
- `b=Base64`: ByteString identifier

**Examples:**
```
ns=2;s=MyTagName        ← String identifier in namespace 2
ns=3;i=1001             ← Integer identifier in namespace 3
ns=0;i=85               ← Server status (standard OPC UA)
ns=3;s="DB1"."Value"    ← Hierarchical string with quotes
```

## Inverted Logic

Some PLCs use inverted logic where:
- **0 (FALSE)** = Device is ON/Running
- **1 (TRUE)** = Device is OFF/Stopped

**When to use "Invert Logic":**
- Check this box if your PLC uses reverse logic
- System will automatically invert the bit value
- Common in safety circuits and normally-closed contacts

**Example:**
```
PLC Bit Value: 0
Without Invert: Status = Off
With Invert:    Status = Running  ✓ Correct
```

## Status Determination Logic

The system determines asset status with priority:

1. **Trip** (Highest Priority)
   - If Trip bit is TRUE → Status = "Trip"
   - Indicates fault/alarm condition

2. **Running**
   - If Running bit is TRUE → Status = "Running"
   - Asset is operational

3. **Off**
   - If Off bit is TRUE → Status = "Off"
   - Asset is stopped normally

4. **Unknown** (Lowest Priority)
   - All bits are FALSE or NULL → Status = "Unknown"
   - No valid status determined

**Example Scenarios:**
```
Running=1, Trip=0, Off=0  →  Status = Running
Running=1, Trip=1, Off=0  →  Status = Trip     (Trip overrides Running)
Running=0, Trip=0, Off=1  →  Status = Off
Running=0, Trip=0, Off=0  →  Status = Unknown
```

## Polling Intervals

Recommended intervals based on asset criticality:

| Asset Type | Interval | Reason |
|------------|----------|--------|
| Critical Equipment (Emergency Systems) | 1-2 seconds | Immediate fault detection |
| High-Priority (Production Lines) | 3-5 seconds | Fast response, balanced load |
| Normal Monitoring | 5-10 seconds | Standard monitoring |
| Low-Priority (Non-Critical) | 30-60 seconds | Reduce network/CPU load |

**Considerations:**
- Shorter intervals = Higher CPU/network usage
- Very short intervals (<1s) may overload PLC
- Balance responsiveness vs. system load

## Troubleshooting

### Connection Issues

**Problem:** Connection status shows "Disconnected" or "Error"

**Solutions:**
1. Verify PLC IP address:
   ```bash
   ping 192.168.1.10
   ```

2. Check OPC UA server is enabled on PLC

3. Verify port is open:
   ```bash
   telnet 192.168.1.10 4840
   ```

4. Check firewall rules (OPC UA uses TCP port 4840 by default)

5. Verify credentials if authentication is required

6. Check OPC service logs:
   ```bash
   tail -f opc-service/opc_service.log
   ```

### Tag Not Found

**Problem:** "Tag not found" or "Bad NodeId" errors

**Solutions:**
1. Use UaExpert to verify exact NodeId
2. Check namespace index (ns=X)
3. Verify quotes for string identifiers
4. Ensure tag exists in PLC program
5. Check case sensitivity

### Status Not Updating

**Problem:** Real-time status shows "Unknown" or doesn't update

**Solutions:**
1. Check polling interval isn't too long
2. Verify tags are configured correctly
3. Ensure "Invert Logic" setting is correct
4. Check PLC is writing to tags
5. Review OPC service logs for errors
6. Verify data types match (Boolean for status bits)

### Authentication Failed

**Problem:** Connection fails with auth error

**Solutions:**
1. Check username and password in OPC Configuration
2. Verify PLC security settings
3. Some PLCs require certificate-based auth
4. Check OPC UA server security policy

## Network Architecture

### Recommended Setup

```
[Corporate Network]
        │
        ├── VLAN 10 (IT Network)
        │   └── CMMS Server (192.168.10.x)
        │
        └── VLAN 20 (OT Network)
            └── PLCs (192.168.20.x)
```

### Security Best Practices

1. **Network Segmentation**
   - Separate IT and OT networks with VLANs
   - Use firewall between networks
   - Allow only necessary ports

2. **Access Control**
   - Restrict OPC Configuration to Admin/Manager roles
   - Use strong passwords for PLC authentication
   - Enable audit logging

3. **Encryption**
   - Use OPC UA security policies in production
   - Enable message signing and encryption
   - Use certificates for authentication

4. **Monitoring**
   - Review connection logs regularly
   - Monitor failed connection attempts
   - Set up alerts for connection failures

## Performance Optimization

### Database Optimization

The system automatically creates indexes for fast queries:
```sql
CREATE INDEX idx_asset_status_log_asset_time ON asset_status_log(asset_id, timestamp DESC);
CREATE INDEX idx_opc_connections_asset ON opc_connections(asset_id);
```

### Status History Retention

Default retention: Unlimited

To implement cleanup (add to cron):
```bash
# Delete status logs older than 90 days
sqlite3 database.sqlite "DELETE FROM asset_status_log WHERE timestamp < datetime('now', '-90 days')"
```

### Concurrent Connections

The OPC service uses async/await architecture:
- Supports 100+ concurrent PLC connections
- Non-blocking I/O for efficient resource usage
- Automatic reconnection on connection loss

## API Endpoints

### OPC Connections

```
GET    /api/opc/connections           - List all OPC connections
GET    /api/opc/connections/:id       - Get connection details
POST   /api/opc/connections           - Create connection
PUT    /api/opc/connections/:id       - Update connection
DELETE /api/opc/connections/:id       - Delete connection
```

### OPC Tags

```
GET    /api/opc/connections/:id/tags  - List tags for connection
POST   /api/opc/connections/:id/tags  - Create tag
PUT    /api/opc/tags/:id              - Update tag
DELETE /api/opc/tags/:id              - Delete tag
```

### Status Monitoring

```
GET    /api/opc/status/current               - Current status for all assets
GET    /api/opc/assets/:id/status-history    - Status history for asset
GET    /api/opc/assets/without-opc           - Assets without OPC connection
```

## Database Schema

### opc_connections
```sql
id                  INTEGER PRIMARY KEY
asset_id            INTEGER (UNIQUE, FK to assets)
plc_type            TEXT (siemens, allen_bradley, schneider, mitsubishi, generic_opcua)
server_url          TEXT
enabled             BOOLEAN
polling_interval    INTEGER (milliseconds)
connection_timeout  INTEGER (milliseconds)
username            TEXT (optional)
password            TEXT (optional)
connection_status   TEXT (connected, disconnected, error)
last_connected      DATETIME
notes               TEXT
created_at          DATETIME
updated_at          DATETIME
```

### opc_tags
```sql
id                  INTEGER PRIMARY KEY
opc_connection_id   INTEGER (FK to opc_connections)
tag_type            TEXT (running, trip, off, custom)
tag_name            TEXT
tag_address         TEXT (NodeId)
data_type           TEXT (boolean, integer, float, string)
invert_logic        BOOLEAN
description         TEXT
created_at          DATETIME
updated_at          DATETIME
```

### asset_status_log
```sql
id          INTEGER PRIMARY KEY
asset_id    INTEGER (FK to assets)
status      TEXT (running, trip, off, unknown)
running_bit BOOLEAN
trip_bit    BOOLEAN
off_bit     BOOLEAN
timestamp   DATETIME
```

### assets (Added Columns)
```sql
real_time_status  TEXT (running, trip, off, unknown)
last_opc_update   DATETIME
```

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review connection status
   - Check for failed connections
   - Verify status updates are current

2. **Monthly**
   - Clean up old status logs (if retention policy)
   - Review and optimize polling intervals
   - Check OPC service resource usage

3. **Quarterly**
   - Audit OPC configurations
   - Update PLC firmware if needed
   - Review security settings

### Backup

Important data to backup:
- Database (includes all OPC configurations)
- OPC service configuration
- Connection credentials (stored in database)

```bash
# Backup database
cp backend/database.sqlite backup/database_$(date +%Y%m%d).sqlite
```

## Support and Resources

### Documentation
- OPC UA Specification: https://opcfoundation.org/developer-tools/specifications-unified-architecture
- UaExpert Download: https://www.unified-automation.com/products/development-tools/uaexpert.html

### PLC-Specific Resources
- **Siemens**: TIA Portal OPC UA documentation
- **Allen Bradley**: FactoryTalk Gateway user manual
- **Schneider**: Control Expert OPC UA guide
- **Mitsubishi**: iQ-R OPC UA server manual

### Common Questions

**Q: Can I monitor assets without OPC?**
A: Yes! OPC is optional. Assets without OPC connection work normally with manual status updates.

**Q: How many assets can I monitor?**
A: The system supports 100+ concurrent connections. Actual limit depends on network and server resources.

**Q: Can I use this with SCADA systems?**
A: Yes! Most modern SCADA systems support OPC UA and can act as OPC servers.

**Q: Is this secure?**
A: The basic implementation uses unencrypted OPC UA. For production, enable OPC UA security policies with encryption and certificates.

**Q: What if my PLC doesn't support OPC UA?**
A: You can use an OPC UA gateway/bridge that converts other protocols (Modbus, S7, EtherNet/IP) to OPC UA.

## Conclusion

The OPC connectivity feature provides powerful real-time monitoring capabilities, bridging the gap between CMMS and industrial automation systems. Follow this guide to configure your PLCs and start monitoring asset status in real-time.

For additional support, refer to the `opc-service/README.md` for Python service details.
