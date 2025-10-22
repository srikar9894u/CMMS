import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get all preventive maintenance schedules
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { asset_id, is_active } = req.query;
    let query = `
      SELECT pm.*,
             a.name as asset_name,
             u.full_name as assigned_to_name
      FROM preventive_maintenance pm
      JOIN assets a ON pm.asset_id = a.id
      LEFT JOIN users u ON pm.assigned_to = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (asset_id) {
      query += ' AND pm.asset_id = ?';
      params.push(asset_id);
    }
    if (is_active !== undefined) {
      query += ' AND pm.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY pm.next_due ASC';

    const schedules = db.prepare(query).all(...params);
    res.json(schedules);
  } catch (error) {
    console.error('Get PM schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overdue preventive maintenance
router.get('/overdue', (req: AuthRequest, res: Response) => {
  try {
    const schedules = db.prepare(`
      SELECT pm.*,
             a.name as asset_name,
             u.full_name as assigned_to_name
      FROM preventive_maintenance pm
      JOIN assets a ON pm.asset_id = a.id
      LEFT JOIN users u ON pm.assigned_to = u.id
      WHERE pm.is_active = 1 AND pm.next_due < datetime('now')
      ORDER BY pm.next_due ASC
    `).all();

    res.json(schedules);
  } catch (error) {
    console.error('Get overdue PM error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get PM schedule by ID
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const schedule = db.prepare(`
      SELECT pm.*,
             a.name as asset_name,
             u.full_name as assigned_to_name
      FROM preventive_maintenance pm
      JOIN assets a ON pm.asset_id = a.id
      LEFT JOIN users u ON pm.assigned_to = u.id
      WHERE pm.id = ?
    `).get(req.params.id);

    if (!schedule) {
      return res.status(404).json({ error: 'PM schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    console.error('Get PM schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create PM schedule (admin/manager only)
router.post(
  '/',
  roleMiddleware('admin', 'manager'),
  [
    body('asset_id').isInt().withMessage('Asset ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('frequency').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).withMessage('Invalid frequency'),
    body('frequency_value').isInt({ min: 1 }).withMessage('Frequency value must be positive'),
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      asset_id, title, description, frequency, frequency_value,
      next_due, assigned_to
    } = req.body;

    try {
      const result = db.prepare(`
        INSERT INTO preventive_maintenance (
          asset_id, title, description, frequency, frequency_value,
          next_due, assigned_to
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        asset_id, title, description || null, frequency, frequency_value,
        next_due, assigned_to || null
      );

      res.status(201).json({ id: result.lastInsertRowid, message: 'PM schedule created successfully' });
    } catch (error) {
      console.error('Create PM schedule error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update PM schedule (admin/manager only)
router.put('/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'asset_id', 'title', 'description', 'frequency', 'frequency_value',
      'last_completed', 'next_due', 'assigned_to', 'is_active'
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

    db.prepare(`UPDATE preventive_maintenance SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'PM schedule updated successfully' });
  } catch (error) {
    console.error('Update PM schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete PM task
router.post('/:id/complete', roleMiddleware('admin', 'manager', 'technician'), (req: AuthRequest, res: Response) => {
  try {
    const schedule = db.prepare('SELECT * FROM preventive_maintenance WHERE id = ?').get(req.params.id) as any;

    if (!schedule) {
      return res.status(404).json({ error: 'PM schedule not found' });
    }

    // Calculate next due date based on frequency
    const now = new Date();
    let nextDue = new Date(now);

    switch (schedule.frequency) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + schedule.frequency_value);
        break;
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + (7 * schedule.frequency_value));
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + schedule.frequency_value);
        break;
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + (3 * schedule.frequency_value));
        break;
      case 'yearly':
        nextDue.setFullYear(nextDue.getFullYear() + schedule.frequency_value);
        break;
    }

    db.prepare(`
      UPDATE preventive_maintenance
      SET last_completed = datetime('now'),
          next_due = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextDue.toISOString(), req.params.id);

    res.json({ message: 'PM task completed successfully', next_due: nextDue.toISOString() });
  } catch (error) {
    console.error('Complete PM task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete PM schedule (admin only)
router.delete('/:id', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM preventive_maintenance WHERE id = ?').run(req.params.id);
    res.json({ message: 'PM schedule deleted successfully' });
  } catch (error) {
    console.error('Delete PM schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
