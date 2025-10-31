import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { PMSchedulerService } from '../services/pm-scheduler.service';

const router = Router();

// Apply authentication middleware
router.use(authMiddleware);

// Manually trigger PM scheduler (admin only)
router.post('/run', roleMiddleware('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const stats = await PMSchedulerService.processDuePMSchedules();

    res.json({
      message: 'PM Scheduler run completed',
      stats
    });
  } catch (error: any) {
    console.error('Error running PM scheduler:', error);
    res.status(500).json({ error: 'Failed to run PM scheduler' });
  }
});

// Get PM scheduler status
router.get('/status', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    // Get counts of due and upcoming PM schedules
    const duePM = db.prepare(`
      SELECT COUNT(*) as count FROM preventive_maintenance
      WHERE is_active = 1 AND datetime(next_due) <= datetime('now')
    `).get() as any;

    const upcomingPM = db.prepare(`
      SELECT COUNT(*) as count FROM preventive_maintenance
      WHERE is_active = 1
      AND datetime(next_due) > datetime('now')
      AND datetime(next_due) <= datetime('now', '+7 days')
    `).get() as any;

    const recentWorkOrders = db.prepare(`
      SELECT COUNT(*) as count FROM work_orders
      WHERE pm_schedule_id IS NOT NULL
      AND created_at >= datetime('now', '-24 hours')
    `).get() as any;

    res.json({
      due_pm_count: duePM.count,
      upcoming_pm_count: upcomingPM.count,
      recent_auto_work_orders: recentWorkOrders.count,
      scheduler_active: true
    });
  } catch (error: any) {
    console.error('Error fetching PM scheduler status:', error);
    res.status(500).json({ error: 'Failed to fetch PM scheduler status' });
  }
});

import db from '../config/database';

export default router;
