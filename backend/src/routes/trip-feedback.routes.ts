import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../config/database';
import { logError, logInfo } from '../utils/logger';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all trip feedback reports
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { status, asset_id } = req.query;

    let query = `
      SELECT tf.*,
        a.name as asset_name, a.asset_tag,
        u.full_name as reported_by_name, u.username as reported_by_username,
        wo.title as work_order_title, wo.status as work_order_status
      FROM trip_feedback tf
      INNER JOIN assets a ON tf.asset_id = a.id
      INNER JOIN users u ON tf.reported_by = u.id
      LEFT JOIN work_orders wo ON tf.work_order_id = wo.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND tf.status = ?';
      params.push(status);
    }

    if (asset_id) {
      query += ' AND tf.asset_id = ?';
      params.push(asset_id);
    }

    // If user is electrical sub-role and not admin/manager, only show their reports
    if (req.user?.sub_role === 'electrical' && req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      query += ' AND tf.reported_by = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY tf.created_at DESC';

    const reports = db.prepare(query).all(...params);

    res.json(reports);
  } catch (error: any) {
    logError('trip-feedback.routes', 'Error fetching trip feedback', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch trip feedback' });
  }
});

// Get single trip feedback report
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const report = db.prepare(`
      SELECT tf.*,
        a.name as asset_name, a.asset_tag,
        u.full_name as reported_by_name, u.username as reported_by_username,
        wo.title as work_order_title, wo.status as work_order_status
      FROM trip_feedback tf
      INNER JOIN assets a ON tf.asset_id = a.id
      INNER JOIN users u ON tf.reported_by = u.id
      LEFT JOIN work_orders wo ON tf.work_order_id = wo.id
      WHERE tf.id = ?
    `).get(id);

    if (!report) {
      return res.status(404).json({ error: 'Trip feedback not found' });
    }

    res.json(report);
  } catch (error: any) {
    logError('trip-feedback.routes', 'Error fetching trip feedback', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch trip feedback' });
  }
});

// Create new trip feedback and automatically create work order
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { asset_id, trip_time, trip_reason, description } = req.body;

    // Validation
    if (!asset_id || !trip_time) {
      return res.status(400).json({ error: 'Asset ID and trip time are required' });
    }

    // Check if asset exists
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id) as any;
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Insert trip feedback
    const tripResult = db.prepare(`
      INSERT INTO trip_feedback (
        asset_id, trip_time, trip_reason, description, reported_by, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      asset_id,
      trip_time,
      trip_reason || 'Not specified',
      description || '',
      req.user?.id,
      'pending'
    );

    const tripFeedbackId = tripResult.lastInsertRowid;

    // Automatically create a corrective work order
    const woTitle = `TRIP: ${asset.name} - ${trip_reason || 'Equipment Trip'}`;
    const woDescription = `Equipment trip reported at ${trip_time}\n\nTrip Reason: ${trip_reason || 'Not specified'}\n\nDetails: ${description || 'No additional details provided'}\n\nReported by: ${req.user?.full_name || req.user?.username}`;

    const woResult = db.prepare(`
      INSERT INTO work_orders (
        title, description, asset_id, priority, status, work_type,
        assigned_to, reported_by, scheduled_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      woTitle,
      woDescription,
      asset_id,
      'urgent', // Trips are urgent
      'open',
      'corrective',
      null, // Will be assigned by manager
      req.user?.id,
    );

    const workOrderId = woResult.lastInsertRowid;

    // Update trip feedback with work order ID
    db.prepare(`
      UPDATE trip_feedback
      SET work_order_id = ?, status = 'work_order_created', updated_at = datetime('now')
      WHERE id = ?
    `).run(workOrderId, tripFeedbackId);

    // Log the action
    logInfo('trip-feedback.routes', `Trip feedback created for asset ${asset.name} with auto-generated work order`, {
      trip_feedback_id: tripFeedbackId,
      work_order_id: workOrderId,
      asset_id,
      asset_name: asset.name
    }, req.user?.id, req.ip);

    res.json({
      id: tripFeedbackId,
      work_order_id: workOrderId,
      message: 'Trip feedback submitted and work order created successfully'
    });
  } catch (error: any) {
    logError('trip-feedback.routes', 'Error creating trip feedback', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to create trip feedback' });
  }
});

// Update trip feedback status
router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Only admin/manager can update status
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const report = db.prepare('SELECT * FROM trip_feedback WHERE id = ?').get(id);

    if (!report) {
      return res.status(404).json({ error: 'Trip feedback not found' });
    }

    db.prepare(`
      UPDATE trip_feedback
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, id);

    // Log the action
    logInfo('trip-feedback.routes', `Trip feedback status updated to ${status}`, {
      trip_feedback_id: id,
      new_status: status
    }, req.user?.id, req.ip);

    res.json({ message: 'Trip feedback updated successfully' });
  } catch (error: any) {
    logError('trip-feedback.routes', 'Error updating trip feedback', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to update trip feedback' });
  }
});

// Delete trip feedback (admin only)
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Only admin can delete
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const report = db.prepare('SELECT * FROM trip_feedback WHERE id = ?').get(id);

    if (!report) {
      return res.status(404).json({ error: 'Trip feedback not found' });
    }

    db.prepare('DELETE FROM trip_feedback WHERE id = ?').run(id);

    // Log the action
    logInfo('trip-feedback.routes', `Trip feedback deleted`, {
      trip_feedback_id: id
    }, req.user?.id, req.ip);

    res.json({ message: 'Trip feedback deleted successfully' });
  } catch (error: any) {
    logError('trip-feedback.routes', 'Error deleting trip feedback', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to delete trip feedback' });
  }
});

// Get trip feedback statistics
router.get('/stats/summary', (req: AuthRequest, res: Response) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM trip_feedback').get() as any,
      by_status: db.prepare(`
        SELECT status, COUNT(*) as count
        FROM trip_feedback
        GROUP BY status
      `).all(),
      recent: db.prepare(`
        SELECT tf.*, a.name as asset_name, u.full_name as reported_by_name
        FROM trip_feedback tf
        INNER JOIN assets a ON tf.asset_id = a.id
        INNER JOIN users u ON tf.reported_by = u.id
        ORDER BY tf.created_at DESC
        LIMIT 10
      `).all()
    };

    res.json(stats);
  } catch (error: any) {
    logError('trip-feedback.routes', 'Error fetching trip feedback stats', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Failed to fetch trip feedback statistics' });
  }
});

export default router;
