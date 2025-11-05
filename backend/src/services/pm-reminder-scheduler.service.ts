import cron from 'node-cron';
import db from '../config/database';
import notificationService from './notification.service';

/**
 * PM Reminder Scheduler Service
 *
 * Automatically sends email reminders for upcoming preventive maintenance:
 * - 7 days before due date
 * - 1 day before due date
 *
 * Runs daily at 9:00 AM server time
 */
class PMReminderSchedulerService {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  /**
   * Start the PM reminder scheduler
   * Runs daily at 9:00 AM
   */
  public startScheduler(): void {
    if (this.cronJob) {
      console.log('PM Reminder Scheduler is already running');
      return;
    }

    // Schedule to run daily at 9:00 AM
    this.cronJob = cron.schedule('0 9 * * *', () => {
      this.checkAndSendReminders();
    });

    console.log('PM Reminder Scheduler started - will run daily at 9:00 AM');

    // Run immediately on startup for testing
    this.checkAndSendReminders();
  }

  /**
   * Stop the scheduler
   */
  public stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('PM Reminder Scheduler stopped');
    }
  }

  /**
   * Check for upcoming PM schedules and send reminders
   */
  private async checkAndSendReminders(): Promise<void> {
    if (this.isRunning) {
      console.log('PM reminder check already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log(`[PM Reminder] Starting PM reminder check at ${new Date().toISOString()}`);

    try {
      await this.sendSevenDayReminders();
      await this.sendOneDayReminders();
    } catch (error) {
      console.error('[PM Reminder] Error during PM reminder check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Send reminders for PMs due in 7 days
   */
  private async sendSevenDayReminders(): Promise<void> {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const targetDate = sevenDaysFromNow.toISOString().split('T')[0];

      // Get PMs that are due in 7 days and haven't been reminded yet
      const pmSchedules = db.prepare(`
        SELECT
          pm.*,
          a.name as asset_name,
          pm.title as pm_name,
          pm.description as pm_description
        FROM preventive_maintenance pm
        LEFT JOIN assets a ON pm.asset_id = a.id
        WHERE pm.is_active = 1
          AND DATE(pm.next_due) = DATE(?)
          AND pm.last_7day_reminder_sent IS NULL
      `).all(targetDate) as any[];

      console.log(`[PM Reminder] Found ${pmSchedules.length} PM(s) due in 7 days`);

      for (const schedule of pmSchedules) {
        try {
          // Send reminder notification
          await notificationService.notifyPMReminder(schedule, 7);

          // Mark that we sent the 7-day reminder
          db.prepare(`
            UPDATE preventive_maintenance
            SET last_7day_reminder_sent = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(schedule.id);

          console.log(`[PM Reminder] Sent 7-day reminder for PM #${schedule.id}: ${schedule.title}`);
        } catch (error) {
          console.error(`[PM Reminder] Failed to send 7-day reminder for PM #${schedule.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[PM Reminder] Error sending 7-day reminders:', error);
    }
  }

  /**
   * Send reminders for PMs due in 1 day (urgent)
   */
  private async sendOneDayReminders(): Promise<void> {
    try {
      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
      const targetDate = oneDayFromNow.toISOString().split('T')[0];

      // Get PMs that are due in 1 day and haven't been reminded yet
      const pmSchedules = db.prepare(`
        SELECT
          pm.*,
          a.name as asset_name,
          pm.title as pm_name,
          pm.description as pm_description
        FROM preventive_maintenance pm
        LEFT JOIN assets a ON pm.asset_id = a.id
        WHERE pm.is_active = 1
          AND DATE(pm.next_due) = DATE(?)
          AND pm.last_1day_reminder_sent IS NULL
      `).all(targetDate) as any[];

      console.log(`[PM Reminder] Found ${pmSchedules.length} PM(s) due in 1 day (URGENT)`);

      for (const schedule of pmSchedules) {
        try {
          // Send urgent reminder notification
          await notificationService.notifyPMReminder(schedule, 1);

          // Mark that we sent the 1-day reminder
          db.prepare(`
            UPDATE preventive_maintenance
            SET last_1day_reminder_sent = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(schedule.id);

          console.log(`[PM Reminder] Sent 1-day URGENT reminder for PM #${schedule.id}: ${schedule.title}`);
        } catch (error) {
          console.error(`[PM Reminder] Failed to send 1-day reminder for PM #${schedule.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[PM Reminder] Error sending 1-day reminders:', error);
    }
  }

  /**
   * Manually trigger reminder check (for testing)
   */
  public async triggerManualCheck(): Promise<void> {
    console.log('[PM Reminder] Manual reminder check triggered');
    await this.checkAndSendReminders();
  }

  /**
   * Get scheduler status
   */
  public getStatus(): { isRunning: boolean; isScheduled: boolean } {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob !== null,
    };
  }
}

// Export singleton instance
export const pmReminderSchedulerService = new PMReminderSchedulerService();
export default pmReminderSchedulerService;
