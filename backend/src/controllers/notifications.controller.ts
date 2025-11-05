import { Request, Response } from 'express';
import notificationService from '../services/notification.service';
import emailService from '../services/email.service';
import { getEmailConfig, saveEmailConfig, testEmailConfig } from '../config/email.config';

/**
 * Get user notification preferences
 */
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const preferences = notificationService.getPreferences(userId);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: error.message,
    });
  }
};

/**
 * Update user notification preferences
 */
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const preferences = req.body;

    const success = notificationService.updatePreferences(userId, preferences);

    if (success) {
      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: notificationService.getPreferences(userId),
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to update notification preferences',
      });
    }
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
};

/**
 * Get notification history for current user
 */
export const getNotificationHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = notificationService.getNotificationHistory(userId, limit);

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('Error getting notification history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification history',
      error: error.message,
    });
  }
};

/**
 * Send test notification (Admin only)
 */
export const sendTestNotification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const result = await emailService.sendTestEmail(email);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message,
    });
  }
};

/**
 * Get email configuration (Admin only)
 */
export const getEmailConfiguration = async (req: Request, res: Response) => {
  try {
    const config = getEmailConfig();

    if (config) {
      // Don't send password to client
      const safeConfig = {
        ...config,
        smtp_password: config.smtp_password ? '********' : null,
      };

      res.json({
        success: true,
        data: safeConfig,
      });
    } else {
      res.json({
        success: true,
        data: null,
        message: 'Email not configured',
      });
    }
  } catch (error: any) {
    console.error('Error getting email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email configuration',
      error: error.message,
    });
  }
};

/**
 * Save email configuration (Admin only)
 */
export const saveEmailConfiguration = async (req: Request, res: Response) => {
  try {
    const config = req.body;

    // Validate required fields
    if (!config.smtp_host || !config.smtp_port || !config.from_email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: smtp_host, smtp_port, from_email',
      });
    }

    // Test configuration before saving
    const isValid = await testEmailConfig(config);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'SMTP configuration test failed. Please check your settings.',
      });
    }

    // Save configuration
    saveEmailConfig(config);

    // Reload email service with new config
    emailService.reloadConfig();

    res.json({
      success: true,
      message: 'Email configuration saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save email configuration',
      error: error.message,
    });
  }
};

/**
 * Test email configuration (Admin only)
 */
export const testEmailConfiguration = async (req: Request, res: Response) => {
  try {
    const config = req.body;

    const isValid = await testEmailConfig(config);

    res.json({
      success: isValid,
      message: isValid
        ? 'Email configuration is valid'
        : 'Email configuration test failed',
    });
  } catch (error: any) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email configuration',
      error: error.message,
    });
  }
};
