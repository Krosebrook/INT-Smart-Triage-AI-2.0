/**
 * UI Controller Module
 * Handles all DOM interactions and UI state management
 */

import { APP_CONFIG } from '../config/app-config.js';
import { validateRequiredFields } from '../src/utils.js';
import dataService from '../src/data-service.js';
import triageService from '../src/triage-service.js';

class UIController {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the UI controller
   */
  async initialize() {
    if (this.isInitialized) return;

    // Cache DOM elements
    this.cacheElements();
    
    // Set up event listeners
    this.setupEventListeners();

    // Initialize data and populate UI
    try {
      await dataService.initialize();
      this.populatePersonaSelect();
      this.isInitialized = true;
    } catch (error) {
      this.showError(`Failed to initialize application: ${error.message}`);
    }
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.elements = {
      form: {
        domain: document.getElementById('domain'),
        persona: document.getElementById('persona'),
        ticket: document.getElementById('ticket'),
        submitBtn: document.getElementById('submitBtn')
      },
      ui: {
        loading: document.getElementById('loading'),
        results: document.getElementById('results'),
        resultsContent: document.getElementById('resultsContent'),
        error: document.getElementById('error'),
        errorMessage: document.getElementById('errorMessage')
      }
    };
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Form submission
    if (this.elements.form.submitBtn) {
      this.elements.form.submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Enter key submission in textarea
    if (this.elements.form.ticket) {
      this.elements.form.ticket.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          this.handleSubmit();
        }
      });
    }
  }

  /**
   * Populate persona select dropdown
   */
  populatePersonaSelect() {
    const personaSelect = this.elements.form.persona;
    if (!personaSelect) return;

    // Clear existing options (except the first placeholder)
    personaSelect.innerHTML = '<option value="">Select Persona...</option>';

    // Add persona options
    const personas = dataService.getPersonas();
    personas.forEach(persona => {
      const option = document.createElement('option');
      option.value = persona.id;
      option.textContent = `${persona.name} - ${persona.role}`;
      personaSelect.appendChild(option);
    });
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    // Get form values
    const formData = this.getFormData();
    
    // Validate form
    const validationError = this.validateForm(formData);
    if (validationError) {
      this.showError(validationError);
      return;
    }

    // Find selected persona
    const selectedPersona = dataService.getPersonaById(formData.persona);
    if (!selectedPersona) {
      this.showError('Invalid persona selection');
      return;
    }

    // Show loading state
    this.showLoading();

    try {
      // Prepare request payload
      const payload = {
        ticket: formData.ticket.trim(),
        domain: formData.domain,
        persona: selectedPersona
      };

      // Submit triage request
      const response = await triageService.submitTriage(payload);
      
      // Display results
      this.showResults(response);
      
    } catch (error) {
      console.error('Triage request failed:', error);
      this.showError(`Triage request failed: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Get form data
   * @returns {object} Form data
   */
  getFormData() {
    return {
      domain: this.elements.form.domain?.value || '',
      persona: this.elements.form.persona?.value || '',
      ticket: this.elements.form.ticket?.value || ''
    };
  }

  /**
   * Validate form data
   * @param {object} formData - Form data to validate
   * @returns {string|null} Error message if invalid, null if valid
   */
  validateForm(formData) {
    // Check required fields
    const requiredFieldsError = validateRequiredFields(formData, APP_CONFIG.UI.FORM_VALIDATION.REQUIRED_FIELDS);
    if (requiredFieldsError) {
      return requiredFieldsError.replace('Persona', 'Please select a persona')
                                .replace('Domain', 'Please select a domain')
                                .replace('Ticket', 'Please enter ticket content');
    }

    return null;
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.elements.ui.loading?.classList.remove('hidden');
    this.elements.ui.results?.classList.add('hidden');
    this.elements.ui.error?.classList.add('hidden');
    if (this.elements.form.submitBtn) {
      this.elements.form.submitBtn.disabled = true;
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.elements.ui.loading?.classList.add('hidden');
    if (this.elements.form.submitBtn) {
      this.elements.form.submitBtn.disabled = false;
    }
  }

  /**
   * Show results
   * @param {object} data - Result data to display
   */
  showResults(data) {
    this.elements.ui.results?.classList.remove('hidden');
    this.elements.ui.error?.classList.add('hidden');
    if (this.elements.ui.resultsContent) {
      this.elements.ui.resultsContent.textContent = JSON.stringify(data, null, 2);
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    this.elements.ui.error?.classList.remove('hidden');
    this.elements.ui.results?.classList.add('hidden');
    if (this.elements.ui.errorMessage) {
      this.elements.ui.errorMessage.textContent = message;
    }
  }
}

// Create and export a singleton instance
export const uiController = new UIController();
export default uiController;