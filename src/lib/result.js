/**
 * Standardized Result Types and Error Handling
 *
 * Provides consistent result types for all service operations,
 * enabling predictable error handling across the application.
 *
 * @module lib/result
 * @since 2.1.0
 */

/**
 * @typedef {Object} Result
 * @property {boolean} success - Whether the operation succeeded
 * @property {*} [data] - Result data (present on success)
 * @property {string} [error] - Error message (present on failure)
 * @property {string} [code] - Error code for programmatic handling
 */

/**
 * Create a successful result.
 *
 * When an object is passed, its properties are spread at the top level
 * for backward compatibility. For primitives, use the `data` property.
 *
 * @template T
 * @param {T} data - The result data (object properties are spread)
 * @returns {{success: true, ...T}|{success: true, data: T}} Success result
 *
 * @example
 * return success({ user: { id: 1 }, count: 5 });
 * // Returns: { success: true, user: { id: 1 }, count: 5 }
 *
 * @example
 * return success([1, 2, 3]);
 * // Returns: { success: true, data: [1, 2, 3] }
 */
export function success(data) {
  // For objects (but not arrays or null), spread properties at top level
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    return { success: true, ...data };
  }
  // For primitives, arrays, and null, use data property
  return { success: true, data };
}

/**
 * Create a failure result.
 *
 * @param {string} error - Error message
 * @param {string} [code] - Error code for programmatic handling
 * @returns {{success: false, error: string, code?: string}} Failure result
 *
 * @example
 * return failure('User not found', 'USER_NOT_FOUND');
 */
export function failure(error, code = undefined) {
  const result = { success: false, error };
  if (code) {
    result.code = code;
  }
  return result;
}

/**
 * Standard error codes used across the application.
 *
 * @enum {string}
 */
export const ErrorCode = {
  // Configuration errors
  DATABASE_NOT_CONFIGURED: 'DATABASE_NOT_CONFIGURED',
  MISSING_CONFIGURATION: 'MISSING_CONFIGURATION',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Service errors
  SERVICE_ERROR: 'SERVICE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
};

/**
 * Check if a result is successful.
 *
 * @template T
 * @param {Result} result - Result to check
 * @returns {result is {success: true, data: T}} True if successful
 *
 * @example
 * const result = await getUser(id);
 * if (isSuccess(result)) {
 *   console.log(result.data);
 * }
 */
export function isSuccess(result) {
  return result && result.success === true;
}

/**
 * Check if a result is a failure.
 *
 * @param {Result} result - Result to check
 * @returns {result is {success: false, error: string}} True if failed
 *
 * @example
 * const result = await getUser(id);
 * if (isFailure(result)) {
 *   console.error(result.error);
 * }
 */
export function isFailure(result) {
  return result && result.success === false;
}

/**
 * Wrap an async function to catch errors and return a Result.
 *
 * @template T
 * @param {() => Promise<T>} fn - Async function to wrap
 * @param {string} [errorContext] - Context to add to error messages
 * @returns {Promise<Result>} Result containing data or error
 *
 * @example
 * const result = await tryCatch(
 *   () => database.query('SELECT * FROM users'),
 *   'Failed to fetch users'
 * );
 */
export async function tryCatch(fn, errorContext = '') {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    const message = errorContext
      ? `${errorContext}: ${error.message}`
      : error.message;
    return failure(message, ErrorCode.SERVICE_ERROR);
  }
}

/**
 * Create a database not configured error result.
 *
 * @returns {{success: false, error: string, code: string}} Failure result
 */
export function notConfigured() {
  return failure('Database not configured', ErrorCode.DATABASE_NOT_CONFIGURED);
}

/**
 * Create a validation error result.
 *
 * @param {string} message - Validation error message
 * @returns {{success: false, error: string, code: string}} Failure result
 */
export function validationError(message) {
  return failure(message, ErrorCode.VALIDATION_ERROR);
}

/**
 * Create a not found error result.
 *
 * @param {string} [resource='Resource'] - Name of the resource not found
 * @returns {{success: false, error: string, code: string}} Failure result
 */
export function notFound(resource = 'Resource') {
  return failure(`${resource} not found`, ErrorCode.NOT_FOUND);
}
