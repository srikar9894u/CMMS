import db from './database';

export interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username?: string;
  smtp_password?: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
}

/**
 * Get active email configuration from database
 * Falls back to environment variables if no config in database
 */
export const getEmailConfig = (): EmailConfig | null => {
  try {
    // Try to get from database first
    const config = db.prepare(`
      SELECT * FROM email_config WHERE is_active = 1 LIMIT 1
    `).get() as EmailConfig | undefined;

    if (config) {
      return config;
    }

    // Fallback to environment variables
    const envConfig = {
      smtp_host: process.env.SMTP_HOST || '',
      smtp_port: parseInt(process.env.SMTP_PORT || '587'),
      smtp_secure: process.env.SMTP_SECURE === 'true',
      smtp_username: process.env.SMTP_USERNAME,
      smtp_password: process.env.SMTP_PASSWORD,
      from_email: process.env.SMTP_FROM_EMAIL || 'noreply@cmms.local',
      from_name: process.env.SMTP_FROM_NAME || 'CMMS',
      is_active: true,
    };

    // Only return env config if SMTP host is configured
    if (envConfig.smtp_host) {
      return envConfig;
    }

    return null;
  } catch (error) {
    console.error('Error loading email config:', error);
    return null;
  }
};

/**
 * Save email configuration to database
 */
export const saveEmailConfig = (config: Omit<EmailConfig, 'is_active'>): void => {
  // Deactivate all existing configs
  db.prepare(`UPDATE email_config SET is_active = 0`).run();

  // Insert new config
  db.prepare(`
    INSERT INTO email_config (
      smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password,
      from_email, from_name, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    config.smtp_host,
    config.smtp_port,
    config.smtp_secure ? 1 : 0,
    config.smtp_username || null,
    config.smtp_password || null,
    config.from_email,
    config.from_name
  );
};

/**
 * Test email configuration by attempting to create a transporter
 */
export const testEmailConfig = async (config: EmailConfig): Promise<boolean> => {
  const nodemailer = require('nodemailer');

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      auth: config.smtp_username && config.smtp_password ? {
        user: config.smtp_username,
        pass: config.smtp_password,
      } : undefined,
    });

    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email config test failed:', error);
    return false;
  }
};

/**
 * Get default email configuration template
 */
export const getDefaultEmailConfig = (): Partial<EmailConfig> => {
  return {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: false,
    from_email: 'noreply@cmms.local',
    from_name: 'CMMS',
  };
};
