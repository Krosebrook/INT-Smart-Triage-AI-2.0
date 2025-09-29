/**
 * INT Smart Triage AI 2.0
 * Main application entry point for server-side operations
 */

import { APP_CONFIG } from './config/app-config.js';

/**
 * Main application class
 */
export class TriageApplication {
  constructor() {
    this.version = '2.0.0';
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.initialized) {
      return this.getStatus();
    }

    console.log(`INT Smart Triage AI ${this.version} - Initializing...`);
    
    // TODO: Add server-side initialization logic here
    // - Database connections
    // - API route setup
    // - Service configurations
    
    this.initialized = true;
    console.log(`INT Smart Triage AI ${this.version} - Ready`);
    
    return this.getStatus();
  }

  /**
   * Get application status
   * @returns {object} Application status
   */
  getStatus() {
    return {
      name: 'INT Smart Triage AI',
      version: this.version,
      initialized: this.initialized,
      config: {
        environment: process.env.NODE_ENV || 'development',
        apiBaseUrl: APP_CONFIG.API.BASE_URL,
        mockDelayMs: APP_CONFIG.API.MOCK_DELAY_MS
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start the application
   */
  async start() {
    const status = await this.initialize();
    console.log('Application Status:', JSON.stringify(status, null, 2));
    return status;
  }
}

// Default export for main application function
export default function main() {
  const app = new TriageApplication();
  return app.start();
}

// Make the function executable when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(_status => {
    console.log('INT Smart Triage AI 2.0 - Successfully started');
  }).catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}
