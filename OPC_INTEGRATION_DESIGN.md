# OPC UA Integration - Comprehensive Design & Implementation Plan

## Research Summary

### Best Practices from OPC Foundation (2024-2025)
1. **Subscription-based monitoring** (preferred over polling for real-time data)
2. **Automatic reconnection** with Republish to recover missed data
3. **Context managers** for proper resource management
4. **Security**: X509 certificates, user authentication, audit trails
5. **Scalability**: Platform-agnostic, OS-independent, low memory footprint
6. **Hybrid architecture**: OPC UA + MQTT for cloud integration

### Key Technical Insights
- **asyncua library**: Official Python OPC UA implementation (asyncio-based)
- **Reconnection strategy**: ActivateSession → Republish loop → ResendData if needed
- **LifetimeCount**: Configure for max expected disconnect duration
- **QueueSize**: Buffer data changes during disconnections
- **Keep-alive**: Monitor connection via subscription keep-alive

---

## Architecture Design

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CMMS Web Application                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Frontend  │  │   Backend    │  │   Database       │  │
│  │   (React)   │←→│  (Node.js)   │←→│   (SQLite)       │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API
                              ↓
                    ┌──────────────────┐
                    │  OPC UA Service  │
                    │    (Python)      │
                    └────────┬─────────┘
                             │ OPC UA Protocol
                    ┌────────┴─────────┐
                    │                  │
              ┌─────▼─────┐     ┌─────▼─────┐
              │  PLC 1    │     │  PLC 2    │
              │ (Siemens) │     │(Allen-B)  │
              └───────────┘     └───────────┘
```

### Data Flow

#### Mode 1: Subscription-based (Recommended)
```
PLC → OPC UA Server → Subscription → DataChange Event → Python Service
  → Update Database → Frontend polls REST API → Display real-time status
```

#### Mode 2: Polling-based (Fallback)
```
Timer → Python Service → Read OPC Tags → Update Database
  → Frontend polls REST API → Display status
```

---

## Database Schema (Already Implemented)

### opc_connections
- Represents physical PLC/OPC Server
- One PLC can serve multiple assets
- Fields: name, plc_type, server_url, credentials, polling_interval

### opc_tags
- Maps PLC tags to assets
- Fields: opc_connection_id, asset_id, tag_type, tag_address, invert_logic

### asset_status_log
- Historical status tracking
- Fields: asset_id, status, running_bit, trip_bit, off_bit, timestamp

---

## Implementation Strategy

### Phase 1: Core OPC UA Client
**Features:**
- ✅ Connection management with auto-reconnect
- ✅ Subscription-based monitoring (preferred)
- ✅ Polling-based fallback
- ✅ Tag grouping by PLC
- ✅ Async/await pattern
- ✅ Error handling and logging

### Phase 2: Data Processing
**Features:**
- ✅ Status determination (Running/Trip/Off/Unknown)
- ✅ Inverted logic support
- ✅ Database updates
- ✅ Historical logging

### Phase 3: Reliability
**Features:**
- ✅ Connection health monitoring
- ✅ Automatic reconnection with data recovery
- ✅ Queue management during disconnects
- ✅ Graceful degradation

### Phase 4: Frontend
**Features:**
- ✅ PLC connection management
- ✅ Tag configuration per asset
- ✅ Real-time status dashboard
- ✅ Connection health indicators

---

## Technical Specifications

### Python OPC Service

**Libraries:**
```python
asyncua==1.1.0        # OPC UA client (latest stable)
aiosqlite==0.19.0     # Async SQLite
python-dotenv==1.0.0  # Configuration
```

**Key Classes:**
1. **OPCConnectionManager**: Manages all PLC connections
2. **OPCSubscriptionHandler**: Handles data change events
3. **TagMonitor**: Monitors tags for a single asset
4. **DatabaseManager**: Async database operations

**Configuration:**
```python
DEFAULT_TIMEOUT = 10000  # 10 seconds
DEFAULT_POLLING = 5000   # 5 seconds
SUBSCRIPTION_INTERVAL = 1000  # 1 second (for subscriptions)
QUEUE_SIZE = 100  # Buffer 100 data changes
LIFETIME_COUNT = 300  # 5 minutes at 1s interval
MAX_RECONNECT_DELAY = 60  # Max 60s between reconnects
```

### Connection Patterns

**Pattern 1: Subscription (Preferred)**
```python
async with Client(server_url) as client:
    subscription = await client.create_subscription(1000, handler)
    await subscription.subscribe_data_change([node1, node2])
    # Automatic keep-alive and reconnection
```

**Pattern 2: Polling (Fallback)**
```python
async with Client(server_url) as client:
    while True:
        values = await client.read_values([node1, node2])
        process_values(values)
        await asyncio.sleep(interval)
```

### Error Handling Strategy

**Connection Errors:**
- Initial connection failure → Log error, retry with exponential backoff
- Connection lost → Auto-reconnect with ActivateSession
- Persistent failure → Mark connection as 'error' in database

**Tag Errors:**
- Tag not found → Log error, mark tag as invalid
- Type mismatch → Log error, skip tag
- Read timeout → Use last known value, log warning

**Database Errors:**
- Connection failed → Retry with backoff
- Write failed → Queue writes, retry batch

---

## Status Determination Logic

```python
def determine_status(running, trip, off):
    """
    Priority: Trip > Running > Off > Unknown

    Truth Table:
    R | T | O | Status
    --+---+---+---------
    0 | 0 | 0 | Unknown
    0 | 0 | 1 | Off
    0 | 1 | 0 | Trip
    0 | 1 | 1 | Trip (priority)
    1 | 0 | 0 | Running
    1 | 0 | 1 | Running (priority)
    1 | 1 | 0 | Trip (priority)
    1 | 1 | 1 | Trip (priority)
    """
    if trip:
        return 'trip'
    elif running:
        return 'running'
    elif off:
        return 'off'
    else:
        return 'unknown'
```

---

## Security Considerations

### Development/Testing
- No encryption (MessageSecurityMode.None)
- No authentication
- For testing on local network only

### Production
- Enable MessageSecurityMode.SignAndEncrypt
- Use X509 certificates
- Implement user authentication
- Enable audit logging
- Network segmentation (VLAN)

---

## Performance Optimization

### Database
- Batch inserts for status logs
- Periodic cleanup of old logs (90 days)
- Indexes on asset_id and timestamp

### Network
- Group tags by PLC to minimize connections
- Use subscriptions to reduce network traffic
- Configure appropriate publishing intervals

### Memory
- Limit queue sizes
- Periodic garbage collection
- Monitor memory usage

---

## Monitoring & Logging

### Log Levels
- **DEBUG**: Tag reads, value changes
- **INFO**: Connections, disconnections, status changes
- **WARNING**: Reconnection attempts, tag errors
- **ERROR**: Connection failures, database errors
- **CRITICAL**: Service crashes

### Metrics to Track
- Connection uptime per PLC
- Tags read per second
- Average response time
- Error rate
- Database write latency

---

## Testing Strategy

### Unit Tests
- Status determination logic
- Inverted logic handling
- Connection string parsing
- Error handling

### Integration Tests
- Connect to OPC UA demo server
- Subscribe to test tags
- Verify database writes
- Test reconnection logic

### Performance Tests
- 100+ simultaneous connections
- 1000+ tags per PLC
- Network interruption scenarios
- Database write throughput

---

## Deployment

### Docker Container
```dockerfile
FROM python:3.11-slim
RUN pip install asyncua aiosqlite python-dotenv
COPY opc_service.py .
CMD ["python", "opc_service.py"]
```

### Environment Variables
```env
DB_PATH=/data/database.sqlite
LOG_LEVEL=INFO
MAX_CONNECTIONS=100
SUBSCRIPTION_MODE=true
```

### Health Checks
```bash
# Check if service is running
ps aux | grep opc_service

# Check connections
tail -f opc_service.log | grep "Connected"

# Database status
sqlite3 database.sqlite "SELECT COUNT(*) FROM asset_status_log WHERE timestamp > datetime('now', '-5 minutes')"
```

---

## Migration Guide

### From Polling to Subscription
1. Enable `subscription_mode` in connection settings
2. Service automatically uses subscriptions
3. Falls back to polling if subscriptions fail

### Schema Migration
- Automatic on service startup
- Detects old schema (asset-based)
- Migrates to new schema (PLC-based)
- Zero downtime

---

## Future Enhancements

### Phase 5: Advanced Features
- [ ] OPC UA Historical Data Access (HA)
- [ ] Alarm & Condition monitoring
- [ ] Method calls (start/stop equipment)
- [ ] Write values to PLCs
- [ ] Certificate-based security

### Phase 6: Cloud Integration
- [ ] MQTT Sparkplug bridge
- [ ] Cloud data streaming
- [ ] Remote monitoring
- [ ] Edge analytics

---

## References

- OPC Foundation: https://opcfoundation.org/
- asyncua Documentation: https://opcua-asyncio.readthedocs.io/
- OPC UA Specification: https://reference.opcfoundation.org/
- Best Practices: https://opcconnect.opcfoundation.org/

---

## Success Criteria

✅ Connect to 5 different PLC types
✅ Monitor 100+ assets simultaneously
✅ <1 second latency for status updates
✅ 99.9% uptime with auto-reconnect
✅ Zero data loss during brief disconnects
✅ Comprehensive error logging
✅ User-friendly frontend interface

---

**Document Version:** 1.0
**Date:** 2025-01-23
**Status:** Ready for Implementation
