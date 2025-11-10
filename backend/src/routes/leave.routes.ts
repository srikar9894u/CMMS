import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import notificationService from '../services/notification.service';

const router = Router();
router.use(authMiddleware);

// Get all leave requests (admin/manager see all, others see only their own)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    let query = `
      SELECT lr.*,
             u.full_name as user_name,
             u.username as username,
             a.full_name as approved_by_name
      FROM leave_requests lr
      LEFT JOIN users u ON lr.user_id = u.id
      LEFT JOIN users a ON lr.approved_by = a.id
    `;

    const params: any[] = [];

    // Non-admin/manager users can only see their own leave requests
    if (req.user!.role !== 'admin' && req.user!.role !== 'manager') {
      query += ' WHERE lr.user_id = ?';
      params.push(req.user!.id);
    }

    query += ' ORDER BY lr.created_at DESC';

    const leaves = db.prepare(query).all(...params);
    res.json(leaves);
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leave request by ID
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const leave = db.prepare(`
      SELECT lr.*,
             u.full_name as user_name,
             u.username as username,
             a.full_name as approved_by_name
      FROM leave_requests lr
      LEFT JOIN users u ON lr.user_id = u.id
      LEFT JOIN users a ON lr.approved_by = a.id
      WHERE lr.id = ?
    `).get(req.params.id);

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Check permission
    const leaveData = leave as any;
    if (req.user!.role !== 'admin' && req.user!.role !== 'manager' && leaveData.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(leave);
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create leave request
router.post(
  '/',
  [
    body('start_date').notEmpty().withMessage('Start date is required'),
    body('end_date').notEmpty().withMessage('End date is required'),
    body('leave_type').isIn(['vacation', 'sick', 'personal', 'other']).withMessage('Invalid leave type'),
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start_date, end_date, leave_type, reason } = req.body;

    try {
      // Validate dates
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (endDate < startDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      const result = db.prepare(`
        INSERT INTO leave_requests (user_id, start_date, end_date, leave_type, reason, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `).run(req.user!.id, start_date, end_date, leave_type, reason || null);

      const leaveRequestId = result.lastInsertRowid;

      // Send notification to managers
      const leaveRequest = {
        id: Number(leaveRequestId),
        user_id: req.user!.id,
        start_date,
        end_date,
        leave_type,
        reason,
        status: 'pending',
      };
      notificationService.notifyLeaveRequest(leaveRequest).catch(err => {
        console.error('Failed to send leave request notification:', err);
      });

      res.status(201).json({ id: leaveRequestId, message: 'Leave request created successfully' });
    } catch (error) {
      console.error('Create leave request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update leave request status (admin/manager only)
router.put('/:id/status', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  const { status, notes } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  try {
    db.prepare(`
      UPDATE leave_requests
      SET status = ?,
          approved_by = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.user!.id, notes || null, req.params.id);

    // Get the updated leave request for notification
    const leaveRequest = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id) as any;

    if (leaveRequest) {
      const approvedBy = {
        id: req.user!.id,
        full_name: req.user!.full_name,
        username: req.user!.username,
        email: req.user!.email,
        role: req.user!.role,
      };
      const approved = status === 'approved';
      notificationService.notifyLeaveApproved(leaveRequest, approved, approvedBy).catch(err => {
        console.error('Failed to send leave approval notification:', err);
      });
    }

    res.json({ message: `Leave request ${status} successfully` });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete leave request (user can delete their own if pending, admin/manager can delete any)
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const leave = db.prepare('SELECT user_id, status FROM leave_requests WHERE id = ?').get(req.params.id) as any;

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Check permissions
    const isOwn = leave.user_id === req.user!.id;
    const isManager = req.user!.role === 'admin' || req.user!.role === 'manager';
    const isPending = leave.status === 'pending';

    if (!isManager && (!isOwn || !isPending)) {
      return res.status(403).json({ error: 'Cannot delete this leave request' });
    }

    db.prepare('DELETE FROM leave_requests WHERE id = ?').run(req.params.id);
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user is on leave on a specific date
router.get('/check/:userId/:date', (req: AuthRequest, res: Response) => {
  try {
    const { userId, date } = req.params;

    const onLeave = db.prepare(`
      SELECT id FROM leave_requests
      WHERE user_id = ?
        AND status = 'approved'
        AND ? BETWEEN start_date AND end_date
      LIMIT 1
    `).get(userId, date);

    res.json({ on_leave: !!onLeave });
  } catch (error) {
    console.error('Check leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
