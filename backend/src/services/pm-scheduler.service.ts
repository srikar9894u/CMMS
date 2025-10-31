import db from '../config/database';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

interface PMSchedule {
  id: number;
  asset_id: number;
  title: string;
  description: string;
  frequency: string;
  frequency_value: number;
  last_completed: string | null;
  next_due: string;
  assigned_to: number | null;
  is_active: number;
}

export class PMSchedulerService {
  /**
   * Check for due PM schedules and create work orders automatically
   */
  static async processDuePMSchedules(): Promise<{ created: number; skipped: number; errors: number }> {
    const stats = { created: 0, skipped: 0, errors: 0 };

    try {
      // Get all active PM schedules that are due or overdue
      const duePMSchedules = db.prepare(`
        SELECT pm.*, a.name as asset_name
        FROM preventive_maintenance pm
        INNER JOIN assets a ON pm.asset_id = a.id
        WHERE pm.is_active = 1
        AND datetime(pm.next_due) <= datetime('now')
      `).all() as (PMSchedule & { asset_name: string })[];

      console.log(`Found ${duePMSchedules.length} due PM schedules to process`);

      for (const pm of duePMSchedules) {
        try {
          // Check if a work order already exists for this PM schedule that's not completed
          const existingWO = db.prepare(`
            SELECT id, status FROM work_orders
            WHERE pm_schedule_id = ?
            AND status NOT IN ('completed', 'cancelled')
            ORDER BY created_at DESC
            LIMIT 1
          `).get(pm.id) as any;

          if (existingWO) {
            console.log(`Skipping PM ${pm.id}: Work order ${existingWO.id} already exists with status ${existingWO.status}`);
            stats.skipped++;
            continue;
          }

          // Create work order for this PM
          const workOrderTitle = `PM: ${pm.title} - ${pm.asset_name}`;
          const workOrderDescription = `${pm.description || ''}\n\nAuto-generated from preventive maintenance schedule.\nScheduled Date: ${pm.next_due}`;

          const result = db.prepare(`
            INSERT INTO work_orders (
              title, description, asset_id, priority, status, work_type,
              assigned_to, reported_by, scheduled_date, pm_schedule_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            workOrderTitle,
            workOrderDescription,
            pm.asset_id,
            'medium', // Default priority for PM
            'open',
            'preventive',
            pm.assigned_to,
            1, // System user (admin)
            pm.next_due,
            pm.id
          );

          // Calculate next due date based on frequency
          const nextDueDate = this.calculateNextDueDate(pm.next_due, pm.frequency, pm.frequency_value);

          // Update PM schedule with new next_due date
          db.prepare(`
            UPDATE preventive_maintenance
            SET next_due = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(nextDueDate, pm.id);

          // Log the action
          db.prepare(`
            INSERT INTO application_logs (log_level, source, message, user_id)
            VALUES (?, ?, ?, ?)
          `).run(
            'INFO',
            'pm-scheduler',
            `Auto-created work order ${result.lastInsertRowid} for PM schedule ${pm.id} (${pm.title})`,
            1
          );

          stats.created++;
          console.log(`Created work order ${result.lastInsertRowid} for PM ${pm.id}: ${pm.title}`);

        } catch (error: any) {
          stats.errors++;
          console.error(`Error processing PM ${pm.id}:`, error);

          // Log the error
          db.prepare(`
            INSERT INTO application_logs (log_level, source, message, details)
            VALUES (?, ?, ?, ?)
          `).run(
            'ERROR',
            'pm-scheduler',
            `Failed to create work order for PM ${pm.id}`,
            error.message
          );
        }
      }

      // Log summary
      db.prepare(`
        INSERT INTO application_logs (log_level, source, message)
        VALUES (?, ?, ?)
      `).run(
        'INFO',
        'pm-scheduler',
        `PM Scheduler run completed: ${stats.created} created, ${stats.skipped} skipped, ${stats.errors} errors`
      );

      return stats;

    } catch (error: any) {
      console.error('PM Scheduler error:', error);

      db.prepare(`
        INSERT INTO application_logs (log_level, source, message, details)
        VALUES (?, ?, ?, ?)
      `).run(
        'ERROR',
        'pm-scheduler',
        'PM Scheduler failed to run',
        error.message
      );

      throw error;
    }
  }

  /**
   * Calculate next due date based on frequency
   */
  private static calculateNextDueDate(currentDue: string, frequency: string, frequencyValue: number): string {
    const currentDate = new Date(currentDue);
    let nextDate: Date;

    switch (frequency) {
      case 'daily':
        nextDate = addDays(currentDate, frequencyValue);
        break;
      case 'weekly':
        nextDate = addWeeks(currentDate, frequencyValue);
        break;
      case 'monthly':
        nextDate = addMonths(currentDate, frequencyValue);
        break;
      case 'quarterly':
        nextDate = addMonths(currentDate, frequencyValue * 3);
        break;
      case 'yearly':
        nextDate = addYears(currentDate, frequencyValue);
        break;
      default:
        // Default to monthly if unknown frequency
        nextDate = addMonths(currentDate, 1);
    }

    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Start automatic scheduler (runs every hour)
   */
  static startScheduler() {
    console.log('PM Scheduler started - checking every hour');

    // Run immediately on startup
    this.processDuePMSchedules().catch(err => {
      console.error('Initial PM scheduler run failed:', err);
    });

    // Then run every hour
    setInterval(() => {
      this.processDuePMSchedules().catch(err => {
        console.error('Scheduled PM scheduler run failed:', err);
      });
    }, 60 * 60 * 1000); // 1 hour
  }
}
