/**
 * Triage Service Module
 * Handles triage logic and API interactions
 */

import { APP_CONFIG } from '../config/app-config.js';
import { delay, containsKeywords, generateTicketId } from './utils.js';
import dataService from './data-service.js';

class TriageService {
  /**
   * Submit a triage request
   * @param {object} payload - Triage request payload
   * @returns {Promise<object>} Triage response
   */
  async submitTriage(payload) {
    // In production, this would make a real API call:
    // return this.callRealAPI(payload);
    
    // For demo purposes, use mock API
    return this.mockTriageAPI(payload);
  }

  /**
   * Mock API function for demonstration
   * In production, this would be: fetch('/api/triage', { method: 'POST', ... })
   * @param {object} payload - Request payload
   * @returns {Promise<object>} Mock response
   */
  async mockTriageAPI(payload) {
    // Simulate API delay
    await delay(APP_CONFIG.API.MOCK_DELAY_MS);
    
    // Mock response based on input
    const mockResponse = {
      success: true,
      ticket_id: generateTicketId(),
      priority: this.determinePriority(payload.ticket),
      category: this.determineCategory(payload.domain),
      sentiment: this.determineSentiment(payload.ticket),
      suggested_response: this.generateResponse(payload),
      kb_articles: dataService.findRelevantKBArticles(payload.domain),
      persona_context: payload.persona,
      processing_time_ms: Math.floor(Math.random() * 500) + 100,
      timestamp: new Date().toISOString()
    };
    
    return mockResponse;
  }

  /**
   * Determine ticket priority based on content
   * @param {string} ticket - Ticket content
   * @returns {string} Priority level
   */
  determinePriority(ticket) {
    if (containsKeywords(ticket, APP_CONFIG.PRIORITY_KEYWORDS.HIGH)) {
      return 'high';
    } else if (containsKeywords(ticket, APP_CONFIG.PRIORITY_KEYWORDS.MEDIUM)) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Determine category based on domain
   * @param {string} domain - Domain selection
   * @returns {string} Category name
   */
  determineCategory(domain) {
    const categories = {
      'technical': 'Technical Issue',
      'billing': 'Billing Inquiry',
      'general': 'General Support',
      'sales': 'Sales Question'
    };
    return categories[domain] || 'Uncategorized';
  }

  /**
   * Determine sentiment based on ticket content
   * @param {string} ticket - Ticket content
   * @returns {string} Sentiment classification
   */
  determineSentiment(ticket) {
    if (containsKeywords(ticket, APP_CONFIG.SENTIMENT_KEYWORDS.NEGATIVE)) {
      return 'negative';
    } else if (containsKeywords(ticket, APP_CONFIG.SENTIMENT_KEYWORDS.POSITIVE)) {
      return 'positive';
    }
    return 'neutral';
  }

  /**
   * Generate mock response based on payload
   * @param {object} payload - Request payload
   * @returns {string} Generated response
   */
  generateResponse(payload) {
    const persona = payload.persona;
    const salutation = this.getSalutation(payload.ticket);
    const body = this.getContentBody(payload.domain, persona);
    const signature = this.getSignature();
    return `${salutation}\n\n${body}\n\n${signature}`;
  }

  /**
   * Generate appropriate salutation
   * @param {string} ticket - Ticket content
   * @returns {string} Salutation
   */
  getSalutation(ticket) {
    if (ticket.includes('Mr.')) {
      return 'Dear Mr.';
    } else if (ticket.includes('Ms.')) {
      return 'Dear Ms.';
    }
    return 'Dear Valued Customer';
  }

  /**
   * Generate response body content
   * @param {string} domain - Domain
   * @param {object} persona - Selected persona
   * @returns {string} Response body
   */
  getContentBody(domain, persona) {
    const intro = `Thank you for contacting us regarding your ${domain} inquiry.`;
    const roleStatement = `As a ${persona.role}, I understand your ${domain} needs are important to you.`;
    const reviewStatement = persona.communication_style === 'formal'
      ? 'We have reviewed your request and'
      : "I've looked into your issue and";
    return `${intro} ${roleStatement}\n\n${reviewStatement} will provide you with the appropriate assistance.`;
  }

  /**
   * Generate signature
   * @returns {string} Signature
   */
  getSignature() {
    return 'Best regards,\nINT Customer Success Team';
  }

  /**
   * Real API call implementation (for production use)
   * @param {object} payload - Request payload
   * @returns {Promise<object>} API response
   */
  async callRealAPI(payload) {
    const response = await fetch(`${APP_CONFIG.API.BASE_URL}${APP_CONFIG.API.ENDPOINTS.TRIAGE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Triage API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Create and export a singleton instance
export const triageService = new TriageService();
export default triageService;