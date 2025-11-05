import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get all assets
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { status, category, criticality } = req.query;
    let query = 'SELECT * FROM assets WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (criticality) {
      query += ' AND criticality = ?';
      params.push(criticality);
    }

    query += ' ORDER BY updated_at DESC';

    const assets = db.prepare(query).all(...params);
    res.json(assets);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get asset statistics
router.get('/stats', (req: AuthRequest, res: Response) => {
  try {
    const totalAssets = db.prepare('SELECT COUNT(*) as count FROM assets').get() as { count: number };
    const statusCounts = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN real_time_status = 'running' THEN 1 ELSE 0 END), 0) as running,
        COALESCE(SUM(CASE WHEN real_time_status = 'trip' THEN 1 ELSE 0 END), 0) as trip,
        COALESCE(SUM(CASE WHEN real_time_status = 'stopped' OR real_time_status = 'off' THEN 1 ELSE 0 END), 0) as stopped,
        COALESCE(SUM(CASE WHEN real_time_status = 'unknown' OR real_time_status IS NULL THEN 1 ELSE 0 END), 0) as unknown,
        COALESCE(SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END), 0) as down
      FROM assets
    `).get() as any;

    res.json({
      total: totalAssets.count,
      running: statusCounts.running,
      trip: statusCounts.trip,
      stopped: statusCounts.stopped,
      down: statusCounts.down,
      unknown: statusCounts.unknown
    });
  } catch (error) {
    console.error('Get asset stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get asset by ID
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create asset (admin/manager only)
router.post(
  '/',
  roleMiddleware('admin', 'manager'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('asset_tag').notEmpty().withMessage('Asset tag is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('status').isIn(['operational', 'down', 'maintenance', 'retired']).withMessage('Invalid status'),
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, asset_tag, category, location, manufacturer, model,
      serial_number, purchase_date, warranty_expiry, status,
      criticality, description, notes
    } = req.body;

    try {
      const result = db.prepare(`
        INSERT INTO assets (
          name, asset_tag, category, location, manufacturer, model,
          serial_number, purchase_date, warranty_expiry, status,
          criticality, description, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, asset_tag, category, location || null, manufacturer || null,
        model || null, serial_number || null, purchase_date || null,
        warranty_expiry || null, status, criticality || null,
        description || null, notes || null
      );

      res.status(201).json({ id: result.lastInsertRowid, message: 'Asset created successfully' });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Asset tag already exists' });
      }
      console.error('Create asset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update asset (admin/manager only)
router.put('/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'name', 'asset_tag', 'category', 'location', 'manufacturer', 'model',
      'serial_number', 'purchase_date', 'warranty_expiry', 'status',
      'criticality', 'description', 'notes'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`UPDATE assets SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete asset (admin only)
router.delete('/:id', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
