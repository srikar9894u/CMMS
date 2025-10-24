#!/usr/bin/env python3
"""
S7 Protocol Service for CMMS
Connects directly to Siemens S7-300/400/1200/1500 PLCs without OPC UA gateway

Supports S7-416 and other S7 PLCs using snap7 library
"""

import asyncio
import aiosqlite
import logging
import os
import sys
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from enum import Enum

try:
    import snap7
    from snap7.util import *
except ImportError:
    print("ERROR: snap7 library not installed!")
    print("Install with: pip install python-snap7")
    print("\nAlso install snap7 library:")
    print("  Windows: Download from https://github.com/Davinci/snap7/releases")
    print("  Linux:   sudo apt-get install libsnap7-1 libsnap7-dev")
    print("  Mac:     brew install snap7")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database path
DB_PATH = os.getenv('DB_PATH', '../backend/database.sqlite')


class PLCType(Enum):
    """Supported PLC types"""
    S7_300 = "S7-300"
    S7_400 = "S7-400"  # S7-416 is S7-400 series
    S7_1200 = "S7-1200"
    S7_1500 = "S7-1500"


@dataclass
class S7Connection:
    """S7 PLC connection configuration"""
    id: int
    name: str
    plc_type: str
    ip_address: str
    rack: int
    slot: int
    enabled: bool
    polling_interval: int


@dataclass
class S7Tag:
    """S7 tag configuration"""
    id: int
    connection_id: int
    asset_id: int
    tag_type: str
    tag_name: str
    tag_address: str  # Format: DB1.DBX0.0, M0.0, I0.0, Q0.0
    data_type: str
    invert_logic: bool


class S7ConnectionManager:
    """Manages S7 PLC connections and data acquisition"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connections: Dict[int, snap7.client.Client] = {}
        self.monitoring_tasks: Dict[int, asyncio.Task] = {}

    async def initialize(self):
        """Initialize connection manager and start monitoring"""
        logger.info("Initializing S7 Connection Manager")

        # Load S7 connections from database
        async with aiosqlite.connect(self.db_path) as db:
            # Check if s7_connections table exists
            cursor = await db.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='s7_connections'"
            )
            if not await cursor.fetchone():
                logger.info("Creating s7_connections table")
                await self.create_tables(db)
                await db.commit()

        # Start monitoring all enabled connections
        await self.start_monitoring()

        logger.info("S7 Connection Manager initialized")

    async def create_tables(self, db):
        """Create S7-specific tables if they don't exist"""

        # S7 Connections table
        await db.execute("""
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
        """)

        # S7 Tags table (similar to OPC tags)
        await db.execute("""
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
        """)

        logger.info("S7 tables created")

    async def start_monitoring(self):
        """Start monitoring all enabled S7 connections"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                "SELECT id, name, plc_type, ip_address, rack, slot, enabled, polling_interval FROM s7_connections WHERE enabled = 1"
            ) as cursor:
                rows = await cursor.fetchall()

                for row in rows:
                    conn_config = S7Connection(
                        id=row[0],
                        name=row[1],
                        plc_type=row[2],
                        ip_address=row[3],
                        rack=row[4],
                        slot=row[5],
                        enabled=row[6],
                        polling_interval=row[7]
                    )

                    # Start monitoring task for this connection
                    task = asyncio.create_task(self.monitor_connection(conn_config))
                    self.monitoring_tasks[conn_config.id] = task
                    logger.info(f"Started monitoring: {conn_config.name} ({conn_config.ip_address})")

    async def monitor_connection(self, conn_config: S7Connection):
        """Monitor a single S7 connection with polling"""
        connection_id = conn_config.id
        reconnect_delay = 1.0

        while True:
            try:
                logger.info(f"Connecting to {conn_config.name} at {conn_config.ip_address}")

                # Create S7 client
                client = snap7.client.Client()

                # Connect to PLC
                client.connect(
                    conn_config.ip_address,
                    conn_config.rack,
                    conn_config.slot
                )

                if client.get_connected():
                    logger.info(f"Connected to {conn_config.name}")
                    self.connections[connection_id] = client

                    # Update connection status in database
                    await self.update_connection_status(connection_id, 'connected')

                    # Reset reconnect delay on successful connection
                    reconnect_delay = 1.0

                    # Poll tags at configured interval
                    await self.poll_tags(client, conn_config)

                else:
                    raise Exception("Failed to connect to PLC")

            except Exception as e:
                logger.error(f"Error monitoring {conn_config.name}: {e}")

                # Update connection status
                await self.update_connection_status(connection_id, 'error')

                # Disconnect if connected
                if connection_id in self.connections:
                    try:
                        self.connections[connection_id].disconnect()
                    except:
                        pass
                    del self.connections[connection_id]

                # Wait before reconnecting (exponential backoff)
                logger.info(f"Reconnecting in {reconnect_delay}s...")
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, 60.0)

    async def poll_tags(self, client: snap7.client.Client, conn_config: S7Connection):
        """Poll all tags for a connection"""
        connection_id = conn_config.id
        polling_interval = conn_config.polling_interval / 1000.0  # Convert to seconds

        while client.get_connected():
            try:
                # Get all tags for this connection
                async with aiosqlite.connect(self.db_path) as db:
                    async with db.execute("""
                        SELECT id, asset_id, tag_type, tag_name, tag_address, data_type, invert_logic
                        FROM s7_tags
                        WHERE s7_connection_id = ?
                    """, (connection_id,)) as cursor:
                        tags = await cursor.fetchall()

                # Group tags by asset
                assets_tags: Dict[int, Dict[str, S7Tag]] = {}

                for tag_row in tags:
                    tag = S7Tag(
                        id=tag_row[0],
                        connection_id=connection_id,
                        asset_id=tag_row[1],
                        tag_type=tag_row[2],
                        tag_name=tag_row[3],
                        tag_address=tag_row[4],
                        data_type=tag_row[5],
                        invert_logic=bool(tag_row[6])
                    )

                    if tag.asset_id not in assets_tags:
                        assets_tags[tag.asset_id] = {}

                    assets_tags[tag.asset_id][tag.tag_type] = tag

                # Read values for each asset's tags
                for asset_id, asset_tag_dict in assets_tags.items():
                    tag_values = {}

                    for tag_type, tag in asset_tag_dict.items():
                        try:
                            # Read tag value from PLC
                            value = await self.read_tag(client, tag.tag_address, tag.data_type)

                            # Apply invert logic if needed
                            if tag.invert_logic and isinstance(value, bool):
                                value = not value

                            tag_values[tag_type] = value

                        except Exception as e:
                            logger.error(f"Error reading tag {tag.tag_name} ({tag.tag_address}): {e}")
                            tag_values[tag_type] = None

                    # Determine asset status
                    status = self.determine_asset_status(
                        tag_values.get('running'),
                        tag_values.get('trip'),
                        tag_values.get('off')
                    )

                    # Update asset status in database
                    await self.update_asset_status(
                        asset_id,
                        status,
                        tag_values.get('running'),
                        tag_values.get('trip'),
                        tag_values.get('off')
                    )

                # Wait before next poll
                await asyncio.sleep(polling_interval)

            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                # Re-raise to trigger reconnection
                raise

    async def read_tag(self, client: snap7.client.Client, tag_address: str, data_type: str):
        """Read a single tag from PLC

        Tag address formats:
        - DB tags: DB1.DBX0.0, DB1.DBW2, DB1.DBD4
        - Memory: M0.0, MW2, MD4
        - Inputs: I0.0, IW2, ID4
        - Outputs: Q0.0, QW2, QD4
        """

        # Run blocking S7 read in thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._read_tag_sync, client, tag_address, data_type)

    def _read_tag_sync(self, client: snap7.client.Client, tag_address: str, data_type: str):
        """Synchronous tag read (called from thread pool)"""

        tag_upper = tag_address.upper()

        # Parse tag address
        if tag_upper.startswith('DB'):
            # Data Block tag: DB1.DBX0.0, DB1.DBW2, DB1.DBD4
            return self._read_db_tag(client, tag_address)

        elif tag_upper.startswith('M'):
            # Memory tag: M0.0, MW2, MD4
            return self._read_memory_tag(client, tag_address)

        elif tag_upper.startswith('I'):
            # Input tag: I0.0, IW2, ID4
            return self._read_input_tag(client, tag_address)

        elif tag_upper.startswith('Q'):
            # Output tag: Q0.0, QW2, QD4
            return self._read_output_tag(client, tag_address)

        else:
            raise ValueError(f"Unsupported tag format: {tag_address}")

    def _read_db_tag(self, client: snap7.client.Client, tag_address: str) -> any:
        """Read Data Block tag: DB1.DBX0.0, DB1.DBW2, DB1.DBD4"""

        # Parse: DB<number>.DB<type><offset>.<bit>
        parts = tag_address.upper().split('.')

        if len(parts) < 2:
            raise ValueError(f"Invalid DB tag format: {tag_address}")

        # Extract DB number
        db_num = int(parts[0][2:])  # Remove 'DB' prefix

        # Extract type, offset, and bit
        tag_part = parts[1]

        if tag_part.startswith('DBX'):
            # Bit: DBX0.0
            offset = int(tag_part[3:])
            bit = int(parts[2]) if len(parts) > 2 else 0

            # Read 1 byte
            data = client.db_read(db_num, offset, 1)
            return get_bool(data, 0, bit)

        elif tag_part.startswith('DBW'):
            # Word (16-bit): DBW2
            offset = int(tag_part[3:])
            data = client.db_read(db_num, offset, 2)
            return get_int(data, 0)

        elif tag_part.startswith('DBD'):
            # Double Word (32-bit): DBD4
            offset = int(tag_part[3:])
            data = client.db_read(db_num, offset, 4)
            return get_dint(data, 0)

        elif tag_part.startswith('DBB'):
            # Byte: DBB0
            offset = int(tag_part[3:])
            data = client.db_read(db_num, offset, 1)
            return data[0]

        else:
            raise ValueError(f"Unsupported DB tag type: {tag_address}")

    def _read_memory_tag(self, client: snap7.client.Client, tag_address: str) -> any:
        """Read Memory tag: M0.0, MW2, MD4"""

        tag_upper = tag_address.upper()

        if tag_upper[1] == 'W':
            # Memory Word: MW2
            offset = int(tag_upper[2:])
            area = snap7.types.Areas.MK
            data = client.read_area(area, 0, offset, 2)
            return get_int(data, 0)

        elif tag_upper[1] == 'D':
            # Memory Double Word: MD4
            offset = int(tag_upper[2:])
            area = snap7.types.Areas.MK
            data = client.read_area(area, 0, offset, 4)
            return get_dint(data, 0)

        elif tag_upper[1] == 'B':
            # Memory Byte: MB0
            offset = int(tag_upper[2:])
            area = snap7.types.Areas.MK
            data = client.read_area(area, 0, offset, 1)
            return data[0]

        else:
            # Memory Bit: M0.0
            parts = tag_upper.split('.')
            offset = int(parts[0][1:])
            bit = int(parts[1])
            area = snap7.types.Areas.MK
            data = client.read_area(area, 0, offset, 1)
            return get_bool(data, 0, bit)

    def _read_input_tag(self, client: snap7.client.Client, tag_address: str) -> any:
        """Read Input tag: I0.0, IW2, ID4"""

        tag_upper = tag_address.upper()
        area = snap7.types.Areas.PE

        if tag_upper[1] == 'W':
            offset = int(tag_upper[2:])
            data = client.read_area(area, 0, offset, 2)
            return get_int(data, 0)
        elif tag_upper[1] == 'D':
            offset = int(tag_upper[2:])
            data = client.read_area(area, 0, offset, 4)
            return get_dint(data, 0)
        elif tag_upper[1] == 'B':
            offset = int(tag_upper[2:])
            data = client.read_area(area, 0, offset, 1)
            return data[0]
        else:
            parts = tag_upper.split('.')
            offset = int(parts[0][1:])
            bit = int(parts[1])
            data = client.read_area(area, 0, offset, 1)
            return get_bool(data, 0, bit)

    def _read_output_tag(self, client: snap7.client.Client, tag_address: str) -> any:
        """Read Output tag: Q0.0, QW2, QD4"""

        tag_upper = tag_address.upper()
        area = snap7.types.Areas.PA

        if tag_upper[1] == 'W':
            offset = int(tag_upper[2:])
            data = client.read_area(area, 0, offset, 2)
            return get_int(data, 0)
        elif tag_upper[1] == 'D':
            offset = int(tag_upper[2:])
            data = client.read_area(area, 0, offset, 4)
            return get_dint(data, 0)
        elif tag_upper[1] == 'B':
            offset = int(tag_upper[2:])
            data = client.read_area(area, 0, offset, 1)
            return data[0]
        else:
            parts = tag_upper.split('.')
            offset = int(parts[0][1:])
            bit = int(parts[1])
            data = client.read_area(area, 0, offset, 1)
            return get_bool(data, 0, bit)

    def determine_asset_status(self, running: Optional[bool], trip: Optional[bool], off: Optional[bool]) -> str:
        """
        Determine asset status based on tag values
        Priority: Trip > Running > Off > Unknown
        """
        if trip is True:
            return 'trip'
        elif running is True:
            return 'running'
        elif off is True:
            return 'off'
        else:
            return 'unknown'

    async def update_connection_status(self, connection_id: int, status: str):
        """Update connection status in database"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                UPDATE s7_connections
                SET connection_status = ?, last_connected = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (status, connection_id))
            await db.commit()

    async def update_asset_status(self, asset_id: int, status: str, running: Optional[bool], trip: Optional[bool], off: Optional[bool]):
        """Update asset status in database"""
        async with aiosqlite.connect(self.db_path) as db:
            # Update asset real-time status
            await db.execute("""
                UPDATE assets
                SET real_time_status = ?, last_opc_update = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (status, asset_id))

            # Log status change
            await db.execute("""
                INSERT INTO asset_status_log (asset_id, status, running_bit, trip_bit, off_bit, timestamp)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (asset_id, status, running, trip, off))

            await db.commit()


async def main():
    """Main entry point"""
    logger.info("Starting S7 Protocol Service for CMMS")
    logger.info(f"Database path: {DB_PATH}")

    # Create connection manager
    manager = S7ConnectionManager(DB_PATH)

    # Initialize and start monitoring
    await manager.initialize()

    logger.info("S7 Service is running. Press Ctrl+C to stop.")

    # Keep running
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down S7 Service...")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Service stopped by user")
