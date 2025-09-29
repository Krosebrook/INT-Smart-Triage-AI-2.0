/**
 * Centralized Error Handling Middleware for INT Smart Triage AI 2.0
 * Provides standardized error responses and prevents sensitive information exposure
 */

import { logCriticalError } from './logger.js';

/**
 * Standard error response structure
 */
export const createErrorResponse = (status, message, details = null, requestId = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
    requestId
  };

  // Only include details in development or for specific error types
  if (details && (process.env.NODE_ENV === 'development' || status === 'validation_error')) {
    response.details = details;
  }

  return response;
};

/**
 * Error type definitions for consistent handling
 */
export const ErrorTypes = {
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  NOT_FOUND: 'not_found',
  RATE_LIMIT: 'rate_limit_exceeded',
  DATABASE_ERROR: 'database_error',
  EXTERNAL_SERVICE_ERROR: 'external_service_error',
  INTERNAL_SERVER_ERROR: 'internal_server_error'
};

/**
 * HTTP status codes for different error types
 */
export const ErrorStatusCodes = {
  [ErrorTypes.VALIDATION_ERROR]: 400,
  [ErrorTypes.AUTHENTICATION_ERROR]: 401,
  [ErrorTypes.AUTHORIZATION_ERROR]: 403,
  [ErrorTypes.NOT_FOUND]: 404,
  [ErrorTypes.RATE_LIMIT]: 429,
  [ErrorTypes.DATABASE_ERROR]: 500,
  [ErrorTypes.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorTypes.INTERNAL_SERVER_ERROR]: 500
};

/**
 * User-friendly error messages (safe for client exposure)
 */
export const ErrorMessages = {
  [ErrorTypes.VALIDATION_ERROR]: 'The provided data is invalid or incomplete',
  [ErrorTypes.AUTHENTICATION_ERROR]: 'Authentication required',
  [ErrorTypes.AUTHORIZATION_ERROR]: 'Access denied',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found',
  [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please try again later',
  [ErrorTypes.DATABASE_ERROR]: 'A database error occurred',
  [ErrorTypes.EXTERNAL_SERVICE_ERROR]: 'An external service error occurred',
  [ErrorTypes.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred'
};

/**
 * Create a standardized API error
 */
export class APIError extends Error {
  constructor(type, message = null, details = null, originalError = null) {
    super(message || ErrorMessages[type]);
    this.name = 'APIError';
    this.type = type;
    this.statusCode = ErrorStatusCodes[type];
    this.details = details;
    this.originalError = originalError;
  }
}

/**
 * Central error handling function for API endpoints
 */
export function handleApiError(error, req, res, contextLogger, requestId) {
  let statusCode = 500;
  let errorType = ErrorTypes.INTERNAL_SERVER_ERROR;
  let message = ErrorMessages[ErrorTypes.INTERNAL_SERVER_ERROR];
  let details = null;

  // Handle different error types
  if (error instanceof APIError) {
    statusCode = error.statusCode;
    errorType = error.type;
    message = error.message;
    details = error.details;
    
    // Log based on severity
    if (statusCode >= 500) {
      logCriticalError(contextLogger, error.originalError || error, {
        errorType,
        requestBody: req.body,
        endpoint: req.url
      });
    } else {
      contextLogger.warn(`API Error: ${errorType}`, {
        errorType,
        statusCode,
        details: error.details
      });
    }
  } else {
    // Handle unexpected errors
    logCriticalError(contextLogger, error, {
      errorType: 'unhandled_error',
      requestBody: req.body,
      endpoint: req.url,
      userAgent: req.headers['user-agent']
    });
  }

  // Create standardized error response
  const errorResponse = createErrorResponse(
    errorType, 
    message, 
    details, 
    requestId
  );

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  return res.status(statusCode).json(errorResponse);
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      // This should be handled by the individual route handlers
      // using handleApiError, but this is a safety net
      console.error('Unhandled error in async handler:', error);
      
      const errorResponse = createErrorResponse(
        ErrorTypes.INTERNAL_SERVER_ERROR,
        ErrorMessages[ErrorTypes.INTERNAL_SERVER_ERROR],
        null,
        req.requestId
      );
      
      return res.status(500).json(errorResponse);
    }
  };
}

/**
 * Validation helper functions
 */
export const ValidationHelpers = {
  /**
   * Validate required fields in request body
   */
  validateRequiredFields(body, requiredFields) {
    const missing = requiredFields.filter(field => !body[field]);
    if (missing.length > 0) {
      throw new APIError(
        ErrorTypes.VALIDATION_ERROR,
        'Required fields are missing',
        { missingFields: missing }
      );
    }
  },

  /**
   * Validate field values against allowed options
   */
  validateFieldOptions(value, allowedOptions, fieldName) {
    if (!allowedOptions.includes(value)) {
      throw new APIError(
        ErrorTypes.VALIDATION_ERROR,
        `Invalid ${fieldName}`,
        { 
          provided: value, 
          allowed: allowedOptions 
        }
      );
    }
  }
};

export default {
  APIError,
  ErrorTypes,
  handleApiError,
  asyncHandler,
  ValidationHelpers,
  createErrorResponse
};