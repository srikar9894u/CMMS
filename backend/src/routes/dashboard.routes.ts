import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get dashboard statistics
router.get('/stats', (req: AuthRequest, res: Response) => {
  try {
    // Asset statistics
    const assetStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END) as operational,
        SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
      FROM assets
    `).get();

    // Work order statistics
    const workOrderStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent
      FROM work_orders
    `).get();

    // Preventive maintenance statistics
    const pmStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 AND next_due < datetime('now') THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN is_active = 1 AND next_due >= datetime('now') AND next_due <= datetime('now', '+7 days') THEN 1 ELSE 0 END) as due_soon
      FROM preventive_maintenance
    `).get();

    // Inventory statistics
    const inventoryStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN quantity <= min_quantity THEN 1 ELSE 0 END) as low_stock
      FROM inventory
    `).get();

    res.json({
      assets: assetStats,
      work_orders: workOrderStats,
      preventive_maintenance: pmStats,
      inventory: inventoryStats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent activity
router.get('/activity', (req: AuthRequest, res: Response) => {
  try {
    const recentWorkOrders = db.prepare(`
      SELECT wo.id, wo.title, wo.status, wo.priority, wo.created_at,
             a.name as asset_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      ORDER BY wo.created_at DESC
      LIMIT 10
    `).all();

    res.json({ recent_work_orders: recentWorkOrders });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
