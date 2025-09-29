/**
 * Utility functions for the INT Smart Triage AI 2.0 application
 */

/**
 * Creates a delay using setTimeout wrapped in a Promise
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely gets a value from a nested object using dot notation
 * @param {object} obj - Object to search
 * @param {string} path - Dot-notated path (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path not found
 * @returns {any}
 */
export function safeGet(obj, path, defaultValue = null) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
}

/**
 * Checks if a string contains any of the provided keywords (case-insensitive)
 * @param {string} text - Text to search
 * @param {string[]} keywords - Keywords to search for
 * @returns {boolean}
 */
export function containsKeywords(text, keywords) {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string}
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates a random ticket ID
 * @returns {string}
 */
export function generateTicketId() {
  return `TKT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

/**
 * Validates that an object has all required fields
 * @param {object} obj - Object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateRequiredFields(obj, requiredFields) {
  for (const field of requiredFields) {
    if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
      return `${capitalize(field)} is required`;
    }
  }
  return null;
}