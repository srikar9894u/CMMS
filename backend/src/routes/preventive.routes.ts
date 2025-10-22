import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Helper function to determine required sub_role based on asset category
function determineSubRole(category: string): string | null {
  if (!category) return null;

  const categoryLower = category.toLowerCase();

  // Electrical-related categories
  if (categoryLower.includes('electrical') ||
      categoryLower.includes('lighting') ||
      categoryLower.includes('power')) {
    return 'electrical';
  }

  // Mechanical-related categories
  if (categoryLower.includes('mechanical') ||
      categoryLower.includes('hvac') ||
      categoryLower.includes('pump') ||
      categoryLower.includes('motor')) {
    return 'mechanical';
  }

  // No specific sub_role required
  return null;
}

// Helper function to get next available user for auto-assignment
function getNextAvailableUser(assetCategory: string, pmDate: string): number | null {
  try {
    const requiredSubRole = determineSubRole(assetCategory);

    // Try to find user with matching sub_role
    let availableUser = db.prepare(`
      SELECT u.id, u.full_name,
        (SELECT COUNT(*) FROM work_orders wo
         WHERE wo.assigned_to = u.id
         AND wo.status NOT IN ('completed', 'cancelled')) as workload
      FROM users u
      WHERE u.role IN ('technician', 'manager')
      AND u.sub_role = ?
      AND NOT EXISTS (
        SELECT 1 FROM leave_requests lr
        WHERE lr.user_id = u.id
        AND lr.status = 'approved'
        AND ? BETWEEN lr.start_date AND lr.end_date
      )
      ORDER BY workload ASC
      LIMIT 1
    `).get(requiredSubRole, pmDate) as any;

    // If no user found with specific sub_role, fallback to any available technician
    if (!availableUser && requiredSubRole) {
      availableUser = db.prepare(`
        SELECT u.id, u.full_name,
          (SELECT COUNT(*) FROM work_orders wo
           WHERE wo.assigned_to = u.id
           AND wo.status NOT IN ('completed', 'cancelled')) as workload
        FROM users u
        WHERE u.role IN ('technician', 'manager')
        AND NOT EXISTS (
          SELECT 1 FROM leave_requests lr
          WHERE lr.user_id = u.id
          AND lr.status = 'approved'
          AND ? BETWEEN lr.start_date AND lr.end_date
        )
        ORDER BY workload ASC
        LIMIT 1
      `).get(pmDate) as any;
    }

    // If still no user found (no sub_role was required), get any available technician
    if (!availableUser) {
      availableUser = db.prepare(`
        SELECT u.id, u.full_name,
          (SELECT COUNT(*) FROM work_orders wo
           WHERE wo.assigned_to = u.id
           AND wo.status NOT IN ('completed', 'cancelled')) as workload
        FROM users u
        WHERE u.role IN ('technician', 'manager')
        AND NOT EXISTS (
          SELECT 1 FROM leave_requests lr
          WHERE lr.user_id = u.id
          AND lr.status = 'approved'
          AND ? BETWEEN lr.start_date AND lr.end_date
        )
        ORDER BY workload ASC
        LIMIT 1
      `).get(pmDate) as any;
    }

    return availableUser ? availableUser.id : null;
  } catch (error) {
    console.error('Error in getNextAvailableUser:', error);
    return null;
  }
}

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

// Generate work orders for due preventive maintenance
router.get('/generate-work-orders', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    // Find all active PM schedules where next_due is today or in the past
    const dueSchedules = db.prepare(`
      SELECT pm.*, a.category
      FROM preventive_maintenance pm
      JOIN assets a ON pm.asset_id = a.id
      WHERE pm.is_active = 1
      AND date(pm.next_due) <= date('now')
    `).all() as any[];

    let createdCount = 0;
    const createdWorkOrders: any[] = [];

    for (const schedule of dueSchedules) {
      // Check if a work order already exists for this PM schedule and date
      const existingWorkOrder = db.prepare(`
        SELECT id FROM work_orders
        WHERE pm_schedule_id = ?
        AND date(scheduled_date) = date(?)
      `).get(schedule.id, schedule.next_due);

      if (existingWorkOrder) {
        // Work order already exists for this PM occurrence, skip
        continue;
      }

      // Auto-assign based on asset category and user availability
      const assignedUserId = getNextAvailableUser(schedule.category, schedule.next_due);

      // Create work order
      const result = db.prepare(`
        INSERT INTO work_orders (
          title, description, asset_id, priority, status, work_type,
          assigned_to, reported_by, scheduled_date, pm_schedule_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `[PM] ${schedule.title}`,
        schedule.description || `Preventive maintenance for ${schedule.title}`,
        schedule.asset_id,
        'medium', // Default priority, can be made configurable
        assignedUserId ? 'assigned' : 'open', // Status is 'assigned' if user found, otherwise 'open'
        'preventive',
        assignedUserId,
        req.user!.id, // System-generated, reported by current user
        schedule.next_due,
        schedule.id
      );

      createdCount++;
      createdWorkOrders.push({
        id: result.lastInsertRowid,
        pm_schedule_id: schedule.id,
        title: `[PM] ${schedule.title}`,
        assigned_to: assignedUserId,
        scheduled_date: schedule.next_due
      });
    }

    res.json({
      message: `Successfully created ${createdCount} work order(s)`,
      count: createdCount,
      work_orders: createdWorkOrders
    });
  } catch (error) {
    console.error('Generate work orders error:', error);
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

    // Auto-generate work order for the next PM occurrence if it's due soon
    try {
      const asset = db.prepare('SELECT category FROM assets WHERE id = ?').get(schedule.asset_id) as any;

      if (asset) {
        const nextDueDate = nextDue.toISOString().split('T')[0]; // Get date portion

        // Check if next due is within 7 days from now
        const daysUntilDue = Math.floor((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 7) {
          // Check if work order already exists
          const existingWorkOrder = db.prepare(`
            SELECT id FROM work_orders
            WHERE pm_schedule_id = ?
            AND date(scheduled_date) = date(?)
          `).get(req.params.id, nextDue.toISOString());

          if (!existingWorkOrder) {
            // Auto-assign based on asset category and user availability
            const assignedUserId = getNextAvailableUser(asset.category, nextDue.toISOString());

            // Create work order for next occurrence
            db.prepare(`
              INSERT INTO work_orders (
                title, description, asset_id, priority, status, work_type,
                assigned_to, reported_by, scheduled_date, pm_schedule_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              `[PM] ${schedule.title}`,
              schedule.description || `Preventive maintenance for ${schedule.title}`,
              schedule.asset_id,
              'medium',
              assignedUserId ? 'assigned' : 'open',
              'preventive',
              assignedUserId,
              req.user!.id,
              nextDue.toISOString(),
              req.params.id
            );
          }
        }
      }
    } catch (autoGenError) {
      console.error('Auto-generate work order error:', autoGenError);
      // Don't fail the completion if auto-generation fails
    }

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
