/**
 * Centralized Logging Utility for INT Smart Triage AI 2.0
 * Provides structured logging with request context and appropriate levels
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Configure Winston logger with appropriate transports
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'INT-Smart-Triage-AI-2.0' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// In production, also log to files or external service
if (process.env.NODE_ENV === 'production') {
  // Add file transport for production
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

/**
 * Generate a unique request ID for correlation
 */
export function generateRequestId() {
  return uuidv4();
}

/**
 * Create context-aware logger with request metadata
 */
export function createContextLogger(requestId, userId = null, endpoint = null) {
  return {
    info: (message, meta = {}) => {
      logger.info(message, {
        requestId,
        userId,
        endpoint,
        ...meta
      });
    },
    warn: (message, meta = {}) => {
      logger.warn(message, {
        requestId,
        userId,
        endpoint,
        ...meta
      });
    },
    error: (message, error = null, meta = {}) => {
      logger.error(message, {
        requestId,
        userId,
        endpoint,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : null,
        ...meta
      });
    },
    debug: (message, meta = {}) => {
      logger.debug(message, {
        requestId,
        userId,
        endpoint,
        ...meta
      });
    }
  };
}

/**
 * Log API request details
 */
export function logRequest(contextLogger, req) {
  contextLogger.info('API Request received', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    contentType: req.headers['content-type'],
    timestamp: new Date().toISOString()
  });
}

/**
 * Log API response details
 */
export function logResponse(contextLogger, res, statusCode, responseTime = null) {
  const level = statusCode >= 400 ? 'warn' : 'info';
  contextLogger[level]('API Response sent', {
    statusCode,
    responseTime: responseTime ? `${responseTime}ms` : null,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log critical errors with full context
 */
export function logCriticalError(contextLogger, error, additionalContext = {}) {
  contextLogger.error('Critical error occurred', error, {
    severity: 'critical',
    requiresInvestigation: true,
    timestamp: new Date().toISOString(),
    ...additionalContext
  });
}

export default logger;