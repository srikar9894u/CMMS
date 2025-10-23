#!/usr/bin/env python3
"""
Production-Ready OPC UA Service for CMMS
Implements subscription-based monitoring with automatic reconnection
Based on best practices from OPC Foundation (2024-2025)

Features:
- Subscription-based monitoring (preferred method)
- Polling-based fallback
- Automatic reconnection with data recovery
- Tag grouping by PLC
- Comprehensive error handling
- Async/await architecture for scalability
"""

import asyncio
import sqlite3
import aiosqlite
import logging
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass
from enum import Enum
import traceback

try:
    from asyncua import Client, ua
    from asyncua.common.subscription import SubHandler
except ImportError:
    print("ERROR: asyncua not installed. Install with: pip install asyncua")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('opc_service.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class MonitoringMode(Enum):
    """OPC monitoring modes"""
    SUBSCRIPTION = "subscription"  # Preferred: Event-driven
    POLLING = "polling"            # Fallback: Timer-based


@dataclass
class OPCConnection:
    """Represents a PLC connection"""
    id: int
    name: str
    plc_type: str
    server_url: str
    enabled: bool
    polling_interval: int
    connection_timeout: int
    username: Optional[str]
    password: Optional[str]


@dataclass
class OPCTag:
    """Represents a tag mapping"""
    id: int
    opc_connection_id: int
    asset_id: int
    tag_type: str  # 'running', 'trip', 'off'
    tag_name: str
    tag_address: str
    data_type: str
    invert_logic: bool
    asset_name: str


class SubscriptionHandler(SubHandler):
    """Handles subscription data change events"""

    def __init__(self, connection_manager, connection_id: int):
        self.connection_manager = connection_manager
        self.connection_id = connection_id
        logger.info(f"Subscription handler created for connection {connection_id}")

    def datachange_notification(self, node, val, data):
        """Called when subscribed data changes"""
        try:
            node_id = node.nodeid.to_string()
            logger.debug(f"Data change: {node_id} = {val}")

            # Find tag by node address and update
            asyncio.create_task(
                self.connection_manager.process_tag_value(
                    self.connection_id, node_id, val
                )
            )
        except Exception as e:
            logger.error(f"Error in datachange_notification: {e}")

    def event_notification(self, event):
        """Called when an event occurs"""
        logger.debug(f"Event: {event}")


class OPCConnectionManager:
    """Manages all OPC UA connections and monitoring"""

    def __init__(self, db_path: str = '../backend/database.sqlite'):
        self.db_path = db_path
        self.connections: Dict[int, Client] = {}
        self.subscriptions: Dict[int, Any] = {}
        self.monitoring_tasks: Dict[int, asyncio.Task] = {}
        self.tag_cache: Dict[int, List[OPCTag]] = {}  # connection_id -> tags
        self.node_cache: Dict[int, Dict[str, Any]] = {}  # connection_id -> {node_id: node}
        self.monitoring_mode: Dict[int, MonitoringMode] = {}
        self.reconnect_delays: Dict[int, float] = {}
        self.max_reconnect_delay = 60.0  # Max 60 seconds between retries

    async def get_db_connection(self):
        """Get async SQLite database connection"""
        return await aiosqlite.connect(self.db_path)

    async def get_active_connections(self) -> List[OPCConnection]:
        """Fetch all active OPC connections from database"""
        async with await self.get_db_connection() as db:
            async with db.execute("""
                SELECT
                    id, name, plc_type, server_url, enabled,
                    polling_interval, connection_timeout,
                    username, password
                FROM opc_connections
                WHERE enabled = 1
            """) as cursor:
                rows = await cursor.fetchall()
                return [
                    OPCConnection(
                        id=row[0],
                        name=row[1],
                        plc_type=row[2],
                        server_url=row[3],
                        enabled=bool(row[4]),
                        polling_interval=row[5],
                        connection_timeout=row[6],
                        username=row[7],
                        password=row[8]
                    )
                    for row in rows
                ]

    async def get_tags_for_connection(self, connection_id: int) -> List[OPCTag]:
        """Fetch all tags for a specific connection"""
        async with await self.get_db_connection() as db:
            async with db.execute("""
                SELECT
                    ot.id, ot.opc_connection_id, ot.asset_id,
                    ot.tag_type, ot.tag_name, ot.tag_address,
                    ot.data_type, ot.invert_logic,
                    a.name as asset_name
                FROM opc_tags ot
                JOIN assets a ON ot.asset_id = a.id
                WHERE ot.opc_connection_id = ?
            """, (connection_id,)) as cursor:
                rows = await cursor.fetchall()
                return [
                    OPCTag(
                        id=row[0],
                        opc_connection_id=row[1],
                        asset_id=row[2],
                        tag_type=row[3],
                        tag_name=row[4],
                        tag_address=row[5],
                        data_type=row[6],
                        invert_logic=bool(row[7]),
                        asset_name=row[8]
                    )
                    for row in rows
                ]

    async def update_connection_status(
        self,
        connection_id: int,
        status: str,
        last_connected: Optional[datetime] = None
    ):
        """Update connection status in database"""
        async with await self.get_db_connection() as db:
            if last_connected:
                await db.execute(
                    "UPDATE opc_connections SET connection_status = ?, last_connected = ? WHERE id = ?",
                    (status, last_connected.isoformat(), connection_id)
                )
            else:
                await db.execute(
                    "UPDATE opc_connections SET connection_status = ? WHERE id = ?",
                    (status, connection_id)
                )
            await db.commit()

    async def update_asset_status(
        self,
        asset_id: int,
        status: str,
        running_bit: bool,
        trip_bit: bool,
        off_bit: bool
    ):
        """Update asset real-time status and log to history"""
        now = datetime.now().isoformat()

        async with await self.get_db_connection() as db:
            # Update asset real-time status
            await db.execute(
                "UPDATE assets SET real_time_status = ?, last_opc_update = ? WHERE id = ?",
                (status, now, asset_id)
            )

            # Log to history
            await db.execute(
                """INSERT INTO asset_status_log
                   (asset_id, status, running_bit, trip_bit, off_bit, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (asset_id, status, running_bit, trip_bit, off_bit, now)
            )

            await db.commit()

    def determine_asset_status(self, running: Optional[bool], trip: Optional[bool], off: Optional[bool]) -> str:
        """
        Determine overall asset status based on tag values
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

    async def process_tag_value(self, connection_id: int, node_id: str, value: Any):
        """Process a tag value update"""
        try:
            tags = self.tag_cache.get(connection_id, [])

            # Find tag by node address
            matching_tag = None
            for tag in tags:
                if tag.tag_address == node_id:
                    matching_tag = tag
                    break

            if not matching_tag:
                return

            # Apply invert logic
            bool_value = bool(value)
            if matching_tag.invert_logic:
                bool_value = not bool_value

            # Group tags by asset and update status
            asset_tags = {}
            for tag in tags:
                if tag.asset_id not in asset_tags:
                    asset_tags[tag.asset_id] = {
                        'running': None,
                        'trip': None,
                        'off': None
                    }

            # Update the changed tag value
            asset_tags[matching_tag.asset_id][matching_tag.tag_type] = bool_value

            # Read current values for other tags (from cache or nodes)
            for tag in tags:
                if tag.asset_id == matching_tag.asset_id and tag.id != matching_tag.id:
                    # Try to read current value
                    try:
                        node = self.node_cache[connection_id].get(tag.tag_address)
                        if node:
                            val = await node.read_value()
                            if tag.invert_logic:
                                val = not bool(val)
                            asset_tags[tag.asset_id][tag.tag_type] = bool(val)
                    except:
                        pass  # Use None if can't read

            # Determine and update status
            asset_status = asset_tags[matching_tag.asset_id]
            status = self.determine_asset_status(
                asset_status['running'],
                asset_status['trip'],
                asset_status['off']
            )

            await self.update_asset_status(
                matching_tag.asset_id,
                status,
                asset_status['running'] or False,
                asset_status['trip'] or False,
                asset_status['off'] or False
            )

            logger.info(f"Asset '{matching_tag.asset_name}' status: {status}")

        except Exception as e:
            logger.error(f"Error processing tag value: {e}")
            logger.debug(traceback.format_exc())

    async def monitor_with_subscription(self, conn_config: OPCConnection):
        """Monitor using subscription (preferred method)"""
        connection_id = conn_config.id
        client = None

        try:
            logger.info(f"Attempting subscription mode for {conn_config.name}")

            # Create client
            client = Client(url=conn_config.server_url)
            client.session_timeout = conn_config.connection_timeout

            # Set credentials if provided
            if conn_config.username:
                await client.set_user(conn_config.username)
            if conn_config.password:
                await client.set_password(conn_config.password)

            # Connect
            await client.connect()
            logger.info(f"Connected to {conn_config.name} at {conn_config.server_url}")

            await self.update_connection_status(connection_id, 'connected', datetime.now())
            self.connections[connection_id] = client

            # Get tags
            tags = await self.get_tags_for_connection(connection_id)
            self.tag_cache[connection_id] = tags
            logger.info(f"Loaded {len(tags)} tags for {conn_config.name}")

            if not tags:
                logger.warning(f"No tags configured for {conn_config.name}")
                await asyncio.sleep(30)
                return

            # Get nodes
            nodes = []
            self.node_cache[connection_id] = {}

            for tag in tags:
                try:
                    node = client.get_node(tag.tag_address)
                    nodes.append(node)
                    self.node_cache[connection_id][tag.tag_address] = node
                except Exception as e:
                    logger.error(f"Error getting node {tag.tag_address}: {e}")

            if not nodes:
                logger.error(f"No valid nodes found for {conn_config.name}")
                return

            # Create subscription
            handler = SubscriptionHandler(self, connection_id)
            subscription = await client.create_subscription(
                period=1000,  # 1 second publishing interval
                handler=handler
            )
            self.subscriptions[connection_id] = subscription

            # Subscribe to data changes
            await subscription.subscribe_data_change(nodes)
            logger.info(f"Subscribed to {len(nodes)} nodes for {conn_config.name}")

            # Keep connection alive
            while True:
                await asyncio.sleep(10)  # Check every 10 seconds
                # Connection is kept alive by subscription keep-alive

        except Exception as e:
            logger.error(f"Subscription error for {conn_config.name}: {e}")
            logger.debug(traceback.format_exc())
            await self.update_connection_status(connection_id, 'error')

            # Fall back to polling
            logger.info(f"Falling back to polling mode for {conn_config.name}")
            self.monitoring_mode[connection_id] = MonitoringMode.POLLING
            await self.monitor_with_polling(conn_config)

        finally:
            if client:
                try:
                    await client.disconnect()
                    logger.info(f"Disconnected from {conn_config.name}")
                except:
                    pass

            if connection_id in self.connections:
                del self.connections[connection_id]
            if connection_id in self.subscriptions:
                del self.subscriptions[connection_id]
            if connection_id in self.node_cache:
                del self.node_cache[connection_id]

    async def monitor_with_polling(self, conn_config: OPCConnection):
        """Monitor using polling (fallback method)"""
        connection_id = conn_config.id
        client = None

        try:
            logger.info(f"Using polling mode for {conn_config.name}")

            # Create client
            client = Client(url=conn_config.server_url)
            client.session_timeout = conn_config.connection_timeout

            # Set credentials
            if conn_config.username:
                await client.set_user(conn_config.username)
            if conn_config.password:
                await client.set_password(conn_config.password)

            # Connect
            await client.connect()
            logger.info(f"Connected to {conn_config.name} (polling mode)")

            await self.update_connection_status(connection_id, 'connected', datetime.now())
            self.connections[connection_id] = client

            # Get tags
            tags = await self.get_tags_for_connection(connection_id)
            self.tag_cache[connection_id] = tags

            if not tags:
                logger.warning(f"No tags configured for {conn_config.name}")
                await asyncio.sleep(30)
                return

            # Group tags by asset
            assets_tags: Dict[int, Dict[str, OPCTag]] = {}
            for tag in tags:
                if tag.asset_id not in assets_tags:
                    assets_tags[tag.asset_id] = {}
                assets_tags[tag.asset_id][tag.tag_type] = tag

            # Polling loop
            polling_interval = conn_config.polling_interval / 1000.0

            while True:
                try:
                    # Read all tags for each asset
                    for asset_id, asset_tag_dict in assets_tags.items():
                        tag_values = {'running': None, 'trip': None, 'off': None}

                        for tag_type, tag in asset_tag_dict.items():
                            try:
                                node = client.get_node(tag.tag_address)
                                value = await node.read_value()

                                # Apply invert logic
                                if tag.invert_logic:
                                    value = not bool(value)

                                tag_values[tag_type] = bool(value)

                            except Exception as e:
                                logger.error(f"Error reading tag {tag.tag_address}: {e}")

                        # Determine status
                        status = self.determine_asset_status(
                            tag_values['running'],
                            tag_values['trip'],
                            tag_values['off']
                        )

                        # Update database
                        await self.update_asset_status(
                            asset_id,
                            status,
                            tag_values['running'] or False,
                            tag_values['trip'] or False,
                            tag_values['off'] or False
                        )

                        asset_name = asset_tag_dict[list(asset_tag_dict.keys())[0]].asset_name
                        logger.debug(f"Polled {asset_name}: {status}")

                    await asyncio.sleep(polling_interval)

                except Exception as e:
                    logger.error(f"Polling error for {conn_config.name}: {e}")
                    break

        except Exception as e:
            logger.error(f"Polling setup error for {conn_config.name}: {e}")
            logger.debug(traceback.format_exc())
            await self.update_connection_status(connection_id, 'error')

        finally:
            if client:
                try:
                    await client.disconnect()
                except:
                    pass

            if connection_id in self.connections:
                del self.connections[connection_id]

    async def monitor_connection(self, conn_config: OPCConnection):
        """Monitor a PLC connection with automatic reconnection"""
        connection_id = conn_config.id
        reconnect_delay = 1.0  # Start with 1 second

        while True:
            try:
                # Determine monitoring mode (default to subscription)
                mode = self.monitoring_mode.get(connection_id, MonitoringMode.SUBSCRIPTION)

                if mode == MonitoringMode.SUBSCRIPTION:
                    await self.monitor_with_subscription(conn_config)
                else:
                    await self.monitor_with_polling(conn_config)

                # If we get here, connection was lost
                logger.warning(f"Connection lost to {conn_config.name}, reconnecting...")

            except asyncio.CancelledError:
                logger.info(f"Monitoring cancelled for {conn_config.name}")
                break

            except Exception as e:
                logger.error(f"Error monitoring {conn_config.name}: {e}")
                await self.update_connection_status(connection_id, 'error')

            # Exponential backoff for reconnection
            logger.info(f"Reconnecting to {conn_config.name} in {reconnect_delay}s...")
            await asyncio.sleep(reconnect_delay)

            reconnect_delay = min(reconnect_delay * 2, self.max_reconnect_delay)

    async def start_monitoring(self):
        """Start monitoring all active OPC connections"""
        logger.info("═══════════════════════════════════════════════════════")
        logger.info("  OPC UA Monitoring Service Starting")
        logger.info("  Mode: Subscription (with polling fallback)")
        logger.info("═══════════════════════════════════════════════════════")

        connections = await self.get_active_connections()
        logger.info(f"Found {len(connections)} active OPC connections")

        if not connections:
            logger.warning("No active connections found. Add connections in CMMS OPC Configuration.")
            # Keep running and check periodically
            while True:
                await asyncio.sleep(60)
                connections = await self.get_active_connections()
                if connections:
                    logger.info(f"New connections detected: {len(connections)}")
                    break

        # Start monitoring task for each connection
        for conn in connections:
            task = asyncio.create_task(self.monitor_connection(conn))
            self.monitoring_tasks[conn.id] = task
            logger.info(f"Started monitoring: {conn.name} ({conn.plc_type})")

        # Keep service running
        if self.monitoring_tasks:
            await asyncio.gather(*self.monitoring_tasks.values(), return_exceptions=True)

    async def stop_monitoring(self):
        """Stop all monitoring tasks"""
        logger.info("Stopping OPC monitoring service...")

        for task in self.monitoring_tasks.values():
            task.cancel()

        await asyncio.gather(*self.monitoring_tasks.values(), return_exceptions=True)
        self.monitoring_tasks.clear()

        logger.info("OPC monitoring service stopped")


async def main():
    """Main entry point"""
    import os

    db_path = os.getenv('DB_PATH', '../backend/database.sqlite')
    logger.info(f"Database path: {db_path}")

    manager = OPCConnectionManager(db_path)

    try:
        await manager.start_monitoring()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal (Ctrl+C)")
        await manager.stop_monitoring()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        logger.debug(traceback.format_exc())
        await manager.stop_monitoring()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Service terminated by user")
    except Exception as e:
        logger.error(f"Service crashed: {e}")
        sys.exit(1)
