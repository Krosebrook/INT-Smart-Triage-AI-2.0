/**
 * Application Constants
 * Centralized configuration values
 */

// Health check configuration
export const HEALTH_CHECK_TIMEOUT = 3000; // 3 seconds
export const HEALTH_CHECK_CACHE_DURATION = 10000; // 10 seconds

// Service information
export const SERVICE_NAME = 'INT Smart Triage AI 2.0';
export const SERVICE_VERSION = '1.0.0';

// Valid customer tones
export const VALID_CUSTOMER_TONES = [
  'calm',
  'frustrated',
  'angry',
  'confused',
  'urgent',
];

// Priority keywords
export const HIGH_PRIORITY_KEYWORDS = [
  'down',
  'outage',
  'critical',
  'urgent',
  'broken',
  'not working',
  'crashed',
];

export const MEDIUM_PRIORITY_KEYWORDS = [
  'slow',
  'issue',
  'problem',
  'error',
  'bug',
];

export const LOW_PRIORITY_KEYWORDS = [
  'question',
  'help',
  'how to',
  'feature',
  'enhancement',
];

// Input validation limits
export const MAX_CUSTOMER_NAME_LENGTH = 100;
export const MAX_TICKET_SUBJECT_LENGTH = 200;
export const MAX_ISSUE_DESCRIPTION_LENGTH = 2000;
export const MAX_CSR_AGENT_LENGTH = 50;
