/**
 * Application Configuration
 * Centralized configuration for the INT Smart Triage AI 2.0 application
 */

export const APP_CONFIG = {
  // API Configuration
  API: {
    BASE_URL: '/api',
    ENDPOINTS: {
      TRIAGE: '/triage'
    },
    MOCK_DELAY_MS: 2000
  },

  // Data paths
  DATA_PATHS: {
    PERSONAS: '/data/personas.json',
    KNOWLEDGE_BASE: '/data/kb.json'
  },

  // UI Configuration
  UI: {
    MAX_KB_ARTICLES: 3,
    FORM_VALIDATION: {
      REQUIRED_FIELDS: ['domain', 'persona', 'ticket']
    }
  },

  // Priority keywords for mock classification
  PRIORITY_KEYWORDS: {
    HIGH: ['urgent', 'critical', 'down', 'outage', 'emergency'],
    MEDIUM: ['issue', 'problem', 'bug', 'error'],
    LOW: ['question', 'inquiry', 'request']
  },

  // Sentiment keywords for mock analysis
  SENTIMENT_KEYWORDS: {
    NEGATIVE: ['frustrated', 'angry', 'terrible', 'awful', 'hate'],
    POSITIVE: ['thank', 'great', 'happy', 'excellent', 'love'],
    NEUTRAL: []
  }
};

export default APP_CONFIG;