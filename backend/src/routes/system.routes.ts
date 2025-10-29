import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import os from 'os';
import { execSync } from 'child_process';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ===== SYSTEM HEALTH ENDPOINTS =====

// Get comprehensive system health status
router.get('/health', (req: AuthRequest, res: Response) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        backend: {
          status: 'running',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        },
        database: {
          status: 'connected',
          path: process.env.DB_PATH || 'database.sqlite'
        },
        opc_service: {
          status: 'unknown',
          connections: 0
        },
        s7_service: {
          status: 'unknown',
          connections: 0
        }
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      }
    };

    // Check OPC connections
    try {
      const opcConns = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN connection_status = 'connected' THEN 1 ELSE 0 END) as connected
        FROM opc_connections WHERE enabled = 1
      `).get() as any;

      health.services.opc_service.connections = opcConns.connected || 0;
      health.services.opc_service.status = opcConns.total > 0
        ? (opcConns.connected > 0 ? 'running' : 'degraded')
        : 'no_connections';
    } catch (error) {
      health.services.opc_service.status = 'error';
    }

    // Check S7 connections
    try {
      const s7Conns = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN connection_status = 'connected' THEN 1 ELSE 0 END) as connected
        FROM s7_connections WHERE enabled = 1
      `).get() as any;

      health.services.s7_service.connections = s7Conns.connected || 0;
      health.services.s7_service.status = s7Conns.total > 0
        ? (s7Conns.connected > 0 ? 'running' : 'degraded')
        : 'no_connections';
    } catch (error) {
      health.services.s7_service.status = 'error';
    }

    // Check if any service is unhealthy
    const allServicesHealthy = Object.values(health.services).every(
      (service: any) => service.status === 'running' || service.status === 'connected' || service.status === 'no_connections'
    );
    health.status = allServicesHealthy ? 'healthy' : 'degraded';

    res.json(health);
  } catch (error: any) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// Get Docker container status (admin only)
router.get('/health/docker', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    // Try to get Docker container status
    let containerStatus = [];
    try {
      const output = execSync('docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}"', { encoding: 'utf-8' });
      containerStatus = output.trim().split('\n').map(line => {
        const [name, status, ports] = line.split('|');
        return { name, status, ports };
      });
    } catch (error) {
      // Docker not available or not accessible
      return res.json({
        available: false,
        message: 'Docker not accessible from backend container'
      });
    }

    res.json({
      available: true,
      containers: containerStatus
    });
  } catch (error: any) {
    console.error('Error fetching Docker status:', error);
    res.status(500).json({ error: 'Failed to fetch Docker status' });
  }
});

// ===== APPLICATION LOGS ENDPOINTS (Admin only) =====

// Get application logs with filtering
router.get('/logs', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    const { level, source, limit = 100, offset = 0, hours = 24 } = req.query;

    let query = `
      SELECT l.*, u.username, u.full_name
      FROM application_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.timestamp >= datetime('now', '-' || ? || ' hours')
    `;
    const params: any[] = [hours];

    if (level) {
      query += ` AND l.log_level = ?`;
      params.push(level);
    }

    if (source) {
      query += ` AND l.source LIKE ?`;
      params.push(`%${source}%`);
    }

    query += ` ORDER BY l.timestamp DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM application_logs
      WHERE timestamp >= datetime('now', '-' || ? || ' hours')
    `;
    const countParams: any[] = [hours];

    if (level) {
      countQuery += ` AND log_level = ?`;
      countParams.push(level);
    }

    if (source) {
      countQuery += ` AND source LIKE ?`;
      countParams.push(`%${source}%`);
    }

    const { total } = db.prepare(countQuery).get(...countParams) as any;

    res.json({
      logs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total
      }
    });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Create a log entry
router.post('/logs', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { log_level, source, message, details } = req.body;

    if (!log_level || !source || !message) {
      return res.status(400).json({ error: 'Log level, source, and message are required' });
    }

    const result = db.prepare(`
      INSERT INTO application_logs (log_level, source, message, details, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      log_level,
      source,
      message,
      details || null,
      req.user?.id || null,
      req.ip || null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Log entry created' });
  } catch (error: any) {
    console.error('Error creating log entry:', error);
    res.status(500).json({ error: 'Failed to create log entry' });
  }
});

// Get log statistics (admin only)
router.get('/logs/stats', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    const { hours = 24 } = req.query;

    const stats = db.prepare(`
      SELECT
        log_level,
        COUNT(*) as count,
        MAX(timestamp) as last_occurrence
      FROM application_logs
      WHERE timestamp >= datetime('now', '-' || ? || ' hours')
      GROUP BY log_level
      ORDER BY
        CASE log_level
          WHEN 'ERROR' THEN 1
          WHEN 'WARN' THEN 2
          WHEN 'INFO' THEN 3
          WHEN 'DEBUG' THEN 4
        END
    `).all(hours);

    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching log stats:', error);
    res.status(500).json({ error: 'Failed to fetch log statistics' });
  }
});

// ===== SYSTEM SETTINGS ENDPOINTS =====

// Get all system settings (admin and manager)
router.get('/settings', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings ORDER BY setting_key').all();
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

// Get single setting by key (public settings accessible to all authenticated users)
router.get('/settings/:key', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const publicSettings = ['company_name', 'company_logo', 'system_timezone'];
    const { key } = req.params;

    // Check if user is admin/manager OR requesting public setting
    if (!['admin', 'manager'].includes(req.user?.role || '') && !publicSettings.includes(key)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const setting = db.prepare('SELECT * FROM system_settings WHERE setting_key = ?').get(key);

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error: any) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update system setting (admin only)
router.put('/settings/:key', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { setting_value } = req.body;

    const result = db.prepare(`
      UPDATE system_settings
      SET setting_value = ?, updated_at = datetime('now'), updated_by = ?
      WHERE setting_key = ?
    `).run(setting_value, req.user?.id, key);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const updated = db.prepare('SELECT * FROM system_settings WHERE setting_key = ?').get(key);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Create new system setting (admin only)
router.post('/settings', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    const { setting_key, setting_value, setting_type, description } = req.body;

    if (!setting_key) {
      return res.status(400).json({ error: 'Setting key is required' });
    }

    const result = db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      setting_key,
      setting_value || null,
      setting_type || 'string',
      description || null,
      req.user?.id
    );

    const newSetting = db.prepare('SELECT * FROM system_settings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newSetting);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Setting key already exists' });
    }
    console.error('Error creating setting:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

export default router;
