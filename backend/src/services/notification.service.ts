import emailService from './email.service';
import db from '../config/database';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export interface NotificationPreferences {
  id?: number;
  user_id: number;
  email_work_order_assigned: boolean;
  email_work_order_completed: boolean;
  email_work_order_approved: boolean;
  email_pm_reminder_7days: boolean;
  email_pm_reminder_1day: boolean;
  email_leave_request: boolean;
  email_leave_approved: boolean;
  email_inventory_low: boolean;
  email_daily_digest: boolean;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  username: string;
  role: string;
}

export interface WorkOrder {
  id: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  asset_id?: number;
  asset_name?: string;
  scheduled_date?: string;
  assigned_to?: number;
}

export interface PMSchedule {
  id: number;
  title: string;
  description?: string;
  asset_id: number;
  asset_name?: string;
  next_due: string;
  assigned_to?: number;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  user_name?: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason?: string;
  status: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  part_number: string;
  quantity: number;
  min_quantity: number;
  location?: string;
}

class NotificationService {
  private templatesPath: string;
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/email');
    this.loadTemplates();
  }

  /**
   * Load and compile email templates
   */
  private loadTemplates(): void {
    const templates = [
      'work-order-assigned',
      'work-order-completed',
      'work-order-approved',
      'pm-reminder',
      'leave-request',
      'leave-approved',
      'inventory-low',
      'base-layout'
    ];

    for (const templateName of templates) {
      try {
        const templatePath = path.join(this.templatesPath, `${templateName}.html`);
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          const compiled = Handlebars.compile(templateContent);
          this.compiledTemplates.set(templateName, compiled);
        }
      } catch (error) {
        console.warn(`Template ${templateName} not found, will use fallback`);
      }
    }
  }

  /**
   * Get user notification preferences
   */
  private getUserPreferences(userId: number): NotificationPreferences {
    try {
      let prefs = db.prepare(`
        SELECT * FROM notification_preferences WHERE user_id = ?
      `).get(userId) as NotificationPreferences | undefined;

      // Create default preferences if not exists
      if (!prefs) {
        db.prepare(`
          INSERT INTO notification_preferences (user_id) VALUES (?)
        `).run(userId);

        prefs = db.prepare(`
          SELECT * FROM notification_preferences WHERE user_id = ?
        `).get(userId) as NotificationPreferences;
      }

      return prefs;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      // Return default preferences
      return {
        user_id: userId,
        email_work_order_assigned: true,
        email_work_order_completed: true,
        email_work_order_approved: true,
        email_pm_reminder_7days: true,
        email_pm_reminder_1day: true,
        email_leave_request: true,
        email_leave_approved: true,
        email_inventory_low: true,
        email_daily_digest: false,
      };
    }
  }

  /**
   * Get user by ID
   */
  private getUser(userId: number): User | null {
    try {
      return db.prepare(`
        SELECT id, email, full_name, username, role FROM users WHERE id = ?
      `).get(userId) as User | null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Get all managers and admins
   */
  private getManagers(): User[] {
    try {
      return db.prepare(`
        SELECT id, email, full_name, username, role
        FROM users
        WHERE role IN ('admin', 'manager')
      `).all() as User[];
    } catch (error) {
      console.error('Error getting managers:', error);
      return [];
    }
  }

  /**
   * Render email template with data
   */
  private renderTemplate(templateName: string, data: any): string {
    const template = this.compiledTemplates.get(templateName);

    if (template) {
      return template(data);
    }

    // Fallback to simple HTML if template not found
    return this.generateFallbackEmail(templateName, data);
  }

  /**
   * Generate fallback email if template not found
   */
  private generateFallbackEmail(templateName: string, data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CMMS Notification</h1>
        </div>
        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">${templateName.replace(/-/g, ' ').toUpperCase()}</h2>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${JSON.stringify(data, null, 2)}</pre>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Sent by CMMS Notification System at ${new Date().toLocaleString()}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Notify when work order is assigned to a technician
   */
  public async notifyWorkOrderAssigned(workOrder: WorkOrder): Promise<void> {
    try {
      if (!workOrder.assigned_to) return;

      const user = this.getUser(workOrder.assigned_to);
      if (!user || !user.email) return;

      const prefs = this.getUserPreferences(user.id);
      if (!prefs.email_work_order_assigned) return;

      const html = this.renderTemplate('work-order-assigned', {
        userName: user.full_name || user.username,
        workOrderId: workOrder.id,
        workOrderTitle: workOrder.title,
        description: workOrder.description,
        priority: workOrder.priority,
        assetName: workOrder.asset_name || 'N/A',
        scheduledDate: workOrder.scheduled_date ? new Date(workOrder.scheduled_date).toLocaleDateString() : 'Not scheduled',
        workOrderUrl: `${process.env.FRONTEND_URL || 'http://localhost'}/work-orders/${workOrder.id}`,
      });

      const result = await emailService.sendEmail({
        to: user.email,
        subject: `Work Order Assigned: ${workOrder.title}`,
        html,
      });

      emailService.logNotification(
        user.id,
        'email',
        'work_order_assigned',
        `Work Order Assigned: ${workOrder.title}`,
        html,
        result.success ? 'sent' : 'failed',
        result.error
      );
    } catch (error) {
      console.error('Error sending work order assigned notification:', error);
    }
  }

  /**
   * Notify when work order is completed
   */
  public async notifyWorkOrderCompleted(workOrder: WorkOrder, completedBy: User): Promise<void> {
    try {
      // Notify managers and the person who reported it
      const managers = this.getManagers();
      const reportedBy = workOrder.assigned_to ? this.getUser(workOrder.assigned_to) : null;

      const recipients: User[] = [...managers];
      if (reportedBy && !recipients.find(u => u.id === reportedBy.id)) {
        recipients.push(reportedBy);
      }

      for (const user of recipients) {
        if (!user.email) continue;

        const prefs = this.getUserPreferences(user.id);
        if (!prefs.email_work_order_completed) continue;

        const html = this.renderTemplate('work-order-completed', {
          userName: user.full_name || user.username,
          workOrderId: workOrder.id,
          workOrderTitle: workOrder.title,
          completedBy: completedBy.full_name || completedBy.username,
          completedDate: new Date().toLocaleDateString(),
          assetName: workOrder.asset_name || 'N/A',
          workOrderUrl: `${process.env.FRONTEND_URL || 'http://localhost'}/work-orders/${workOrder.id}`,
        });

        const result = await emailService.sendEmail({
          to: user.email,
          subject: `Work Order Completed: ${workOrder.title}`,
          html,
        });

        emailService.logNotification(
          user.id,
          'email',
          'work_order_completed',
          `Work Order Completed: ${workOrder.title}`,
          html,
          result.success ? 'sent' : 'failed',
          result.error
        );
      }
    } catch (error) {
      console.error('Error sending work order completed notification:', error);
    }
  }

  /**
   * Notify about preventive maintenance reminder
   */
  public async notifyPMReminder(pmSchedule: PMSchedule, daysUntilDue: number): Promise<void> {
    try {
      if (!pmSchedule.assigned_to) return;

      const user = this.getUser(pmSchedule.assigned_to);
      if (!user || !user.email) return;

      const prefs = this.getUserPreferences(user.id);
      const prefKey = daysUntilDue === 7 ? 'email_pm_reminder_7days' : 'email_pm_reminder_1day';
      if (!prefs[prefKey as keyof NotificationPreferences]) return;

      const html = this.renderTemplate('pm-reminder', {
        userName: user.full_name || user.username,
        pmTitle: pmSchedule.title,
        assetName: pmSchedule.asset_name || 'N/A',
        dueDate: new Date(pmSchedule.next_due).toLocaleDateString(),
        daysUntilDue: daysUntilDue,
        description: pmSchedule.description,
        urgency: daysUntilDue === 1 ? 'urgent' : 'reminder',
        pmUrl: `${process.env.FRONTEND_URL || 'http://localhost'}/preventive-maintenance`,
      });

      const result = await emailService.sendEmail({
        to: user.email,
        subject: `PM Reminder: ${pmSchedule.title} - Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
        html,
      });

      emailService.logNotification(
        user.id,
        'email',
        `pm_reminder_${daysUntilDue}days`,
        `PM Reminder: ${pmSchedule.title}`,
        html,
        result.success ? 'sent' : 'failed',
        result.error
      );
    } catch (error) {
      console.error('Error sending PM reminder notification:', error);
    }
  }

  /**
   * Notify managers about new leave request
   */
  public async notifyLeaveRequest(leaveRequest: LeaveRequest): Promise<void> {
    try {
      const managers = this.getManagers();
      const requestingUser = this.getUser(leaveRequest.user_id);

      if (!requestingUser) return;

      for (const manager of managers) {
        if (!manager.email) continue;

        const prefs = this.getUserPreferences(manager.id);
        if (!prefs.email_leave_request) continue;

        const html = this.renderTemplate('leave-request', {
          managerName: manager.full_name || manager.username,
          employeeName: requestingUser.full_name || requestingUser.username,
          leaveType: leaveRequest.leave_type,
          startDate: new Date(leaveRequest.start_date).toLocaleDateString(),
          endDate: new Date(leaveRequest.end_date).toLocaleDateString(),
          reason: leaveRequest.reason || 'No reason provided',
          leaveUrl: `${process.env.FRONTEND_URL || 'http://localhost'}/leave-management`,
        });

        const result = await emailService.sendEmail({
          to: manager.email,
          subject: `Leave Request: ${requestingUser.full_name} - ${leaveRequest.leave_type}`,
          html,
        });

        emailService.logNotification(
          manager.id,
          'email',
          'leave_request',
          `Leave Request from ${requestingUser.full_name}`,
          html,
          result.success ? 'sent' : 'failed',
          result.error
        );
      }
    } catch (error) {
      console.error('Error sending leave request notification:', error);
    }
  }

  /**
   * Notify user about leave request approval/rejection
   */
  public async notifyLeaveApproved(leaveRequest: LeaveRequest, approved: boolean, approvedBy: User): Promise<void> {
    try {
      const user = this.getUser(leaveRequest.user_id);
      if (!user || !user.email) return;

      const prefs = this.getUserPreferences(user.id);
      if (!prefs.email_leave_approved) return;

      const html = this.renderTemplate('leave-approved', {
        userName: user.full_name || user.username,
        approved: approved,
        status: approved ? 'Approved' : 'Rejected',
        approvedBy: approvedBy.full_name || approvedBy.username,
        leaveType: leaveRequest.leave_type,
        startDate: new Date(leaveRequest.start_date).toLocaleDateString(),
        endDate: new Date(leaveRequest.end_date).toLocaleDateString(),
        leaveUrl: `${process.env.FRONTEND_URL || 'http://localhost'}/leave-management`,
      });

      const result = await emailService.sendEmail({
        to: user.email,
        subject: `Leave Request ${approved ? 'Approved' : 'Rejected'}`,
        html,
      });

      emailService.logNotification(
        user.id,
        'email',
        'leave_approved',
        `Leave Request ${approved ? 'Approved' : 'Rejected'}`,
        html,
        result.success ? 'sent' : 'failed',
        result.error
      );
    } catch (error) {
      console.error('Error sending leave approved notification:', error);
    }
  }

  /**
   * Notify managers about low inventory
   */
  public async notifyInventoryLow(inventoryItem: InventoryItem): Promise<void> {
    try {
      const managers = this.getManagers();

      for (const manager of managers) {
        if (!manager.email) continue;

        const prefs = this.getUserPreferences(manager.id);
        if (!prefs.email_inventory_low) continue;

        const html = this.renderTemplate('inventory-low', {
          managerName: manager.full_name || manager.username,
          itemName: inventoryItem.name,
          partNumber: inventoryItem.part_number,
          currentQuantity: inventoryItem.quantity,
          minQuantity: inventoryItem.min_quantity,
          location: inventoryItem.location || 'Not specified',
          inventoryUrl: `${process.env.FRONTEND_URL || 'http://localhost'}/inventory`,
        });

        const result = await emailService.sendEmail({
          to: manager.email,
          subject: `Low Inventory Alert: ${inventoryItem.name}`,
          html,
        });

        emailService.logNotification(
          manager.id,
          'email',
          'inventory_low',
          `Low Inventory: ${inventoryItem.name}`,
          html,
          result.success ? 'sent' : 'failed',
          result.error
        );
      }
    } catch (error) {
      console.error('Error sending inventory low notification:', error);
    }
  }

  /**
   * Get notification preferences for a user
   */
  public getPreferences(userId: number): NotificationPreferences {
    return this.getUserPreferences(userId);
  }

  /**
   * Update notification preferences for a user
   */
  public updatePreferences(userId: number, preferences: Partial<NotificationPreferences>): boolean {
    try {
      const currentPrefs = this.getUserPreferences(userId);

      const updateFields: string[] = [];
      const values: any[] = [];

      Object.keys(preferences).forEach(key => {
        if (key !== 'id' && key !== 'user_id' && key in currentPrefs) {
          updateFields.push(`${key} = ?`);
          values.push(preferences[key as keyof NotificationPreferences] ? 1 : 0);
        }
      });

      if (updateFields.length === 0) return false;

      values.push(userId);

      db.prepare(`
        UPDATE notification_preferences
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(...values);

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Get notification history for a user
   */
  public getNotificationHistory(userId: number, limit: number = 50): any[] {
    try {
      return db.prepare(`
        SELECT * FROM notification_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(userId, limit) as any[];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
