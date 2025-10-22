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
