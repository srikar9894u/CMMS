import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
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
router.get('/preferences', authenticate, getNotificationPreferences);
router.put('/preferences', authenticate, updateNotificationPreferences);

// Notification history
router.get('/history', authenticate, getNotificationHistory);

// Test notification (Admin only)
router.post('/test', authenticate, authorize(['admin']), sendTestNotification);

// Email configuration (Admin only)
router.get('/email-config', authenticate, authorize(['admin']), getEmailConfiguration);
router.post('/email-config', authenticate, authorize(['admin']), saveEmailConfiguration);
router.post('/email-config/test', authenticate, authorize(['admin']), testEmailConfiguration);

export default router;
