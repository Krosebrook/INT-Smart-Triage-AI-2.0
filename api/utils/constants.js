/**
 * Application Constants
 * Centralized configuration values
 */

/**
 * Health check timeout in milliseconds
 * @constant {number}
 */
export const HEALTH_CHECK_TIMEOUT = 3000; // 3 seconds

/**
 * Health check cache duration in milliseconds
 * @constant {number}
 */
export const HEALTH_CHECK_CACHE_DURATION = 10000; // 10 seconds

/**
 * Service name for health check responses
 * @constant {string}
 */
export const SERVICE_NAME = 'INT Smart Triage AI 2.0';

/**
 * Service version
 * @constant {string}
 */
export const SERVICE_VERSION = '1.0.0';

/**
 * Valid customer tone values
 * @constant {string[]}
 */
export const VALID_CUSTOMER_TONES = [
  'calm',
  'frustrated',
  'angry',
  'confused',
  'urgent',
];

/**
 * Keywords indicating high priority issues
 * @constant {string[]}
 */
export const HIGH_PRIORITY_KEYWORDS = [
  'down',
  'outage',
  'critical',
  'urgent',
  'broken',
  'not working',
  'crashed',
];

/**
 * Keywords indicating medium priority issues
 * @constant {string[]}
 */
export const MEDIUM_PRIORITY_KEYWORDS = [
  'slow',
  'issue',
  'problem',
  'error',
  'bug',
];

/**
 * Keywords indicating low priority issues
 * @constant {string[]}
 */
export const LOW_PRIORITY_KEYWORDS = [
  'question',
  'help',
  'how to',
  'feature',
  'enhancement',
];

/**
 * Maximum length for customer name input
 * @constant {number}
 */
export const MAX_CUSTOMER_NAME_LENGTH = 100;

/**
 * Maximum length for ticket subject input
 * @constant {number}
 */
export const MAX_TICKET_SUBJECT_LENGTH = 200;

/**
 * Maximum length for issue description input
 * @constant {number}
 */
export const MAX_ISSUE_DESCRIPTION_LENGTH = 2000;

/**
 * Maximum length for CSR agent identifier
 * @constant {number}
 */
export const MAX_CSR_AGENT_LENGTH = 50;
