import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export const initDatabase = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'technician', 'viewer')),
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Assets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      asset_tag TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      location TEXT,
      manufacturer TEXT,
      model TEXT,
      serial_number TEXT,
      purchase_date DATE,
      warranty_expiry DATE,
      status TEXT NOT NULL CHECK(status IN ('operational', 'down', 'maintenance', 'retired')),
      criticality TEXT CHECK(criticality IN ('low', 'medium', 'high', 'critical')),
      description TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Work Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      asset_id INTEGER,
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL CHECK(status IN ('open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled')),
      work_type TEXT NOT NULL CHECK(work_type IN ('corrective', 'preventive', 'inspection', 'project')),
      assigned_to INTEGER,
      reported_by INTEGER,
      estimated_hours REAL,
      actual_hours REAL,
      scheduled_date DATETIME,
      completed_date DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (reported_by) REFERENCES users(id)
    )
  `);

  // Preventive Maintenance table
  db.exec(`
    CREATE TABLE IF NOT EXISTS preventive_maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
      frequency_value INTEGER NOT NULL,
      last_completed DATETIME,
      next_due DATETIME NOT NULL,
      assigned_to INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);

  // Parts/Inventory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_quantity INTEGER DEFAULT 0,
      unit TEXT,
      unit_cost REAL,
      location TEXT,
      supplier TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Work Order Parts (junction table)
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      inventory_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
      FOREIGN KEY (inventory_id) REFERENCES inventory(id)
    )
  `);

  // Leave Requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      leave_type TEXT NOT NULL CHECK(leave_type IN ('vacation', 'sick', 'personal', 'other')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reason TEXT,
      approved_by INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);

  // OPC Connections table - stores PLC connection configuration per asset
  db.exec(`
    CREATE TABLE IF NOT EXISTS opc_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL UNIQUE,
      plc_type TEXT NOT NULL CHECK(plc_type IN ('siemens', 'allen_bradley', 'schneider', 'mitsubishi', 'generic_opcua')),
      server_url TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      polling_interval INTEGER DEFAULT 5000,
      connection_timeout INTEGER DEFAULT 10000,
      username TEXT,
      password TEXT,
      notes TEXT,
      last_connected DATETIME,
      connection_status TEXT DEFAULT 'disconnected' CHECK(connection_status IN ('connected', 'disconnected', 'error')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    )
  `);

  // OPC Tags table - stores tag mappings for monitoring asset status
  db.exec(`
    CREATE TABLE IF NOT EXISTS opc_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opc_connection_id INTEGER NOT NULL,
      tag_type TEXT NOT NULL CHECK(tag_type IN ('running', 'trip', 'off', 'custom')),
      tag_name TEXT NOT NULL,
      tag_address TEXT NOT NULL,
      data_type TEXT DEFAULT 'boolean' CHECK(data_type IN ('boolean', 'integer', 'float', 'string')),
      invert_logic BOOLEAN DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opc_connection_id) REFERENCES opc_connections(id) ON DELETE CASCADE
    )
  `);

  // Asset Status Log table - tracks real-time status history
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_status_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('running', 'trip', 'off', 'unknown')),
      running_bit BOOLEAN,
      trip_bit BOOLEAN,
      off_bit BOOLEAN,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    )
  `);

  // Create index for faster status queries
  db.exec(`CREATE INDEX IF NOT EXISTS idx_asset_status_log_asset_time ON asset_status_log(asset_id, timestamp DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_opc_connections_asset ON opc_connections(asset_id)`);

  // Migration: Add sub_role column to users table if it doesn't exist
  const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
  const hasSubRole = columns.some((col: any) => col.name === 'sub_role');
  const hasTheme = columns.some((col: any) => col.name === 'theme');

  if (!hasSubRole) {
    db.exec(`ALTER TABLE users ADD COLUMN sub_role TEXT CHECK(sub_role IN ('electrical', 'mechanical', NULL))`);
    console.log('Added sub_role column to users table');
  }

  if (!hasTheme) {
    db.exec(`ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light' CHECK(theme IN ('light', 'dark', 'blue', 'green', 'purple'))`);
    console.log('Added theme column to users table');
  }

  // Migration: Add pm_schedule_id column to work_orders table if it doesn't exist
  const woColumns = db.prepare("PRAGMA table_info(work_orders)").all() as any[];
  const hasPmScheduleId = woColumns.some((col: any) => col.name === 'pm_schedule_id');

  if (!hasPmScheduleId) {
    db.exec(`ALTER TABLE work_orders ADD COLUMN pm_schedule_id INTEGER REFERENCES preventive_maintenance(id)`);
    console.log('Added pm_schedule_id column to work_orders table');
  }

  // Migration: Add real_time_status column to assets table if it doesn't exist
  const assetColumns = db.prepare("PRAGMA table_info(assets)").all() as any[];
  const hasRealTimeStatus = assetColumns.some((col: any) => col.name === 'real_time_status');
  const hasLastOpcUpdate = assetColumns.some((col: any) => col.name === 'last_opc_update');

  if (!hasRealTimeStatus) {
    db.exec(`ALTER TABLE assets ADD COLUMN real_time_status TEXT CHECK(real_time_status IN ('running', 'trip', 'off', 'unknown', NULL))`);
    console.log('Added real_time_status column to assets table');
  }

  if (!hasLastOpcUpdate) {
    db.exec(`ALTER TABLE assets ADD COLUMN last_opc_update DATETIME`);
    console.log('Added last_opc_update column to assets table');
  }

  // Create default admin user if users table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, email, password, role, full_name)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', 'admin@cmms.local', hashedPassword, 'admin', 'System Administrator');
    console.log('Default admin user created: admin/admin123');
  }

  console.log('Database initialized successfully');
};

export default db;
