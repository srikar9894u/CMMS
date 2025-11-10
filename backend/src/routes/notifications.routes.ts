import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationHistory,
  sendTestNotification,
  getEmailConfiguration,
  saveEmailConfiguration,
  testEmailConfiguration,
} from '../controllers/notifications.controller';

const router = express.Router();

// User notification preferences
router.get('/preferences', authMiddleware, getNotificationPreferences);
router.put('/preferences', authMiddleware, updateNotificationPreferences);

// Notification history
router.get('/history', authMiddleware, getNotificationHistory);

// Test notification (Admin only)
router.post('/test', authMiddleware, roleMiddleware('admin'), sendTestNotification);

// Email configuration (Admin only)
router.get('/email-config', authMiddleware, roleMiddleware('admin'), getEmailConfiguration);
router.post('/email-config', authMiddleware, roleMiddleware('admin'), saveEmailConfiguration);
router.post('/email-config/test', authMiddleware, roleMiddleware('admin'), testEmailConfiguration);

export default router;
