#!/usr/bin/env python3
"""
OPC UA Client for CMMS Asset Monitoring
Supports multiple PLC types: Siemens, Allen Bradley, Schneider, Mitsubishi, Generic OPC UA
"""

import asyncio
import time
import sqlite3
import logging
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any
from asyncua import Client, ua
from asyncua.common.subscription import SubHandler
import os

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


class OPCConnectionManager:
    """Manages OPC UA connections to PLCs and monitors asset status"""

    def __init__(self, db_path: str = '../backend/database.sqlite'):
        self.db_path = db_path
        self.active_connections: Dict[int, Client] = {}
        self.monitoring_tasks: Dict[int, asyncio.Task] = {}

    def get_db_connection(self):
        """Get SQLite database connection"""
        return sqlite3.connect(self.db_path)

    def get_active_opc_connections(self) -> List[Dict]:
        """Fetch all active OPC connections from database"""
        conn = self.get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT
                oc.id,
                oc.asset_id,
                oc.plc_type,
                oc.server_url,
                oc.polling_interval,
                oc.connection_timeout,
                oc.username,
                oc.password,
                a.name as asset_name
            FROM opc_connections oc
            JOIN assets a ON oc.asset_id = a.id
            WHERE oc.enabled = 1
        """

        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        connections = [dict(zip(columns, row)) for row in cursor.fetchall()]

        conn.close()
        return connections

    def get_tags_for_connection(self, connection_id: int) -> List[Dict]:
        """Fetch OPC tags for a specific connection"""
        conn = self.get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT id, tag_type, tag_name, tag_address, data_type, invert_logic
            FROM opc_tags
            WHERE opc_connection_id = ?
        """

        cursor.execute(query, (connection_id,))
        columns = [desc[0] for desc in cursor.description]
        tags = [dict(zip(columns, row)) for row in cursor.fetchall()]

        conn.close()
        return tags

    def update_connection_status(self, connection_id: int, status: str, last_connected: Optional[datetime] = None):
        """Update connection status in database"""
        conn = self.get_db_connection()
        cursor = conn.cursor()

        if last_connected:
            cursor.execute(
                "UPDATE opc_connections SET connection_status = ?, last_connected = ? WHERE id = ?",
                (status, last_connected.isoformat(), connection_id)
            )
        else:
            cursor.execute(
                "UPDATE opc_connections SET connection_status = ? WHERE id = ?",
                (status, connection_id)
            )

        conn.commit()
        conn.close()

    def update_asset_status(self, asset_id: int, status: str, running_bit: bool, trip_bit: bool, off_bit: bool):
        """Update asset real-time status and log to history"""
        conn = self.get_db_connection()
        cursor = conn.cursor()

        now = datetime.now().isoformat()

        # Update asset real-time status
        cursor.execute(
            "UPDATE assets SET real_time_status = ?, last_opc_update = ? WHERE id = ?",
            (status, now, asset_id)
        )

        # Log to history
        cursor.execute(
            """INSERT INTO asset_status_log
               (asset_id, status, running_bit, trip_bit, off_bit, timestamp)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (asset_id, status, running_bit, trip_bit, off_bit, now)
        )

        conn.commit()
        conn.close()

    def get_plc_specific_config(self, plc_type: str) -> Dict[str, Any]:
        """Get PLC-specific configuration and connection parameters"""
        configs = {
            'siemens': {
                'security_mode': ua.MessageSecurityMode.None_,
                'security_policy': 'http://opcfoundation.org/UA/SecurityPolicy#None',
                'timeout': 10,
            },
            'allen_bradley': {
                'security_mode': ua.MessageSecurityMode.None_,
                'security_policy': 'http://opcfoundation.org/UA/SecurityPolicy#None',
                'timeout': 10,
            },
            'schneider': {
                'security_mode': ua.MessageSecurityMode.None_,
                'security_policy': 'http://opcfoundation.org/UA/SecurityPolicy#None',
                'timeout': 10,
            },
            'mitsubishi': {
                'security_mode': ua.MessageSecurityMode.None_,
                'security_policy': 'http://opcfoundation.org/UA/SecurityPolicy#None',
                'timeout': 10,
            },
            'generic_opcua': {
                'security_mode': ua.MessageSecurityMode.None_,
                'security_policy': 'http://opcfoundation.org/UA/SecurityPolicy#None',
                'timeout': 10,
            }
        }

        return configs.get(plc_type, configs['generic_opcua'])

    async def read_tag_value(self, client: Client, tag_address: str, invert_logic: bool = False) -> Optional[bool]:
        """Read a single tag value from PLC"""
        try:
            # Get the node using the tag address (node ID)
            node = client.get_node(tag_address)
            value = await node.read_value()

            # Apply invert logic if configured
            if invert_logic:
                return not bool(value)

            return bool(value)
        except Exception as e:
            logger.error(f"Error reading tag {tag_address}: {e}")
            return None

    def determine_asset_status(self, running: Optional[bool], trip: Optional[bool], off: Optional[bool]) -> str:
        """Determine overall asset status based on tag values"""
        # Priority: trip > running > off > unknown
        if trip is True:
            return 'trip'
        elif running is True:
            return 'running'
        elif off is True:
            return 'off'
        else:
            return 'unknown'

    async def monitor_asset(self, connection_config: Dict):
        """Monitor a single asset via OPC connection"""
        connection_id = connection_config['id']
        asset_id = connection_config['asset_id']
        asset_name = connection_config['asset_name']
        server_url = connection_config['server_url']
        plc_type = connection_config['plc_type']
        polling_interval = connection_config['polling_interval'] / 1000.0  # Convert ms to seconds

        logger.info(f"Starting monitoring for asset '{asset_name}' (ID: {asset_id}) - {plc_type}")

        while True:
            client = None
            try:
                # Create OPC UA client
                client = Client(url=server_url)

                # Apply PLC-specific configuration
                plc_config = self.get_plc_specific_config(plc_type)
                client.session_timeout = plc_config['timeout'] * 1000

                # Set credentials if provided
                if connection_config.get('username'):
                    client.set_user(connection_config['username'])
                if connection_config.get('password'):
                    client.set_password(connection_config['password'])

                # Connect to PLC
                await client.connect()
                logger.info(f"Connected to {asset_name} at {server_url}")

                # Update connection status
                self.update_connection_status(connection_id, 'connected', datetime.now())

                # Get tags for this connection
                tags = self.get_tags_for_connection(connection_id)

                # Monitor loop
                while True:
                    tag_values = {}

                    # Read all configured tags
                    for tag in tags:
                        value = await self.read_tag_value(
                            client,
                            tag['tag_address'],
                            bool(tag['invert_logic'])
                        )
                        tag_values[tag['tag_type']] = value

                    # Determine asset status
                    status = self.determine_asset_status(
                        tag_values.get('running'),
                        tag_values.get('trip'),
                        tag_values.get('off')
                    )

                    # Update asset status in database
                    self.update_asset_status(
                        asset_id,
                        status,
                        tag_values.get('running', False),
                        tag_values.get('trip', False),
                        tag_values.get('off', False)
                    )

                    logger.debug(f"{asset_name}: Status={status}, Values={tag_values}")

                    # Wait for next polling interval
                    await asyncio.sleep(polling_interval)

            except asyncio.CancelledError:
                logger.info(f"Monitoring cancelled for {asset_name}")
                break
            except Exception as e:
                logger.error(f"Error monitoring {asset_name}: {e}")
                self.update_connection_status(connection_id, 'error')

                # Wait before retry
                await asyncio.sleep(30)  # Retry after 30 seconds
            finally:
                if client:
                    try:
                        await client.disconnect()
                        logger.info(f"Disconnected from {asset_name}")
                    except:
                        pass

    async def start_monitoring(self):
        """Start monitoring all active OPC connections"""
        logger.info("OPC Monitoring Service Starting...")

        connections = self.get_active_opc_connections()
        logger.info(f"Found {len(connections)} active OPC connections")

        # Start monitoring task for each connection
        for conn in connections:
            task = asyncio.create_task(self.monitor_asset(conn))
            self.monitoring_tasks[conn['id']] = task

        # Keep service running
        if self.monitoring_tasks:
            await asyncio.gather(*self.monitoring_tasks.values(), return_exceptions=True)
        else:
            logger.warning("No active connections to monitor")

    async def stop_monitoring(self):
        """Stop all monitoring tasks"""
        logger.info("Stopping OPC monitoring...")

        for task in self.monitoring_tasks.values():
            task.cancel()

        await asyncio.gather(*self.monitoring_tasks.values(), return_exceptions=True)
        self.monitoring_tasks.clear()


async def main():
    """Main entry point"""
    # Get database path from environment or use default
    db_path = os.getenv('DB_PATH', '../backend/database.sqlite')

    manager = OPCConnectionManager(db_path)

    try:
        await manager.start_monitoring()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
        await manager.stop_monitoring()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        await manager.stop_monitoring()


if __name__ == '__main__':
    asyncio.run(main())
