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

  // OPC Connections table - stores PLC connection configuration
  // One PLC can serve multiple assets
  db.exec(`
    CREATE TABLE IF NOT EXISTS opc_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plc_type TEXT NOT NULL CHECK(plc_type IN ('siemens', 'allen_bradley', 'schneider', 'mitsubishi', 'generic_opcua')),
      server_url TEXT NOT NULL UNIQUE,
      enabled BOOLEAN DEFAULT 1,
      polling_interval INTEGER DEFAULT 5000,
      connection_timeout INTEGER DEFAULT 10000,
      username TEXT,
      password TEXT,
      notes TEXT,
      last_connected DATETIME,
      connection_status TEXT DEFAULT 'disconnected' CHECK(connection_status IN ('connected', 'disconnected', 'error')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // OPC Tags table - stores tag mappings for monitoring asset status
  // Links specific tags from a PLC to specific assets
  db.exec(`
    CREATE TABLE IF NOT EXISTS opc_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opc_connection_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      tag_type TEXT NOT NULL CHECK(tag_type IN ('running', 'trip', 'off', 'custom')),
      tag_name TEXT NOT NULL,
      tag_address TEXT NOT NULL,
      data_type TEXT DEFAULT 'boolean' CHECK(data_type IN ('boolean', 'integer', 'float', 'string')),
      invert_logic BOOLEAN DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opc_connection_id) REFERENCES opc_connections(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      UNIQUE(opc_connection_id, asset_id, tag_type)
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

  // S7 Connections table - stores S7 PLC connection configuration
  // Supports direct S7 protocol communication (S7-300, S7-400, S7-1200, S7-1500)
  db.exec(`
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
  `);

  // S7 Tags table - stores tag mappings for S7 PLCs
  db.exec(`
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (s7_connection_id) REFERENCES s7_connections(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      UNIQUE(s7_connection_id, asset_id, tag_type)
    )
  `);

  // System Settings table - stores application-wide settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      setting_type TEXT DEFAULT 'string' CHECK(setting_type IN ('string', 'number', 'boolean', 'json')),
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `);

  // Application Logs table - stores application events and errors
  db.exec(`
    CREATE TABLE IF NOT EXISTS application_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_level TEXT NOT NULL CHECK(log_level IN ('ERROR', 'WARN', 'INFO', 'DEBUG')),
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      user_id INTEGER,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Documents Library table - stores all documents, manuals, drawings, and links
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL CHECK(category IN ('manual', 'drawing', 'specification', 'report', 'procedure', 'link', 'other')),
      file_path TEXT,
      file_type TEXT,
      file_size INTEGER,
      original_filename TEXT,
      external_url TEXT,
      asset_id INTEGER,
      inventory_id INTEGER,
      tags TEXT,
      download_count INTEGER DEFAULT 0,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL,
      FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Trip Feedback table - stores trip reports from electrical users
  db.exec(`
    CREATE TABLE IF NOT EXISTS trip_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      trip_time DATETIME NOT NULL,
      trip_reason TEXT,
      description TEXT,
      reported_by INTEGER NOT NULL,
      work_order_id INTEGER,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'work_order_created', 'resolved')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (reported_by) REFERENCES users(id),
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL
    )
  `);

  // Notification Logs table - stores all sent notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('email', 'sms', 'push')),
      event TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('sent', 'failed', 'pending')),
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Notification Preferences table - stores user notification settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      email_work_order_assigned BOOLEAN DEFAULT 1,
      email_work_order_completed BOOLEAN DEFAULT 1,
      email_work_order_approved BOOLEAN DEFAULT 1,
      email_pm_reminder_7days BOOLEAN DEFAULT 1,
      email_pm_reminder_1day BOOLEAN DEFAULT 1,
      email_leave_request BOOLEAN DEFAULT 1,
      email_leave_approved BOOLEAN DEFAULT 1,
      email_inventory_low BOOLEAN DEFAULT 1,
      email_daily_digest BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Email Configuration table - stores SMTP settings (admin only)
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      smtp_host TEXT NOT NULL,
      smtp_port INTEGER NOT NULL DEFAULT 587,
      smtp_secure BOOLEAN DEFAULT 0,
      smtp_username TEXT,
      smtp_password TEXT,
      from_email TEXT NOT NULL,
      from_name TEXT NOT NULL DEFAULT 'CMMS',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Root Cause Analysis table - stores RCA investigations
  db.exec(`
    CREATE TABLE IF NOT EXISTS root_cause_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      work_order_id INTEGER,
      asset_id INTEGER,
      trip_feedback_id INTEGER,
      analysis_method TEXT NOT NULL CHECK(analysis_method IN ('fishbone', 'five_whys', 'pareto', 'fault_tree', 'fmea', 'combined')),
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      status TEXT NOT NULL DEFAULT 'initiated' CHECK(status IN ('initiated', 'investigating', 'analysis_complete', 'actions_defined', 'approved', 'closed')),
      incident_date DATETIME,
      initiated_by INTEGER NOT NULL,
      assigned_to INTEGER,
      specialist_type TEXT CHECK(specialist_type IN ('electrical', 'mechanical', 'both', NULL)),
      immediate_cause TEXT,
      root_cause TEXT,
      contributing_factors TEXT,
      estimated_cost_impact REAL,
      actual_cost_impact REAL,
      recurrence_risk TEXT CHECK(recurrence_risk IN ('low', 'medium', 'high', 'very_high')),
      approved_by INTEGER,
      approved_at DATETIME,
      closed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (trip_feedback_id) REFERENCES trip_feedback(id) ON DELETE SET NULL,
      FOREIGN KEY (initiated_by) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);

  // RCA Fishbone Data table - stores cause categories for Fishbone/Ishikawa diagrams
  db.exec(`
    CREATE TABLE IF NOT EXISTS rca_fishbone_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rca_id INTEGER NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('man', 'machine', 'method', 'material', 'measurement', 'environment')),
      cause TEXT NOT NULL,
      sub_causes TEXT,
      severity INTEGER DEFAULT 1 CHECK(severity BETWEEN 1 AND 5),
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rca_id) REFERENCES root_cause_analysis(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // RCA 5 Whys table - stores iterative why questions and answers
  db.exec(`
    CREATE TABLE IF NOT EXISTS rca_five_whys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rca_id INTEGER NOT NULL,
      why_level INTEGER NOT NULL CHECK(why_level BETWEEN 1 AND 10),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      is_root_cause BOOLEAN DEFAULT 0,
      evidence TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rca_id) REFERENCES root_cause_analysis(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // RCA Recommended Actions table - stores corrective and preventive actions
  db.exec(`
    CREATE TABLE IF NOT EXISTS rca_recommended_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rca_id INTEGER NOT NULL,
      action_type TEXT NOT NULL CHECK(action_type IN ('immediate', 'corrective', 'preventive', 'monitoring')),
      description TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      assigned_to INTEGER,
      due_date DATE,
      estimated_cost REAL,
      actual_cost REAL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled', 'deferred')),
      completion_notes TEXT,
      completed_by INTEGER,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rca_id) REFERENCES root_cause_analysis(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (completed_by) REFERENCES users(id)
    )
  `);

  // RCA Timeline table - stores investigation milestones and events
  db.exec(`
    CREATE TABLE IF NOT EXISTS rca_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rca_id INTEGER NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('created', 'assigned', 'finding_added', 'cause_identified', 'action_proposed', 'status_changed', 'approved', 'closed', 'comment')),
      event_title TEXT NOT NULL,
      event_description TEXT,
      event_data TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rca_id) REFERENCES root_cause_analysis(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Failure Patterns table - tracks recurring failure modes across assets
  db.exec(`
    CREATE TABLE IF NOT EXISTS failure_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_name TEXT NOT NULL,
      description TEXT,
      failure_mode TEXT NOT NULL,
      affected_asset_type TEXT,
      occurrence_count INTEGER DEFAULT 1,
      total_downtime_hours REAL DEFAULT 0,
      total_cost_impact REAL DEFAULT 0,
      common_root_causes TEXT,
      recommended_prevention TEXT,
      last_occurrence DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Failure Pattern RCA Link table - links RCAs to failure patterns
  db.exec(`
    CREATE TABLE IF NOT EXISTS failure_pattern_rca_link (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      failure_pattern_id INTEGER NOT NULL,
      rca_id INTEGER NOT NULL,
      contribution_score INTEGER DEFAULT 1 CHECK(contribution_score BETWEEN 1 AND 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (failure_pattern_id) REFERENCES failure_patterns(id) ON DELETE CASCADE,
      FOREIGN KEY (rca_id) REFERENCES root_cause_analysis(id) ON DELETE CASCADE,
      UNIQUE(failure_pattern_id, rca_id)
    )
  `);

  // Attachments table - stores file uploads (photos, PDFs, documents)
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER,
      asset_id INTEGER,
      inventory_item_id INTEGER,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('work_order', 'asset', 'inventory', 'rca')),
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      mime_type TEXT,
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Create indexes for faster queries
  db.exec(`CREATE INDEX IF NOT EXISTS idx_asset_status_log_asset_time ON asset_status_log(asset_id, timestamp DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_opc_tags_asset ON opc_tags(asset_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_opc_tags_connection ON opc_tags(opc_connection_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_s7_tags_asset ON s7_tags(asset_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_s7_tags_connection ON s7_tags(s7_connection_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(log_level, timestamp DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_asset ON documents(asset_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_inventory ON documents(inventory_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_trip_feedback_asset ON trip_feedback(asset_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_trip_feedback_status ON trip_feedback(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_trip_feedback_created ON trip_feedback(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notification_logs_event ON notification_logs(event, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_work_order ON attachments(work_order_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_asset ON attachments(asset_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_inventory ON attachments(inventory_item_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rca_asset ON root_cause_analysis(asset_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rca_work_order ON root_cause_analysis(work_order_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rca_status ON root_cause_analysis(status, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rca_assigned ON root_cause_analysis(assigned_to)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rca_fishbone_rca ON rca_fishbone_data(rca_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rca_five_whys_rca ON rca_five_whys(rca_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rca_actions_rca ON rca_recommended_actions(rca_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rca_actions_assigned ON rca_recommended_actions(assigned_to, status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rca_timeline_rca ON rca_timeline(rca_id, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_failure_patterns_mode ON failure_patterns(failure_mode)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_failure_pattern_link_pattern ON failure_pattern_rca_link(failure_pattern_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_failure_pattern_link_rca ON failure_pattern_rca_link(rca_id)`);

  // Migration: Add name column to opc_connections if it doesn't exist (for migration from old schema)
  const opcConnColumns = db.prepare("PRAGMA table_info(opc_connections)").all() as any[];
  const hasOpcName = opcConnColumns.some((col: any) => col.name === 'name');
  const hasAssetId = opcConnColumns.some((col: any) => col.name === 'asset_id');

  if (hasAssetId && !hasOpcName) {
    // Old schema detected - need to migrate
    console.log('Migrating OPC schema from asset-based to PLC-based...');

    // Drop old tables and recreate with new schema
    db.exec(`DROP TABLE IF EXISTS opc_tags`);
    db.exec(`DROP TABLE IF EXISTS opc_connections`);

    // Recreate with new schema
    db.exec(`
      CREATE TABLE opc_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        plc_type TEXT NOT NULL CHECK(plc_type IN ('siemens', 'allen_bradley', 'schneider', 'mitsubishi', 'generic_opcua')),
        server_url TEXT NOT NULL UNIQUE,
        enabled BOOLEAN DEFAULT 1,
        polling_interval INTEGER DEFAULT 5000,
        connection_timeout INTEGER DEFAULT 10000,
        username TEXT,
        password TEXT,
        notes TEXT,
        last_connected DATETIME,
        connection_status TEXT DEFAULT 'disconnected' CHECK(connection_status IN ('connected', 'disconnected', 'error')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE opc_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opc_connection_id INTEGER NOT NULL,
        asset_id INTEGER NOT NULL,
        tag_type TEXT NOT NULL CHECK(tag_type IN ('running', 'trip', 'off', 'custom')),
        tag_name TEXT NOT NULL,
        tag_address TEXT NOT NULL,
        data_type TEXT DEFAULT 'boolean' CHECK(data_type IN ('boolean', 'integer', 'float', 'string')),
        invert_logic BOOLEAN DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (opc_connection_id) REFERENCES opc_connections(id) ON DELETE CASCADE,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
        UNIQUE(opc_connection_id, asset_id, tag_type)
      )
    `);

    console.log('OPC schema migration completed!');
  }

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

  // Migration: Add updated_at column to s7_connections and s7_tags if they don't exist
  // Check if s7_connections table exists first
  const s7ConnTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='s7_connections'").get();
  if (s7ConnTableExists) {
    const s7ConnColumns = db.prepare("PRAGMA table_info(s7_connections)").all() as any[];
    const hasS7ConnUpdatedAt = s7ConnColumns.some((col: any) => col.name === 'updated_at');

    if (!hasS7ConnUpdatedAt) {
      db.exec(`ALTER TABLE s7_connections ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
      console.log('Added updated_at column to s7_connections table');
    }
  }

  // Check if s7_tags table exists first
  const s7TagsTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='s7_tags'").get();
  if (s7TagsTableExists) {
    const s7TagsColumns = db.prepare("PRAGMA table_info(s7_tags)").all() as any[];
    const hasS7TagsUpdatedAt = s7TagsColumns.some((col: any) => col.name === 'updated_at');

    if (!hasS7TagsUpdatedAt) {
      db.exec(`ALTER TABLE s7_tags ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
      console.log('Added updated_at column to s7_tags table');
    }
  }

  // Migration: Add reminder tracking columns to preventive_maintenance table
  const pmColumns = db.prepare("PRAGMA table_info(preventive_maintenance)").all() as any[];
  const hasLast7DayReminder = pmColumns.some((col: any) => col.name === 'last_7day_reminder_sent');
  const hasLast1DayReminder = pmColumns.some((col: any) => col.name === 'last_1day_reminder_sent');

  if (!hasLast7DayReminder) {
    db.exec(`ALTER TABLE preventive_maintenance ADD COLUMN last_7day_reminder_sent DATETIME`);
    console.log('Added last_7day_reminder_sent column to preventive_maintenance table');
  }

  if (!hasLast1DayReminder) {
    db.exec(`ALTER TABLE preventive_maintenance ADD COLUMN last_1day_reminder_sent DATETIME`);
    console.log('Added last_1day_reminder_sent column to preventive_maintenance table');
  }

  // Migration: Add rca_id column to attachments table if it doesn't exist
  const attachmentsColumns = db.prepare("PRAGMA table_info(attachments)").all() as any[];
  const hasRcaId = attachmentsColumns.some((col: any) => col.name === 'rca_id');

  if (!hasRcaId) {
    db.exec(`ALTER TABLE attachments ADD COLUMN rca_id INTEGER REFERENCES root_cause_analysis(id) ON DELETE CASCADE`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_rca ON attachments(rca_id)`);
    console.log('Added rca_id column to attachments table');
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

  // Initialize default system settings if table is empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM system_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const defaultSettings = [
      { key: 'company_name', value: 'CMMS', type: 'string', description: 'Company or organization name' },
      { key: 'company_logo', value: null, type: 'string', description: 'Path to company logo file' },
      { key: 'system_timezone', value: 'UTC', type: 'string', description: 'System timezone' },
      { key: 'maintenance_mode', value: 'false', type: 'boolean', description: 'System maintenance mode' },
      { key: 'max_upload_size', value: '5242880', type: 'number', description: 'Maximum upload size in bytes (5MB)' },
      { key: 'ui_theme', value: 'industrial-pro', type: 'string', description: 'Application-wide UI theme' },
      { key: 'animations_enabled', value: 'true', type: 'boolean', description: 'Enable UI animations and transitions' },
    ];

    const insertSetting = db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
      VALUES (?, ?, ?, ?)
    `);

    for (const setting of defaultSettings) {
      insertSetting.run(setting.key, setting.value, setting.type, setting.description);
    }
    console.log('Default system settings initialized');
  }

  // Migration: Add ui_theme and animations_enabled settings if they don't exist
  const uiThemeSetting = db.prepare('SELECT * FROM system_settings WHERE setting_key = ?').get('ui_theme');
  if (!uiThemeSetting) {
    db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
      VALUES (?, ?, ?, ?)
    `).run('ui_theme', 'industrial-pro', 'string', 'Application-wide UI theme');
    console.log('Added ui_theme system setting');
  }

  const animationsSetting = db.prepare('SELECT * FROM system_settings WHERE setting_key = ?').get('animations_enabled');
  if (!animationsSetting) {
    db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
      VALUES (?, ?, ?, ?)
    `).run('animations_enabled', 'true', 'boolean', 'Enable UI animations and transitions');
    console.log('Added animations_enabled system setting');
  }

  console.log('Database initialized successfully');
};

export default db;
