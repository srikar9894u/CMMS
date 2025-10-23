# OPC UA Service for CMMS

Real-time asset monitoring service that connects to PLCs via OPC UA protocol.

## Supported PLC Types

- **Siemens** (S7-1200, S7-1500 with OPC UA Server)
- **Allen Bradley** (ControlLogix, CompactLogix with FactoryTalk Gateway)
- **Schneider Electric** (Modicon M580, M340 with OPC UA)
- **Mitsubishi** (iQ-R Series with OPC UA)
- **Generic OPC UA** (Any OPC UA compliant server)

## Connection Examples

### Siemens S7-1500
```
Server URL: opc.tcp://192.168.1.10:4840
Tag Address Examples:
- ns=3;s="DataBlock_1"."Running"
- ns=3;s="DataBlock_1"."Trip"
- ns=3;s="DataBlock_1"."Stop"
```

### Allen Bradley ControlLogix (via FactoryTalk)
```
Server URL: opc.tcp://192.168.1.20:49320
Tag Address Examples:
- ns=2;s=Channel1.Device1.RunningTag
- ns=2;s=Channel1.Device1.TripTag
- ns=2;s=Channel1.Device1.StopTag
```

### Schneider Modicon M580
```
Server URL: opc.tcp://192.168.1.30:4840
Tag Address Examples:
- ns=4;s=%MW100
- ns=4;s=%MW101
- ns=4;s=%MW102
```

### Mitsubishi iQ-R
```
Server URL: opc.tcp://192.168.1.40:4840
Tag Address Examples:
- ns=2;s=D100
- ns=2;s=D101
- ns=2;s=D102
```

### Generic OPC UA
```
Server URL: opc.tcp://[IP_ADDRESS]:[PORT]
Tag Address: Browse server to find node IDs
- ns=X;s=YourTagName
- ns=X;i=1234 (for integer identifiers)
```

## Tag Address Format

OPC UA uses NodeId format:
- `ns` = Namespace index (0-65535)
- `s` = String identifier
- `i` = Integer identifier
- `g` = GUID identifier
- `b` = ByteString identifier

**Examples:**
- `ns=2;s=MyTag` - Namespace 2, string identifier "MyTag"
- `ns=3;i=1001` - Namespace 3, integer identifier 1001
- `ns=0;i=85` - Server status (standard OPC UA)

## Configuration

### Tag Types
- **running**: Indicates asset is running/operational
- **trip**: Indicates asset has tripped/fault condition
- **off**: Indicates asset is stopped/off
- **custom**: Custom monitoring (future use)

### Invert Logic
Some PLCs use inverted logic (0 = ON, 1 = OFF). Enable "Invert Logic" checkbox for such tags.

**Example:**
- Normal: Tag value 1 = Running
- Inverted: Tag value 0 = Running (check "Invert Logic")

## Installation

### Standalone Installation
```bash
cd opc-service
pip install -r requirements.txt
python opc_client.py
```

### Docker Installation
```bash
cd opc-service
docker build -t cmms-opc-service .
docker run -d \
  --name cmms-opc \
  -v /path/to/database:/data \
  --network host \
  cmms-opc-service
```

### With Docker Compose
Add to your `docker-compose.yml`:
```yaml
opc-service:
  build: ./opc-service
  container_name: cmms-opc
  volumes:
    - ./backend:/data
  network_mode: host
  restart: unless-stopped
  depends_on:
    - backend
```

## Polling Configuration

- **Polling Interval**: How often to read tags (default: 5000ms = 5 seconds)
- **Connection Timeout**: Maximum time to wait for connection (default: 10000ms = 10 seconds)

**Recommendations:**
- Critical assets: 1000-3000ms (1-3 seconds)
- Normal monitoring: 5000-10000ms (5-10 seconds)
- Low priority: 30000-60000ms (30-60 seconds)

## Finding Tag Addresses

### Using UaExpert (Unified Automation)
1. Download UaExpert (free OPC UA client)
2. Add Server → Enter your PLC's OPC UA URL
3. Connect to server
4. Browse address space
5. Right-click tag → Copy NodeId

### Using Siemens TIA Portal
1. Open TIA Portal project
2. Find OPC UA Server configuration
3. Tags are in format: `ns=3;s="DBName"."TagName"`

### Using FactoryTalk Linx (Allen Bradley)
1. Open FactoryTalk Linx Gateway
2. Configure OPC UA endpoint
3. Browse tags in OPC UA client
4. Tag format: `ns=2;s=Channel.Device.TagName`

## Troubleshooting

### Cannot Connect
- Verify PLC IP address and port
- Check firewall rules (OPC UA uses TCP port 4840 by default)
- Ensure OPC UA server is enabled on PLC
- Verify network connectivity: `ping [PLC_IP]`

### Authentication Failed
- Check if PLC requires username/password
- Verify credentials in connection settings
- Some PLCs require certificate-based authentication

### Tag Not Found
- Verify tag address format matches PLC type
- Use OPC UA client (UaExpert) to browse correct NodeId
- Check namespace index (ns=X)

### Status Not Updating
- Check polling interval isn't too long
- Verify tags are configured correctly
- Check OPC service logs: `tail -f opc_service.log`
- Ensure tag data types are boolean or convertible to boolean

## Security Notes

- Use secure OPC UA (opc.tcp with security policy) in production
- Store credentials securely
- Use VLANs to isolate OT network from IT network
- Enable firewall rules to restrict access
- Consider using certificates for authentication

## Logs

Service logs are written to `opc_service.log`

View logs:
```bash
tail -f opc_service.log
```

## Status Determination Logic

The service determines asset status with the following priority:
1. **Trip** - Highest priority (fault/alarm condition)
2. **Running** - Asset is operational
3. **Off** - Asset is stopped
4. **Unknown** - No valid status determined

## Performance

- Supports monitoring 100+ assets simultaneously
- Async/await architecture for efficient concurrent connections
- Automatic reconnection on connection loss
- Database connection pooling for optimal performance
