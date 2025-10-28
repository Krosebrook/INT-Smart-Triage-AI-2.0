/**
 * HubSpot CRM Integration Service
 *
 * Provides bidirectional synchronization between INT Smart Triage AI and HubSpot CRM:
 * - Contact management (create, update, search)
 * - Deal pipeline management
 * - Timeline tracking for customer interactions
 * - Custom property synchronization
 * - Sentiment and priority tracking
 *
 * @module HubSpotIntegration
 * @since 2.0.0
 */

import { supabase } from './supabaseClient.js';
import { logger } from './logger.js';

/**
 * HubSpot API base URL
 * @constant {string}
 */
const HUBSPOT_API_BASE = 'https://api.hubapi.com';

/**
 * HubSpot Integration Service
 *
 * @class HubSpotIntegration
 */
export class HubSpotIntegration {
  /**
   * Initialize HubSpot Integration Service
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.accessToken] - HubSpot access token (overrides env)
   * @param {string} [options.portalId] - HubSpot portal ID (overrides env)
   */
  constructor(options = {}) {
    /**
     * HubSpot access token
     * @type {string}
     * @private
     */
    this.accessToken = options.accessToken || process.env.HUBSPOT_ACCESS_TOKEN;

    /**
     * HubSpot portal ID
     * @type {string}
     * @private
     */
    this.portalId = options.portalId || process.env.HUBSPOT_PORTAL_ID;

    /**
     * Integration enabled status
     * @type {boolean}
     * @private
     */
    this.enabled = Boolean(this.accessToken && this.portalId);

    if (!this.enabled) {
      logger.warn('HubSpot integration not configured - sync disabled');
    }
  }

  /**
   * Make authenticated request to HubSpot API
   *
   * @async
   * @private
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} [options={}] - Fetch options
   * @returns {Promise<Object>} API response
   * @throws {Error} If request fails
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.enabled) {
      throw new Error('HubSpot integration not configured');
    }

    const url = `${HUBSPOT_API_BASE}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('HubSpot API request failed', {
        endpoint,
        status: response.status,
        error: errorText,
      });
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // ============================================================================
  // Contact Management
  // ============================================================================

  /**
   * Create or update contact in HubSpot
   *
   * @async
   * @param {Object} customerData - Customer profile data
   * @param {string} customerData.customer_id - Internal customer ID
   * @param {string} customerData.email - Customer email
   * @param {string} [customerData.name] - Customer name
   * @param {string} [customerData.phone] - Customer phone
   * @param {string} [customerData.company] - Customer company
   * @returns {Promise<Object>} Sync result
   * @returns {boolean} return.success - Whether sync succeeded
   * @returns {string} [return.hubspotContactId] - HubSpot contact ID
   *
   * @example
   * const result = await hubspot.syncContact({
   *   customer_id: 'CUST-123',
   *   email: 'customer@example.com',
   *   name: 'Jane Doe',
   *   company: 'Acme Corp'
   * });
   */
  async syncContact(customerData) {
    try {
      // Check if contact already exists in sync table
      const { data: syncRecord } = await supabase
        .from('hubspot_contacts_sync')
        .select('*')
        .eq('customer_id', customerData.customer_id)
        .single();

      // Prepare contact properties for HubSpot
      const properties = {
        email: customerData.email,
        firstname: this.extractFirstName(customerData.name),
        lastname: this.extractLastName(customerData.name),
        phone: customerData.phone || '',
        company: customerData.company || '',
        int_customer_id: customerData.customer_id, // Custom property
      };

      let hubspotContactId;
      let operation;

      if (syncRecord && syncRecord.hubspot_contact_id) {
        // Update existing contact
        operation = 'update';
        hubspotContactId = syncRecord.hubspot_contact_id;

        await this.makeRequest(`/crm/v3/objects/contacts/${hubspotContactId}`, {
          method: 'PATCH',
          body: JSON.stringify({ properties }),
        });
      } else {
        // Create new contact or find by email
        operation = 'create';

        try {
          // Try to find existing contact by email
          const searchResult = await this.findContactByEmail(
            customerData.email
          );
          if (searchResult) {
            hubspotContactId = searchResult.id;
            // Update found contact
            await this.makeRequest(
              `/crm/v3/objects/contacts/${hubspotContactId}`,
              {
                method: 'PATCH',
                body: JSON.stringify({ properties }),
              }
            );
          } else {
            // Create new contact
            const createResult = await this.makeRequest(
              '/crm/v3/objects/contacts',
              {
                method: 'POST',
                body: JSON.stringify({ properties }),
              }
            );
            hubspotContactId = createResult.id;
          }
        } catch (error) {
          logger.error('Failed to create HubSpot contact', { error });
          throw error;
        }
      }

      // Update sync table
      await supabase.from('hubspot_contacts_sync').upsert({
        customer_id: customerData.customer_id,
        hubspot_contact_id: hubspotContactId,
        sync_status: 'synced',
        sync_direction: 'to_hubspot',
        last_synced_at: new Date().toISOString(),
        last_modified_source: 'int',
      });

      // Mark integration as successful
      await this.markSyncSuccess();

      logger.info(`HubSpot contact ${operation} successful`, {
        customerId: customerData.customer_id,
        hubspotContactId,
      });

      return {
        success: true,
        operation,
        hubspotContactId,
        customerId: customerData.customer_id,
      };
    } catch (error) {
      await this.logError('syncContact', error, {
        customer_id: customerData.customer_id,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find contact by email address
   *
   * @async
   * @param {string} email - Email address to search
   * @returns {Promise<Object|null>} Contact object or null if not found
   */
  async findContactByEmail(email) {
    try {
      const searchResult = await this.makeRequest(
        '/crm/v3/objects/contacts/search',
        {
          method: 'POST',
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: 'email',
                    operator: 'EQ',
                    value: email,
                  },
                ],
              },
            ],
          }),
        }
      );

      return searchResult.results?.[0] || null;
    } catch (error) {
      logger.warn('Failed to search HubSpot contact', { email, error });
      return null;
    }
  }

  /**
   * Get contact from HubSpot by ID
   *
   * @async
   * @param {string} hubspotContactId - HubSpot contact ID
   * @returns {Promise<Object>} Contact data
   */
  async getContact(hubspotContactId) {
    return await this.makeRequest(
      `/crm/v3/objects/contacts/${hubspotContactId}`
    );
  }

  // ============================================================================
  // Deal Management
  // ============================================================================

  /**
   * Create deal in HubSpot for high-priority tickets
   *
   * @async
   * @param {Object} dealData - Deal information
   * @param {string} dealData.reportId - Triage report ID
   * @param {string} dealData.customerName - Customer name
   * @param {string} dealData.ticketSubject - Ticket subject
   * @param {string} dealData.priority - Priority level
   * @param {string} [dealData.hubspotContactId] - Associated contact ID
   * @returns {Promise<Object>} Deal creation result
   *
   * @example
   * const deal = await hubspot.createDeal({
   *   reportId: 'TR-12345',
   *   customerName: 'Acme Corp',
   *   ticketSubject: 'Urgent: System down',
   *   priority: 'high',
   *   hubspotContactId: '12345'
   * });
   */
  async createDeal(dealData) {
    try {
      const properties = {
        dealname: `${dealData.customerName} - ${dealData.ticketSubject}`,
        dealstage: this.mapPriorityToDealStage(dealData.priority),
        pipeline: 'default',
        amount: this.estimateDealValue(dealData.priority),
        int_report_id: dealData.reportId, // Custom property
        int_priority: dealData.priority, // Custom property
        closedate: this.calculateCloseDate(dealData.priority),
      };

      const result = await this.makeRequest('/crm/v3/objects/deals', {
        method: 'POST',
        body: JSON.stringify({ properties }),
      });

      // Associate deal with contact if provided
      if (dealData.hubspotContactId) {
        await this.associateDealWithContact(
          result.id,
          dealData.hubspotContactId
        );
      }

      logger.info('HubSpot deal created', {
        dealId: result.id,
        reportId: dealData.reportId,
      });

      return {
        success: true,
        dealId: result.id,
        dealLink: `https://app.hubspot.com/contacts/${this.portalId}/deal/${result.id}`,
      };
    } catch (error) {
      await this.logError('createDeal', error, { reportId: dealData.reportId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update deal stage based on ticket resolution
   *
   * @async
   * @param {string} reportId - Triage report ID
   * @param {string} status - New status (resolved, in_progress, etc.)
   * @returns {Promise<Object>} Update result
   */
  async updateDealStage(reportId, status) {
    try {
      // Find deal by report ID (using custom property search)
      const searchResult = await this.makeRequest(
        '/crm/v3/objects/deals/search',
        {
          method: 'POST',
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: 'int_report_id',
                    operator: 'EQ',
                    value: reportId,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!searchResult.results?.[0]) {
        return { success: false, error: 'Deal not found' };
      }

      const dealId = searchResult.results[0].id;
      const dealStage = this.mapStatusToDealStage(status);

      await this.makeRequest(`/crm/v3/objects/deals/${dealId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          properties: {
            dealstage: dealStage,
          },
        }),
      });

      logger.info('HubSpot deal stage updated', { dealId, reportId, status });

      return { success: true, dealId, stage: dealStage };
    } catch (error) {
      await this.logError('updateDealStage', error, { reportId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Associate deal with contact
   *
   * @async
   * @private
   * @param {string} dealId - Deal ID
   * @param {string} contactId - Contact ID
   * @returns {Promise<void>}
   */
  async associateDealWithContact(dealId, contactId) {
    await this.makeRequest(
      `/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/deal_to_contact`,
      {
        method: 'PUT',
      }
    );
  }

  // ============================================================================
  // Timeline / Engagement Tracking
  // ============================================================================

  /**
   * Add timeline event to contact record
   *
   * @async
   * @param {Object} eventData - Event information
   * @param {string} eventData.hubspotContactId - Contact ID
   * @param {string} eventData.eventType - Event type (note, email, call, etc.)
   * @param {string} eventData.eventTitle - Event title
   * @param {string} eventData.eventBody - Event description
   * @returns {Promise<Object>} Timeline event creation result
   *
   * @example
   * await hubspot.addTimelineEvent({
   *   hubspotContactId: '12345',
   *   eventType: 'note',
   *   eventTitle: 'Support ticket created',
   *   eventBody: 'High priority ticket TR-12345 created'
   * });
   */
  async addTimelineEvent(eventData) {
    try {
      const engagement = {
        engagement: {
          active: true,
          type: this.mapEventTypeToEngagement(eventData.eventType),
          timestamp: Date.now(),
        },
        associations: {
          contactIds: [eventData.hubspotContactId],
        },
        metadata: {
          body: `${eventData.eventTitle}\n\n${eventData.eventBody}`,
        },
      };

      const result = await this.makeRequest('/engagements/v1/engagements', {
        method: 'POST',
        body: JSON.stringify(engagement),
      });

      logger.info('HubSpot timeline event created', {
        engagementId: result.engagement.id,
      });

      return { success: true, engagementId: result.engagement.id };
    } catch (error) {
      await this.logError('addTimelineEvent', error, eventData);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track triage report interaction in HubSpot timeline
   *
   * @async
   * @param {string} customerId - Internal customer ID
   * @param {string} reportId - Report ID
   * @param {string} priority - Priority level
   * @param {string} sentiment - Sentiment analysis result
   * @returns {Promise<Object>} Tracking result
   */
  async trackTriageInteraction(customerId, reportId, priority, sentiment) {
    try {
      // Get HubSpot contact ID from sync table
      const { data: syncRecord } = await supabase
        .from('hubspot_contacts_sync')
        .select('hubspot_contact_id')
        .eq('customer_id', customerId)
        .single();

      if (!syncRecord?.hubspot_contact_id) {
        return { success: false, error: 'Contact not synced to HubSpot' };
      }

      const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };

      return await this.addTimelineEvent({
        hubspotContactId: syncRecord.hubspot_contact_id,
        eventType: 'note',
        eventTitle: `Triage Report ${reportId} Created`,
        eventBody: `
${priorityEmoji[priority] || ''} Priority: ${priority.toUpperCase()}
Sentiment: ${sentiment}
Report ID: ${reportId}

A new triage report was created for this contact.
        `.trim(),
      });
    } catch (error) {
      await this.logError('trackTriageInteraction', error, {
        customerId,
        reportId,
      });
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Extract first name from full name
   *
   * @private
   * @param {string} fullName - Full name
   * @returns {string} First name
   */
  extractFirstName(fullName) {
    if (!fullName) return '';
    return fullName.split(' ')[0] || '';
  }

  /**
   * Extract last name from full name
   *
   * @private
   * @param {string} fullName - Full name
   * @returns {string} Last name
   */
  extractLastName(fullName) {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  /**
   * Map priority to HubSpot deal stage
   *
   * @private
   * @param {string} priority - Priority level (high/medium/low)
   * @returns {string} HubSpot deal stage
   */
  mapPriorityToDealStage(priority) {
    const stageMap = {
      high: 'appointmentscheduled',
      medium: 'qualifiedtobuy',
      low: 'presentationscheduled',
    };
    return stageMap[priority] || 'appointmentscheduled';
  }

  /**
   * Map status to HubSpot deal stage
   *
   * @private
   * @param {string} status - Ticket status
   * @returns {string} HubSpot deal stage
   */
  mapStatusToDealStage(status) {
    const stageMap = {
      new: 'appointmentscheduled',
      in_progress: 'qualifiedtobuy',
      resolved: 'closedwon',
      closed: 'closedwon',
    };
    return stageMap[status] || 'appointmentscheduled';
  }

  /**
   * Estimate deal value based on priority
   *
   * @private
   * @param {string} priority - Priority level
   * @returns {number} Estimated deal value
   */
  estimateDealValue(priority) {
    const valueMap = {
      high: 10000,
      medium: 5000,
      low: 2000,
    };
    return valueMap[priority] || 5000;
  }

  /**
   * Calculate expected close date based on priority
   *
   * @private
   * @param {string} priority - Priority level
   * @returns {string} Close date (ISO format)
   */
  calculateCloseDate(priority) {
    const daysToAdd = { high: 7, medium: 14, low: 30 };
    const days = daysToAdd[priority] || 14;
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + days);
    return closeDate.toISOString();
  }

  /**
   * Map event type to HubSpot engagement type
   *
   * @private
   * @param {string} eventType - Event type
   * @returns {string} HubSpot engagement type
   */
  mapEventTypeToEngagement(eventType) {
    const typeMap = {
      note: 'NOTE',
      email: 'EMAIL',
      call: 'CALL',
      meeting: 'MEETING',
      task: 'TASK',
    };
    return typeMap[eventType] || 'NOTE';
  }

  /**
   * Mark sync as successful
   *
   * @async
   * @private
   * @returns {Promise<void>}
   */
  async markSyncSuccess() {
    try {
      await supabase.rpc('mark_sync_success', {
        p_integration_type: 'hubspot',
      });
    } catch (error) {
      logger.warn('Failed to mark sync success', { error });
    }
  }

  /**
   * Log integration error
   *
   * @async
   * @private
   * @param {string} operation - Operation name
   * @param {Error} error - Error object
   * @param {Object} [context={}] - Additional context
   * @returns {Promise<void>}
   */
  async logError(operation, error, context = {}) {
    try {
      await supabase.from('integration_errors').insert({
        integration_type: 'hubspot',
        operation,
        error_message: error.message,
        stack_trace: error.stack,
        request_payload: context,
        severity: 'error',
      });

      await supabase.rpc('increment_integration_errors', {
        p_integration_type: 'hubspot',
        p_error_message: error.message,
      });
    } catch (logError) {
      logger.error('Failed to log integration error', { logError });
    }
  }

  /**
   * Check if integration is healthy
   *
   * @async
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    try {
      if (!this.enabled) {
        return {
          healthy: false,
          message: 'Integration not configured',
        };
      }

      // Test API connectivity
      await this.makeRequest('/crm/v3/objects/contacts?limit=1');

      return {
        healthy: true,
        message: 'HubSpot integration operational',
      };
    } catch (error) {
      return {
        healthy: false,
        message: error.message,
      };
    }
  }
}

/**
 * Singleton instance of HubSpot Integration
 *
 * @type {HubSpotIntegration}
 * @example
 * import { hubspotIntegration } from './hubspotIntegration.js';
 * await hubspotIntegration.syncContact(customerData);
 */
export const hubspotIntegration = new HubSpotIntegration();

export default hubspotIntegration;
