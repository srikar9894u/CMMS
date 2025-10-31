import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { logError, logWarning, logInfo } from '../utils/logger';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all OPC connections (PLCs)
router.get('/connections', (req: AuthRequest, res: Response) => {
  try {
    const connections = db.prepare(`
      SELECT
        oc.*,
        COUNT(DISTINCT ot.asset_id) as connected_assets
      FROM opc_connections oc
      LEFT JOIN opc_tags ot ON oc.id = ot.opc_connection_id
      GROUP BY oc.id
      ORDER BY oc.name
    `).all();

    res.json(connections);
  } catch (error: any) {
    logError('opc.routes', 'Error fetching OPC connections', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch OPC connections' });
  }
});

// Get single OPC connection by ID
router.get('/connections/:id', (req: AuthRequest, res: Response) => {
  try {
    const connection = db.prepare('SELECT * FROM opc_connections WHERE id = ?').get(req.params.id);

    if (!connection) {
      return res.status(404).json({ error: 'OPC connection not found' });
    }

    res.json(connection);
  } catch (error: any) {
    logError('opc.routes', 'Error fetching OPC connection', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch OPC connection' });
  }
});

// Create new OPC connection (PLC)
router.post('/connections', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      plc_type,
      server_url,
      enabled,
      polling_interval,
      connection_timeout,
      username,
      password,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !plc_type || !server_url) {
      return res.status(400).json({ error: 'Name, PLC type, and server URL are required' });
    }

    // Check if server_url already exists
    const existing = db.prepare('SELECT id FROM opc_connections WHERE server_url = ?').get(server_url);
    if (existing) {
      return res.status(400).json({ error: 'A PLC with this server URL already exists' });
    }

    // Insert new connection
    const result = db.prepare(`
      INSERT INTO opc_connections
      (name, plc_type, server_url, enabled, polling_interval, connection_timeout,
       username, password, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      name,
      plc_type,
      server_url,
      enabled !== undefined ? enabled : 1,
      polling_interval || 5000,
      connection_timeout || 10000,
      username || null,
      password || null,
      notes || null
    );

    const newConnection = db.prepare('SELECT * FROM opc_connections WHERE id = ?').get(result.lastInsertRowid);
    logInfo('opc.routes', `OPC connection created: ${name}`, { connection_id: result.lastInsertRowid }, req.user?.id, req.ip);
    res.status(201).json(newConnection);
  } catch (error: any) {
    logError('opc.routes', 'Error creating OPC connection', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to create OPC connection' });
  }
});

// Update OPC connection
router.put('/connections/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      plc_type,
      server_url,
      enabled,
      polling_interval,
      connection_timeout,
      username,
      password,
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
    if (server_url !== undefined) {
      updates.push('server_url = ?');
      values.push(server_url);
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
    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username || null);
    }
    if (password !== undefined) {
      updates.push('password = ?');
      values.push(password || null);
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

    db.prepare(`UPDATE opc_connections SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM opc_connections WHERE id = ?').get(req.params.id);
    logInfo('opc.routes', `OPC connection updated: ID ${req.params.id}`, { connection_id: req.params.id }, req.user?.id, req.ip);
    res.json(updated);
  } catch (error: any) {
    logError('opc.routes', 'Error updating OPC connection', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to update OPC connection' });
  }
});

// Delete OPC connection
router.delete('/connections/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM opc_connections WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'OPC connection not found' });
    }

    logInfo('opc.routes', `OPC connection deleted: ID ${req.params.id}`, { connection_id: req.params.id }, req.user?.id, req.ip);
    res.json({ message: 'OPC connection deleted successfully' });
  } catch (error: any) {
    logError('opc.routes', 'Error deleting OPC connection', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to delete OPC connection' });
  }
});

// Get all OPC tags (for tags management view)
router.get('/tags', (req: AuthRequest, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT
        ot.*,
        a.name as asset_name,
        a.asset_tag,
        oc.name as connection_name,
        oc.plc_type,
        oc.server_url
      FROM opc_tags ot
      JOIN assets a ON ot.asset_id = a.id
      JOIN opc_connections oc ON ot.opc_connection_id = oc.id
      ORDER BY oc.name, a.name, ot.tag_type
    `).all();

    res.json(tags);
  } catch (error: any) {
    logError('opc.routes', 'Error fetching all OPC tags', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch OPC tags' });
  }
});

// Get all tags for a connection
router.get('/connections/:id/tags', (req: AuthRequest, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT
        ot.*,
        a.name as asset_name,
        a.asset_tag
      FROM opc_tags ot
      JOIN assets a ON ot.asset_id = a.id
      WHERE ot.opc_connection_id = ?
      ORDER BY a.name, ot.tag_type
    `).all(req.params.id);

    res.json(tags);
  } catch (error: any) {
    logError('opc.routes', 'Error fetching OPC tags', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch OPC tags' });
  }
});

// Get tags for a specific asset
router.get('/assets/:assetId/tags', (req: AuthRequest, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT
        ot.*,
        oc.name as connection_name,
        oc.plc_type,
        oc.server_url
      FROM opc_tags ot
      JOIN opc_connections oc ON ot.opc_connection_id = oc.id
      WHERE ot.asset_id = ?
      ORDER BY ot.tag_type
    `).all(req.params.assetId);

    res.json(tags);
  } catch (error: any) {
    logError('opc.routes', 'Error fetching asset tags', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch asset tags' });
  }
});

// Create new tag (links a PLC tag to an asset)
router.post('/tags', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const {
      opc_connection_id,
      asset_id,
      tag_type,
      tag_name,
      tag_address,
      data_type,
      invert_logic,
      description
    } = req.body;

    if (!opc_connection_id || !asset_id || !tag_type || !tag_name || !tag_address) {
      return res.status(400).json({ error: 'Connection, asset, tag type, name, and address are required' });
    }

    // Verify connection exists
    const connection = db.prepare('SELECT id FROM opc_connections WHERE id = ?').get(opc_connection_id);
    if (!connection) {
      return res.status(404).json({ error: 'OPC connection not found' });
    }

    // Verify asset exists
    const asset = db.prepare('SELECT id FROM assets WHERE id = ?').get(asset_id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const result = db.prepare(`
      INSERT INTO opc_tags
      (opc_connection_id, asset_id, tag_type, tag_name, tag_address, data_type, invert_logic, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      opc_connection_id,
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
        ot.*,
        a.name as asset_name,
        a.asset_tag
      FROM opc_tags ot
      JOIN assets a ON ot.asset_id = a.id
      WHERE ot.id = ?
    `).get(result.lastInsertRowid);

    logInfo('opc.routes', `OPC tag created for asset ${asset_id}`, { tag_id: result.lastInsertRowid, asset_id: asset_id, tag_type: tag_type }, req.user?.id, req.ip);
    res.status(201).json(newTag);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      logWarning('opc.routes', 'Duplicate OPC tag attempt', { asset_id: req.body.asset_id, tag_type: req.body.tag_type }, req.user?.id, req.ip);
      return res.status(400).json({ error: 'This tag type already exists for this asset on this PLC' });
    }
    logError('opc.routes', 'Error creating OPC tag', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to create OPC tag' });
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

    const result = db.prepare(`UPDATE opc_tags SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const updated = db.prepare(`
      SELECT
        ot.*,
        a.name as asset_name,
        a.asset_tag
      FROM opc_tags ot
      JOIN assets a ON ot.asset_id = a.id
      WHERE ot.id = ?
    `).get(req.params.id);

    logInfo('opc.routes', `OPC tag updated: ID ${req.params.id}`, { tag_id: req.params.id }, req.user?.id, req.ip);
    res.json(updated);
  } catch (error: any) {
    logError('opc.routes', 'Error updating OPC tag', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to update OPC tag' });
  }
});

// Delete tag
router.delete('/tags/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM opc_tags WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    logInfo('opc.routes', `OPC tag deleted: ID ${req.params.id}`, { tag_id: req.params.id }, req.user?.id, req.ip);
    res.json({ message: 'Tag deleted successfully' });
  } catch (error: any) {
    logError('opc.routes', 'Error deleting tag', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to delete tag' });
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
    logError('opc.routes', 'Error fetching status history', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch status history' });
  }
});

// Get current status for all OPC-enabled assets
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
        oc.name as connection_name,
        oc.connection_status,
        oc.plc_type
      FROM assets a
      JOIN opc_tags ot ON a.id = ot.asset_id
      JOIN opc_connections oc ON ot.opc_connection_id = oc.id
      WHERE oc.enabled = 1
      GROUP BY a.id
      ORDER BY a.name
    `).all();

    res.json(statuses);
  } catch (error: any) {
    logError('opc.routes', 'Error fetching current statuses', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch current statuses' });
  }
});

// Get all assets (for dropdowns)
router.get('/assets/all', (req: AuthRequest, res: Response) => {
  try {
    const assets = db.prepare(`
      SELECT id, name, asset_tag, category, location
      FROM assets
      ORDER BY name
    `).all();

    res.json(assets);
  } catch (error: any) {
    logError('opc.routes', 'Error fetching assets', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

export default router;
