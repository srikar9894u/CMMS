import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { roleMiddleware } from '../middleware/role';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all OPC connections with asset details
router.get('/connections', (req: AuthRequest, res: Response) => {
  try {
    const connections = db.prepare(`
      SELECT
        oc.*,
        a.name as asset_name,
        a.asset_tag,
        a.category,
        a.real_time_status,
        a.last_opc_update
      FROM opc_connections oc
      JOIN assets a ON oc.asset_id = a.id
      ORDER BY a.name
    `).all();

    res.json(connections);
  } catch (error: any) {
    console.error('Error fetching OPC connections:', error);
    res.status(500).json({ error: 'Failed to fetch OPC connections' });
  }
});

// Get single OPC connection by ID
router.get('/connections/:id', (req: AuthRequest, res: Response) => {
  try {
    const connection = db.prepare(`
      SELECT
        oc.*,
        a.name as asset_name,
        a.asset_tag
      FROM opc_connections oc
      JOIN assets a ON oc.asset_id = a.id
      WHERE oc.id = ?
    `).get(req.params.id);

    if (!connection) {
      return res.status(404).json({ error: 'OPC connection not found' });
    }

    res.json(connection);
  } catch (error: any) {
    console.error('Error fetching OPC connection:', error);
    res.status(500).json({ error: 'Failed to fetch OPC connection' });
  }
});

// Create new OPC connection
router.post('/connections', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const {
      asset_id,
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
    if (!asset_id || !plc_type || !server_url) {
      return res.status(400).json({ error: 'Asset ID, PLC type, and server URL are required' });
    }

    // Check if asset already has an OPC connection
    const existing = db.prepare('SELECT id FROM opc_connections WHERE asset_id = ?').get(asset_id);
    if (existing) {
      return res.status(400).json({ error: 'This asset already has an OPC connection configured' });
    }

    // Insert new connection
    const result = db.prepare(`
      INSERT INTO opc_connections
      (asset_id, plc_type, server_url, enabled, polling_interval, connection_timeout,
       username, password, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      asset_id,
      plc_type,
      server_url,
      enabled !== undefined ? enabled : 1,
      polling_interval || 5000,
      connection_timeout || 10000,
      username || null,
      password || null,
      notes || null
    );

    const newConnection = db.prepare(`
      SELECT
        oc.*,
        a.name as asset_name,
        a.asset_tag
      FROM opc_connections oc
      JOIN assets a ON oc.asset_id = a.id
      WHERE oc.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newConnection);
  } catch (error: any) {
    console.error('Error creating OPC connection:', error);
    res.status(500).json({ error: 'Failed to create OPC connection' });
  }
});

// Update OPC connection
router.put('/connections/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const {
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

    const updated = db.prepare(`
      SELECT
        oc.*,
        a.name as asset_name,
        a.asset_tag
      FROM opc_connections oc
      JOIN assets a ON oc.asset_id = a.id
      WHERE oc.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating OPC connection:', error);
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

    res.json({ message: 'OPC connection deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting OPC connection:', error);
    res.status(500).json({ error: 'Failed to delete OPC connection' });
  }
});

// Get tags for a connection
router.get('/connections/:id/tags', (req: AuthRequest, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT * FROM opc_tags
      WHERE opc_connection_id = ?
      ORDER BY tag_type
    `).all(req.params.id);

    res.json(tags);
  } catch (error: any) {
    console.error('Error fetching OPC tags:', error);
    res.status(500).json({ error: 'Failed to fetch OPC tags' });
  }
});

// Create new tag
router.post('/connections/:id/tags', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const { tag_type, tag_name, tag_address, data_type, invert_logic, description } = req.body;
    const connection_id = req.params.id;

    if (!tag_type || !tag_name || !tag_address) {
      return res.status(400).json({ error: 'Tag type, name, and address are required' });
    }

    // Verify connection exists
    const connection = db.prepare('SELECT id FROM opc_connections WHERE id = ?').get(connection_id);
    if (!connection) {
      return res.status(404).json({ error: 'OPC connection not found' });
    }

    const result = db.prepare(`
      INSERT INTO opc_tags
      (opc_connection_id, tag_type, tag_name, tag_address, data_type, invert_logic, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      connection_id,
      tag_type,
      tag_name,
      tag_address,
      data_type || 'boolean',
      invert_logic || 0,
      description || null
    );

    const newTag = db.prepare('SELECT * FROM opc_tags WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTag);
  } catch (error: any) {
    console.error('Error creating OPC tag:', error);
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

    const updated = db.prepare('SELECT * FROM opc_tags WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating OPC tag:', error);
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

    res.json({ message: 'Tag deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting tag:', error);
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
    console.error('Error fetching status history:', error);
    res.status(500).json({ error: 'Failed to fetch status history' });
  }
});

// Get current status for all OPC-enabled assets
router.get('/status/current', (req: AuthRequest, res: Response) => {
  try {
    const statuses = db.prepare(`
      SELECT
        a.id,
        a.name,
        a.asset_tag,
        a.category,
        a.real_time_status,
        a.last_opc_update,
        oc.connection_status,
        oc.plc_type
      FROM assets a
      JOIN opc_connections oc ON a.id = oc.asset_id
      WHERE oc.enabled = 1
      ORDER BY a.name
    `).all();

    res.json(statuses);
  } catch (error: any) {
    console.error('Error fetching current statuses:', error);
    res.status(500).json({ error: 'Failed to fetch current statuses' });
  }
});

// Get assets without OPC connection (for dropdown in UI)
router.get('/assets/without-opc', (req: AuthRequest, res: Response) => {
  try {
    const assets = db.prepare(`
      SELECT id, name, asset_tag, category, location
      FROM assets
      WHERE id NOT IN (SELECT asset_id FROM opc_connections)
      ORDER BY name
    `).all();

    res.json(assets);
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

export default router;
