/**
 * Main Application Entry Point for Demo Interface
 * Initializes the INT Smart Triage AI 2.0 demo application
 */

import uiController from './ui-controller.js';

class TriageApp {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('Application is already initialized');
      return;
    }

    try {
      console.log('INT Smart Triage AI 2.0 - Initializing demo interface...');
      
      // Initialize UI controller
      await uiController.initialize();
      
      this.isInitialized = true;
      console.log('INT Smart Triage AI 2.0 - Demo interface ready');
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Get application status
   * @returns {object} Status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    };
  }
}

// Create application instance
const app = new TriageApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
  // DOM is already ready
  app.initialize();
}

// Export for potential external access
export default app;