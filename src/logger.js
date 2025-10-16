/**
 * Centralized Logging Utility
 *
 * Provides structured logging with different severity levels and configurable output.
 * Replaces console.* statements for better control and consistency.
 *
 * @module logger
 * @since 2.0.0
 */

/**
 * Log levels in order of severity
 * @enum {string}
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Logger configuration
 * @private
 */
const config = {
  level: LogLevel.INFO,
  enabled: true,
  includeTimestamp: true,
  includeContext: true,
};

/**
 * ANSI color codes for terminal output
 * @private
 */
const colors = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

/**
 * Log level severity ordering for filtering
 * @private
 */
const levelOrder = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Format a log message with timestamp and level
 *
 * @private
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context data
 * @returns {string} Formatted log message
 */
function formatMessage(level, message, context) {
  const parts = [];

  if (config.includeTimestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }

  parts.push(`[${level.toUpperCase()}]`);
  parts.push(message);

  if (config.includeContext && context && Object.keys(context).length > 0) {
    parts.push(JSON.stringify(context, null, 2));
  }

  return parts.join(' ');
}

/**
 * Check if a log level should be output based on current configuration
 *
 * @private
 * @param {string} level - Log level to check
 * @returns {boolean} Whether the level should be logged
 */
function shouldLog(level) {
  if (!config.enabled) return false;
  return levelOrder[level] >= levelOrder[config.level];
}

/**
 * Core logging function
 *
 * @private
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context data
 */
function log(level, message, context) {
  if (!shouldLog(level)) return;

  const formattedMessage = formatMessage(level, message, context);
  const color = colors[level] || '';
  const reset = colors.reset;

  // Use appropriate console method
  // eslint-disable-next-line no-console
  switch (level) {
    case LogLevel.ERROR:
      // eslint-disable-next-line no-console
      console.error(`${color}${formattedMessage}${reset}`);
      break;
    case LogLevel.WARN:
      // eslint-disable-next-line no-console
      console.warn(`${color}${formattedMessage}${reset}`);
      break;
    case LogLevel.INFO:
      // eslint-disable-next-line no-console
      console.info(`${color}${formattedMessage}${reset}`);
      break;
    case LogLevel.DEBUG:
    default:
      // eslint-disable-next-line no-console
      console.log(`${color}${formattedMessage}${reset}`);
      break;
  }
}

/**
 * Logger instance with public API
 */
export const logger = {
  /**
   * Log a debug message (lowest severity)
   *
   * Use for detailed debugging information, typically only needed during development.
   *
   * @param {string} message - Debug message
   * @param {Object} [context] - Additional context data
   *
   * @example
   * logger.debug('Processing customer profile', { customerId: '12345' });
   */
  debug(message, context) {
    log(LogLevel.DEBUG, message, context);
  },

  /**
   * Log an informational message
   *
   * Use for general informational messages about application operation.
   *
   * @param {string} message - Info message
   * @param {Object} [context] - Additional context data
   *
   * @example
   * logger.info('Ticket assigned successfully', { reportId: 'TR-001' });
   */
  info(message, context) {
    log(LogLevel.INFO, message, context);
  },

  /**
   * Log a warning message
   *
   * Use for potentially harmful situations that should be investigated.
   *
   * @param {string} message - Warning message
   * @param {Object} [context] - Additional context data
   *
   * @example
   * logger.warn('Database query slow', { duration: 5000, query: 'SELECT...' });
   */
  warn(message, context) {
    log(LogLevel.WARN, message, context);
  },

  /**
   * Log an error message (highest severity)
   *
   * Use for error events that might still allow the application to continue running.
   *
   * @param {string} message - Error message
   * @param {Object} [context] - Additional context data
   *
   * @example
   * logger.error('Failed to fetch customer profile', {
   *   customerId: '12345',
   *   error: error.message
   * });
   */
  error(message, context) {
    log(LogLevel.ERROR, message, context);
  },

  /**
   * Configure the logger
   *
   * @param {Object} options - Configuration options
   * @param {string} [options.level] - Minimum log level to output
   * @param {boolean} [options.enabled] - Enable/disable logging
   * @param {boolean} [options.includeTimestamp] - Include timestamp in logs
   * @param {boolean} [options.includeContext] - Include context data in logs
   *
   * @example
   * logger.configure({
   *   level: LogLevel.WARN,
   *   enabled: true,
   *   includeTimestamp: true
   * });
   */
  configure(options) {
    Object.assign(config, options);
  },

  /**
   * Get current logger configuration
   *
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...config };
  },

  /**
   * Enable logging
   */
  enable() {
    config.enabled = true;
  },

  /**
   * Disable logging
   */
  disable() {
    config.enabled = false;
  },
};

/**
 * Default export for convenience
 *
 * @example
 * import logger from './logger.js';
 * logger.info('Application started');
 */
export default logger;
