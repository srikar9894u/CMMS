import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { logError, logWarning, logInfo } from '../utils/logger';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all S7 connections (PLCs)
router.get('/connections', (req: AuthRequest, res: Response) => {
  try {
    const connections = db.prepare(`
      SELECT
        sc.*,
        COUNT(DISTINCT st.asset_id) as connected_assets
      FROM s7_connections sc
      LEFT JOIN s7_tags st ON sc.id = st.s7_connection_id
      GROUP BY sc.id
      ORDER BY sc.name
    `).all();

    res.json(connections);
  } catch (error: any) {
    logError('s7.routes', 'Error fetching S7 connections', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch S7 connections' });
  }
});

// Get single S7 connection by ID
router.get('/connections/:id', (req: AuthRequest, res: Response) => {
  try {
    const connection = db.prepare('SELECT * FROM s7_connections WHERE id = ?').get(req.params.id);

    if (!connection) {
      return res.status(404).json({ error: 'S7 connection not found' });
    }

    res.json(connection);
  } catch (error: any) {
    logError('s7.routes', 'Error fetching S7 connection', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch S7 connection' });
  }
});

// Create new S7 connection (PLC)
router.post('/connections', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      plc_type,
      ip_address,
      rack,
      slot,
      enabled,
      polling_interval,
      connection_timeout,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !plc_type || !ip_address) {
      return res.status(400).json({ error: 'Name, PLC type, and IP address are required' });
    }

    // Validate rack and slot
    if (rack === undefined || slot === undefined) {
      return res.status(400).json({ error: 'Rack and slot are required' });
    }

    // Check if IP address already exists
    const existing = db.prepare('SELECT id FROM s7_connections WHERE ip_address = ?').get(ip_address);
    if (existing) {
      return res.status(400).json({ error: 'A PLC with this IP address already exists' });
    }

    // Insert new connection
    const result = db.prepare(`
      INSERT INTO s7_connections
      (name, plc_type, ip_address, rack, slot, enabled, polling_interval,
       connection_timeout, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      name,
      plc_type,
      ip_address,
      rack,
      slot,
      enabled !== undefined ? enabled : 1,
      polling_interval || 5000,
      connection_timeout || 10000,
      notes || null
    );

    const newConnection = db.prepare('SELECT * FROM s7_connections WHERE id = ?').get(result.lastInsertRowid);
    logInfo('s7.routes', `S7 connection created: ${name}`, { connection_id: result.lastInsertRowid }, req.user?.id, req.ip);
    res.status(201).json(newConnection);
  } catch (error: any) {
    logError('s7.routes', 'Error creating S7 connection', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to create S7 connection' });
  }
});

// Update S7 connection
router.put('/connections/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      plc_type,
      ip_address,
      rack,
      slot,
      enabled,
      polling_interval,
      connection_timeout,
      notes
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (plc_type !== undefined) {
      updates.push('plc_type = ?');
      values.push(plc_type);
    }
    if (ip_address !== undefined) {
      updates.push('ip_address = ?');
      values.push(ip_address);
    }
    if (rack !== undefined) {
      updates.push('rack = ?');
      values.push(rack);
    }
    if (slot !== undefined) {
      updates.push('slot = ?');
      values.push(slot);
    }
    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(enabled);
    }
    if (polling_interval !== undefined) {
      updates.push('polling_interval = ?');
      values.push(polling_interval);
    }
    if (connection_timeout !== undefined) {
      updates.push('connection_timeout = ?');
      values.push(connection_timeout);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(`UPDATE s7_connections SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM s7_connections WHERE id = ?').get(req.params.id);
    logInfo('s7.routes', `S7 connection updated: ID ${req.params.id}`, { connection_id: req.params.id }, req.user?.id, req.ip);
    res.json(updated);
  } catch (error: any) {
    logError('s7.routes', 'Error updating S7 connection', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to update S7 connection' });
  }
});

// Delete S7 connection
router.delete('/connections/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM s7_connections WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'S7 connection not found' });
    }

    logInfo('s7.routes', `S7 connection deleted: ID ${req.params.id}`, { connection_id: req.params.id }, req.user?.id, req.ip);
    res.json({ message: 'S7 connection deleted successfully' });
  } catch (error: any) {
    logError('s7.routes', 'Error deleting S7 connection', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to delete S7 connection' });
  }
});

// Get all S7 tags (for tags management view)
router.get('/tags', (req: AuthRequest, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT
        st.*,
        a.name as asset_name,
        a.asset_tag,
        sc.name as connection_name,
        sc.plc_type,
        sc.ip_address,
        sc.rack,
        sc.slot
      FROM s7_tags st
      JOIN assets a ON st.asset_id = a.id
      JOIN s7_connections sc ON st.s7_connection_id = sc.id
      ORDER BY sc.name, a.name, st.tag_type
    `).all();

    res.json(tags);
  } catch (error: any) {
    logError('s7.routes', 'Error fetching all S7 tags', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch S7 tags' });
  }
});

// Get all tags for a connection
router.get('/connections/:id/tags', (req: AuthRequest, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT
        st.*,
        a.name as asset_name,
        a.asset_tag
      FROM s7_tags st
      JOIN assets a ON st.asset_id = a.id
      WHERE st.s7_connection_id = ?
      ORDER BY a.name, st.tag_type
    `).all(req.params.id);

    res.json(tags);
  } catch (error: any) {
    logError('s7.routes', 'Error fetching S7 tags', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch S7 tags' });
  }
});

// Get tags for a specific asset
router.get('/assets/:assetId/tags', (req: AuthRequest, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT
        st.*,
        sc.name as connection_name,
        sc.plc_type,
        sc.ip_address,
        sc.rack,
        sc.slot
      FROM s7_tags st
      JOIN s7_connections sc ON st.s7_connection_id = sc.id
      WHERE st.asset_id = ?
      ORDER BY st.tag_type
    `).all(req.params.assetId);

    res.json(tags);
  } catch (error: any) {
    logError('s7.routes', 'Error fetching asset S7 tags', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch asset S7 tags' });
  }
});

// Create new tag (links a PLC tag to an asset)
router.post('/tags', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const {
      s7_connection_id,
      asset_id,
      tag_type,
      tag_name,
      tag_address,
      data_type,
      invert_logic,
      description
    } = req.body;

    // Log incoming request for debugging
    logInfo('s7.routes', 'Creating S7 tag', {
      s7_connection_id,
      asset_id,
      tag_type,
      tag_name,
      tag_address,
      data_type,
      invert_logic
    }, req.user?.id, req.ip);

    if (!s7_connection_id || !asset_id || !tag_type || !tag_name || !tag_address) {
      return res.status(400).json({ error: 'Connection, asset, tag type, name, and address are required' });
    }

    // Validate tag_address is not just whitespace
    if (typeof tag_address === 'string' && tag_address.trim() === '') {
      return res.status(400).json({ error: 'Tag address cannot be empty' });
    }

    // Verify connection exists
    const connection = db.prepare('SELECT id FROM s7_connections WHERE id = ?').get(s7_connection_id);
    if (!connection) {
      return res.status(404).json({ error: 'S7 connection not found' });
    }

    // Verify asset exists
    const asset = db.prepare('SELECT id FROM assets WHERE id = ?').get(asset_id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const result = db.prepare(`
      INSERT INTO s7_tags
      (s7_connection_id, asset_id, tag_type, tag_name, tag_address, data_type, invert_logic, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      s7_connection_id,
      asset_id,
      tag_type,
      tag_name,
      tag_address,
      data_type || 'boolean',
      invert_logic ? 1 : 0,  // Properly convert boolean to integer
      description || null
    );

    const newTag = db.prepare(`
      SELECT
        st.*,
        a.name as asset_name,
        a.asset_tag
      FROM s7_tags st
      JOIN assets a ON st.asset_id = a.id
      WHERE st.id = ?
    `).get(result.lastInsertRowid);

    logInfo('s7.routes', `S7 tag created for asset ${asset_id}`, { tag_id: result.lastInsertRowid, asset_id: asset_id, tag_type: tag_type }, req.user?.id, req.ip);
    res.status(201).json(newTag);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      logWarning('s7.routes', 'Duplicate S7 tag attempt', { asset_id: req.body.asset_id, tag_type: req.body.tag_type }, req.user?.id, req.ip);
      return res.status(400).json({ error: 'This tag type already exists for this asset on this PLC' });
    }
    if (error.message.includes('CHECK constraint failed')) {
      logWarning('s7.routes', 'Invalid S7 tag type', { tag_type: req.body.tag_type }, req.user?.id, req.ip);
      return res.status(400).json({ error: 'Invalid tag type. Must be: running, trip, off, or custom' });
    }
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      logWarning('s7.routes', 'Invalid S7 connection or asset ID', { s7_connection_id: req.body.s7_connection_id, asset_id: req.body.asset_id }, req.user?.id, req.ip);
      return res.status(400).json({ error: 'Invalid connection or asset ID' });
    }
    logError('s7.routes', 'Error creating S7 tag', error, req.user?.id, req.ip);
    res.status(500).json({
      error: 'Failed to create S7 tag',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update tag
router.put('/tags/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const { tag_type, tag_name, tag_address, data_type, invert_logic, description } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (tag_type !== undefined) {
      updates.push('tag_type = ?');
      values.push(tag_type);
    }
    if (tag_name !== undefined) {
      updates.push('tag_name = ?');
      values.push(tag_name);
    }
    if (tag_address !== undefined) {
      updates.push('tag_address = ?');
      values.push(tag_address);
    }
    if (data_type !== undefined) {
      updates.push('data_type = ?');
      values.push(data_type);
    }
    if (invert_logic !== undefined) {
      updates.push('invert_logic = ?');
      values.push(invert_logic);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    values.push(req.params.id);

    const result = db.prepare(`UPDATE s7_tags SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const updated = db.prepare(`
      SELECT
        st.*,
        a.name as asset_name,
        a.asset_tag
      FROM s7_tags st
      JOIN assets a ON st.asset_id = a.id
      WHERE st.id = ?
    `).get(req.params.id);

    logInfo('s7.routes', `S7 tag updated: ID ${req.params.id}`, { tag_id: req.params.id }, req.user?.id, req.ip);
    res.json(updated);
  } catch (error: any) {
    logError('s7.routes', 'Error updating S7 tag', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to update S7 tag' });
  }
});

// Delete tag
router.delete('/tags/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM s7_tags WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    logInfo('s7.routes', `S7 tag deleted: ID ${req.params.id}`, { tag_id: req.params.id }, req.user?.id, req.ip);
    res.json({ message: 'Tag deleted successfully' });
  } catch (error: any) {
    logError('s7.routes', 'Error deleting S7 tag', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to delete S7 tag' });
  }
});

// Get asset status history
router.get('/assets/:id/status-history', (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, hours = 24 } = req.query;

    const history = db.prepare(`
      SELECT *
      FROM asset_status_log
      WHERE asset_id = ?
        AND timestamp >= datetime('now', '-' || ? || ' hours')
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(req.params.id, hours, limit);

    res.json(history);
  } catch (error: any) {
    logError('s7.routes', 'Error fetching status history', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch status history' });
  }
});

// Get current status for all S7-enabled assets
router.get('/status/current', (req: AuthRequest, res: Response) => {
  try {
    const statuses = db.prepare(`
      SELECT DISTINCT
        a.id,
        a.name,
        a.asset_tag,
        a.category,
        a.real_time_status,
        a.last_opc_update,
        sc.name as connection_name,
        sc.connection_status,
        sc.plc_type
      FROM assets a
      JOIN s7_tags st ON a.id = st.asset_id
      JOIN s7_connections sc ON st.s7_connection_id = sc.id
      WHERE sc.enabled = 1
      GROUP BY a.id
      ORDER BY a.name
    `).all();

    res.json(statuses);
  } catch (error: any) {
    logError('s7.routes', 'Error fetching current S7 statuses', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch current S7 statuses' });
  }
});

export default router;
