/**
 * Environment Variable Utilities
 *
 * Provides a consistent way to access environment variables across
 * both Vite (browser) and Node.js environments.
 *
 * @module lib/env
 * @since 2.1.0
 */

/**
 * Get an environment variable value.
 *
 * Supports both Vite (import.meta.env) and Node.js (process.env) environments.
 *
 * @param {string} key - Environment variable name
 * @param {string} [defaultValue] - Default value if not found
 * @returns {string|undefined} Environment variable value or default
 *
 * @example
 * const apiUrl = getEnvVar('API_URL', 'http://localhost:3000');
 */
export function getEnvVar(key, defaultValue = undefined) {
  let value;

  // Try Vite environment first (browser)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    value = import.meta.env[key];
  }

  // Fall back to Node.js environment
  if (value === undefined && typeof process !== 'undefined' && process.env) {
    value = process.env[key];
  }

  return value !== undefined ? value : defaultValue;
}

/**
 * Check if a required environment variable is set.
 *
 * @param {string} key - Environment variable name
 * @returns {boolean} True if the variable is set and non-empty
 *
 * @example
 * if (!hasEnvVar('DATABASE_URL')) {
 *   console.warn('Database not configured');
 * }
 */
export function hasEnvVar(key) {
  const value = getEnvVar(key);
  return value !== undefined && value !== '';
}

/**
 * Get multiple environment variables at once.
 *
 * @param {string[]} keys - Array of environment variable names
 * @returns {Object.<string, string|undefined>} Object with variable names as keys
 *
 * @example
 * const { API_KEY, API_URL } = getEnvVars(['API_KEY', 'API_URL']);
 */
export function getEnvVars(keys) {
  const result = {};
  for (const key of keys) {
    result[key] = getEnvVar(key);
  }
  return result;
}

/**
 * Check if running in development mode.
 *
 * @returns {boolean} True if NODE_ENV is 'development' or not set
 */
export function isDevelopment() {
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  return nodeEnv === 'development';
}

/**
 * Check if running in production mode.
 *
 * @returns {boolean} True if NODE_ENV is 'production'
 */
export function isProduction() {
  return getEnvVar('NODE_ENV') === 'production';
}

/**
 * Check if running in test mode.
 *
 * @returns {boolean} True if NODE_ENV is 'test'
 */
export function isTest() {
  return getEnvVar('NODE_ENV') === 'test';
}
