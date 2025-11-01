/**
 * Integration-specific error classes for consistent error handling
 */

const DEFAULT_STATUS = 500;

class IntegrationError extends Error {
  constructor(message, { cause, statusCode = DEFAULT_STATUS, details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class IntegrationConfigError extends IntegrationError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode ?? 500 });
  }
}

class IntegrationValidationError extends IntegrationError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode ?? 400 });
  }
}

class IntegrationAuthError extends IntegrationError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode ?? 401 });
  }
}

class IntegrationSecretError extends IntegrationError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode ?? 500 });
  }
}

class IntegrationNotFoundError extends IntegrationError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode ?? 404 });
  }
}

export {
  IntegrationError,
  IntegrationConfigError,
  IntegrationValidationError,
  IntegrationAuthError,
  IntegrationSecretError,
  IntegrationNotFoundError
};
