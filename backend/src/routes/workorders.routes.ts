import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get all work orders
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, work_type, assigned_to } = req.query;
    let query = `
      SELECT wo.*,
             a.name as asset_name,
             u1.full_name as assigned_to_name,
             u2.full_name as reported_by_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN users u1 ON wo.assigned_to = u1.id
      LEFT JOIN users u2 ON wo.reported_by = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND wo.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND wo.priority = ?';
      params.push(priority);
    }
    if (work_type) {
      query += ' AND wo.work_type = ?';
      params.push(work_type);
    }
    if (assigned_to) {
      query += ' AND wo.assigned_to = ?';
      params.push(assigned_to);
    }

    query += ' ORDER BY wo.created_at DESC';

    const workOrders = db.prepare(query).all(...params);
    res.json(workOrders);
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get work order by ID
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const workOrder = db.prepare(`
      SELECT wo.*,
             a.name as asset_name,
             u1.full_name as assigned_to_name,
             u2.full_name as reported_by_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN users u1 ON wo.assigned_to = u1.id
      LEFT JOIN users u2 ON wo.reported_by = u2.id
      WHERE wo.id = ?
    `).get(req.params.id);

    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    // Get associated parts
    const parts = db.prepare(`
      SELECT wop.*, i.name as part_name, i.part_number
      FROM work_order_parts wop
      JOIN inventory i ON wop.inventory_id = i.id
      WHERE wop.work_order_id = ?
    `).all(req.params.id);

    res.json({ ...workOrder, parts });
  } catch (error) {
    console.error('Get work order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create work order
router.post(
  '/',
  roleMiddleware('admin', 'manager', 'technician'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('work_type').isIn(['corrective', 'preventive', 'inspection', 'project']).withMessage('Invalid work type'),
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, asset_id, priority, status, work_type,
      assigned_to, estimated_hours, scheduled_date, notes
    } = req.body;

    try {
      const result = db.prepare(`
        INSERT INTO work_orders (
          title, description, asset_id, priority, status, work_type,
          assigned_to, reported_by, estimated_hours, scheduled_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        title, description || null, asset_id || null, priority,
        status || 'open', work_type, assigned_to || null,
        req.user!.id, estimated_hours || null, scheduled_date || null,
        notes || null
      );

      res.status(201).json({ id: result.lastInsertRowid, message: 'Work order created successfully' });
    } catch (error) {
      console.error('Create work order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update work order
router.put('/:id', roleMiddleware('admin', 'manager', 'technician'), (req: AuthRequest, res: Response) => {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'title', 'description', 'asset_id', 'priority', 'status', 'work_type',
      'assigned_to', 'estimated_hours', 'actual_hours', 'scheduled_date',
      'completed_date', 'notes'
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

    db.prepare(`UPDATE work_orders SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'Work order updated successfully' });
  } catch (error) {
    console.error('Update work order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete work order (admin/manager only)
router.delete('/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM work_orders WHERE id = ?').run(req.params.id);
    res.json({ message: 'Work order deleted successfully' });
  } catch (error) {
    console.error('Delete work order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add part to work order
router.post('/:id/parts', roleMiddleware('admin', 'manager', 'technician'), (req: AuthRequest, res: Response) => {
  const { inventory_id, quantity, notes } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO work_order_parts (work_order_id, inventory_id, quantity, notes)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, inventory_id, quantity, notes || null);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Part added to work order' });
  } catch (error) {
    console.error('Add part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
