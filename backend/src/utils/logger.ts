import db from '../config/database';

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

interface LogOptions {
  level: LogLevel;
  source: string;
  message: string;
  details?: string | object;
  userId?: number;
  ipAddress?: string;
}

/**
 * Log application events to database
 */
export function logToDatabase(options: LogOptions) {
  try {
    const { level, source, message, details, userId, ipAddress } = options;

    // Convert details object to JSON string if it's an object
    const detailsString = details
      ? typeof details === 'object'
        ? JSON.stringify(details)
        : details
      : null;

    db.prepare(`
      INSERT INTO application_logs (log_level, source, message, details, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      level,
      source,
      message,
      detailsString,
      userId || null,
      ipAddress || null
    );
  } catch (error) {
    // Fallback to console if database logging fails
    console.error('Failed to log to database:', error);
    console.error('Original log:', options);
  }
}

/**
 * Log error with details
 */
export function logError(source: string, message: string, error: any, userId?: number, ipAddress?: string) {
  logToDatabase({
    level: 'ERROR',
    source,
    message,
    details: {
      error: error.message || String(error),
      stack: error.stack || undefined,
      ...((error.response && error.response.data) ? { response: error.response.data } : {})
    },
    userId,
    ipAddress
  });

  // Also log to console for development
  console.error(`[${source}] ${message}:`, error);
}

/**
 * Log warning
 */
export function logWarning(source: string, message: string, details?: string | object, userId?: number, ipAddress?: string) {
  logToDatabase({
    level: 'WARN',
    source,
    message,
    details,
    userId,
    ipAddress
  });

  console.warn(`[${source}] ${message}`, details || '');
}

/**
 * Log info
 */
export function logInfo(source: string, message: string, details?: string | object, userId?: number, ipAddress?: string) {
  logToDatabase({
    level: 'INFO',
    source,
    message,
    details,
    userId,
    ipAddress
  });

  console.log(`[${source}] ${message}`, details || '');
}

/**
 * Log debug
 */
export function logDebug(source: string, message: string, details?: string | object, userId?: number, ipAddress?: string) {
  logToDatabase({
    level: 'DEBUG',
    source,
    message,
    details,
    userId,
    ipAddress
  });

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[${source}] ${message}`, details || '');
  }
}

/**
 * Express error handler middleware with logging
 */
export function errorLogger(source: string) {
  return (error: any, userId?: number, ipAddress?: string) => {
    logError(source, error.message || 'An error occurred', error, userId, ipAddress);
  };
}
