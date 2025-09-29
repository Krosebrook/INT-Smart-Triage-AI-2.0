import * as Sentry from '@sentry/node';

/**
 * Log levels enum
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info', 
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Base log entry structure
 */
interface LogEntry {
  ts: string;
  level: LogLevel;
  event: string;
  props?: Record<string, any>;
}

/**
 * Sensitive fields that should be redacted in logs
 */
const SENSITIVE_FIELDS = [
  'userId',
  'user_id',
  'password',
  'token',
  'authorization',
  'cookie',
  'sessionid',  // Changed from 'session' to be more specific
  'sessiontoken',
  'inquiry',
  'content',
  'message',
  'body'
];

/**
 * Headers that should be redacted
 */
const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'x-session-id'
];

/**
 * Redacts sensitive information from an object
 * @param obj Object to redact
 * @param depth Current recursion depth to prevent infinite loops
 * @param seen Set to track circular references
 * @returns Redacted object
 */
function redactSensitiveData(obj: any, depth = 0, seen = new WeakSet()): any {
  if (depth > 5 || obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    if (typeof obj === 'string' && obj.length > 50 && /[a-zA-Z]/.test(obj)) {
      return `[REDACTED: ${obj.length} chars]`;
    }
    return obj;
  }

  // Handle circular references
  if (seen.has(obj)) {
    return '[CIRCULAR_REFERENCE]';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1, seen));
  }

  const redacted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if this is a sensitive field - improved matching
    const isSensitiveField = SENSITIVE_FIELDS.some(field => {
      const lowerField = field.toLowerCase();
      return lowerKey === lowerField || lowerKey.includes(lowerField);
    });
    
    if (isSensitiveField) {
      redacted[key] = typeof value === 'string' 
        ? `[REDACTED: ${value.length} chars]`
        : '[REDACTED]';
    }
    // Special handling for headers object
    else if (lowerKey === 'headers' && typeof value === 'object' && value !== null) {
      redacted[key] = redactHeaders(value);
    }
    else {
      redacted[key] = redactSensitiveData(value, depth + 1, seen);
    }
  }
  
  return redacted;
}

/**
 * Redacts sensitive headers
 * @param headers Headers object to redact
 * @returns Redacted headers object
 */
function redactHeaders(headers: Record<string, any>): Record<string, any> {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }

  const redacted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_HEADERS.includes(lowerKey)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private static instance: Logger;
  private sentryInitialized = false;

  private constructor() {
    this.initSentry();
  }

  /**
   * Get singleton logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Initialize Sentry if SENTRY_DSN is provided
   */
  private initSentry(): void {
    const sentryDsn = process.env.SENTRY_DSN;
    
    if (sentryDsn) {
      try {
        Sentry.init({
          dsn: sentryDsn,
          environment: process.env.NODE_ENV || 'development',
          beforeSend(event) {
            // Redact sensitive data in Sentry events
            if (event.extra) {
              event.extra = redactSensitiveData(event.extra);
            }
            if (event.contexts && event.contexts.request) {
              event.contexts.request = redactSensitiveData(event.contexts.request);
            }
            return event;
          }
        });
        this.sentryInitialized = true;
        this.log(LogLevel.INFO, 'sentry.initialized', { 
          environment: process.env.NODE_ENV || 'development' 
        });
      } catch (error) {
        this.log(LogLevel.ERROR, 'sentry.init.failed', { 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Core logging method that outputs JSON lines
   * @param level Log level
   * @param event Event name/type
   * @param props Additional properties
   */
  private log(level: LogLevel, event: string, props?: Record<string, any>): void {
    let redactedProps: any;
    
    try {
      redactedProps = props ? redactSensitiveData(props) : undefined;
    } catch (error) {
      // If redaction fails (e.g., due to circular references), use a safe fallback
      redactedProps = { error: 'Failed to redact sensitive data' };
    }

    const logEntry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      event,
      props: redactedProps
    };

    try {
      // Output as JSON line
      console.log(JSON.stringify(logEntry));
    } catch (error) {
      // If JSON.stringify fails, output a safe version
      console.log(JSON.stringify({
        ts: logEntry.ts,
        level: logEntry.level,
        event: logEntry.event,
        props: { error: 'Failed to serialize log entry' }
      }));
    }

    // Send to Sentry for error and warn levels
    if (this.sentryInitialized && (level === LogLevel.ERROR || level === LogLevel.WARN)) {
      if (level === LogLevel.ERROR) {
        Sentry.captureException(new Error(event), {
          level: 'error',
          extra: logEntry.props
        });
      } else {
        Sentry.captureMessage(event, {
          level: 'warning',
          extra: logEntry.props
        });
      }
    }
  }

  /**
   * Log debug message
   */
  public debug(event: string, props?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, event, props);
  }

  /**
   * Log info message
   */
  public info(event: string, props?: Record<string, any>): void {
    this.log(LogLevel.INFO, event, props);
  }

  /**
   * Log warning message
   */
  public warn(event: string, props?: Record<string, any>): void {
    this.log(LogLevel.WARN, event, props);
  }

  /**
   * Log error message
   */
  public error(event: string, props?: Record<string, any>): void {
    this.log(LogLevel.ERROR, event, props);
  }
}

/**
 * Default logger instance
 */
export const logger = Logger.getInstance();

/**
 * Convenience method for quick access to logger
 */
export default logger;