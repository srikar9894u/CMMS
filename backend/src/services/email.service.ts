import nodemailer, { Transporter } from 'nodemailer';
import { getEmailConfig } from '../config/email.config';
import db from '../config/database';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize the email transporter with current configuration
   */
  private initializeTransporter(): void {
    try {
      const config = getEmailConfig();

      if (!config || !config.smtp_host) {
        console.warn('Email service not configured. Please configure SMTP settings.');
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: config.smtp_username && config.smtp_password ? {
          user: config.smtp_username,
          pass: config.smtp_password,
        } : undefined,
      });

      this.isConfigured = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Reload transporter configuration (call after updating email config)
   */
  public reloadConfig(): void {
    this.initializeTransporter();
  }

  /**
   * Check if email service is configured and ready
   */
  public isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Send an email
   */
  public async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      const config = getEmailConfig();
      if (!config) {
        throw new Error('Email configuration not found');
      }

      const mailOptions = {
        from: `"${config.from_name}" <${config.from_email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      const info = await this.transporter!.sendMail(mailOptions);

      console.log('Email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Send multiple emails (batch)
   */
  public async sendBatchEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);

      // Add a small delay between emails to avoid rate limiting
      await this.delay(100);
    }

    return results;
  }

  /**
   * Test email configuration
   */
  public async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.transporter!.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  /**
   * Send a test email to verify configuration
   */
  public async sendTestEmail(toEmail: string): Promise<EmailResult> {
    return this.sendEmail({
      to: toEmail,
      subject: 'CMMS - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Email Successful!</h2>
          <p>This is a test email from your CMMS system.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Sent by CMMS Notification System at ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });
  }

  /**
   * Log notification attempt to database
   */
  public logNotification(
    userId: number,
    type: 'email' | 'sms' | 'push',
    event: string,
    subject: string,
    body: string,
    status: 'sent' | 'failed' | 'pending',
    errorMessage?: string
  ): void {
    try {
      db.prepare(`
        INSERT INTO notification_logs (
          user_id, type, event, subject, body, status, sent_at, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        type,
        event,
        subject,
        body,
        status,
        status === 'sent' ? new Date().toISOString() : null,
        errorMessage || null
      );
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Convert HTML to plain text (basic implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Delay helper for batch sending
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
