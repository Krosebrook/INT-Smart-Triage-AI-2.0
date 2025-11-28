/**
 * Shared Library Utilities
 *
 * Central export for all shared utilities and helpers.
 *
 * @module lib
 * @since 2.1.0
 */

// Environment utilities
export {
  getEnvVar,
  hasEnvVar,
  getEnvVars,
  isDevelopment,
  isProduction,
  isTest,
} from './env.js';

// Result types and error handling
export {
  success,
  failure,
  ErrorCode,
  isSuccess,
  isFailure,
  tryCatch,
  notConfigured,
  validationError,
  notFound,
} from './result.js';

// Dependency injection
export { Container, container } from './container.js';
