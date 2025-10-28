/**
 * Freshdesk Help Desk Integration Service
 *
 * Provides bidirectional synchronization between INT Smart Triage AI and Freshdesk:
 * - Ticket creation and updates
 * - Status synchronization
 * - Priority mapping
 * - Note/comment synchronization
 * - Knowledge base article access
 * - Agent assignment tracking
 *
 * @module FreshdeskIntegration
 * @since 2.0.0
 */

import { supabase } from './supabaseClient.js';
import { logger } from './logger.js';

/**
 * Freshdesk Integration Service
 *
 * @class FreshdeskIntegration
 */
export class FreshdeskIntegration {
  /**
   * Initialize Freshdesk Integration Service
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.domain] - Freshdesk domain (overrides env)
   * @param {string} [options.apiKey] - Freshdesk API key (overrides env)
   */
  constructor(options = {}) {
    /**
     * Freshdesk domain
     * @type {string}
     * @private
     */
    this.domain = options.domain || process.env.FRESHDESK_DOMAIN;

    /**
     * Freshdesk API key
     * @type {string}
     * @private
     */
    this.apiKey = options.apiKey || process.env.FRESHDESK_API_KEY;

    /**
     * Freshdesk API base URL
     * @type {string}
     * @private
     */
    this.apiBase = this.domain ? `https://${this.domain}/api/v2` : null;

    /**
     * Integration enabled status
     * @type {boolean}
     * @private
     */
    this.enabled = Boolean(this.domain && this.apiKey);

    if (!this.enabled) {
      logger.warn('Freshdesk integration not configured - sync disabled');
    }
  }

  /**
   * Make authenticated request to Freshdesk API
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
      throw new Error('Freshdesk integration not configured');
    }

    const url = `${this.apiBase}${endpoint}`;

    // Freshdesk uses Basic Auth with API key as username
    const authHeader = Buffer.from(`${this.apiKey}:X`).toString('base64');

    const headers = {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      logger.warn(`Freshdesk rate limit hit, retry after ${retryAfter}s`);
      throw new Error(`Rate limited, retry after ${retryAfter} seconds`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Freshdesk API request failed', {
        endpoint,
        status: response.status,
        error: errorText,
      });
      throw new Error(`Freshdesk API error: ${response.status} - ${errorText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  }

  // ============================================================================
  // Ticket Management
  // ============================================================================

  /**
   * Create ticket in Freshdesk from triage report
   *
   * @async
   * @param {Object} reportData - Triage report data
   * @param {string} reportData.report_id - Report ID
   * @param {string} reportData.customer_name - Customer name
   * @param {string} reportData.customer_email - Customer email
   * @param {string} reportData.ticket_subject - Ticket subject
   * @param {string} reportData.issue_description - Issue description
   * @param {string} reportData.priority - Priority (high/medium/low)
   * @param {string} reportData.department - Department
   * @param {string} [reportData.sentiment] - Sentiment analysis result
   * @returns {Promise<Object>} Ticket creation result
   * @returns {boolean} return.success - Whether creation succeeded
   * @returns {number} [return.ticketId] - Freshdesk ticket ID
   *
   * @example
   * const result = await freshdesk.createTicket({
   *   report_id: 'TR-12345',
   *   customer_name: 'John Doe',
   *   customer_email: 'john@example.com',
   *   ticket_subject: 'System access issue',
   *   issue_description: 'Cannot log into the system',
   *   priority: 'high',
   *   department: 'Technology'
   * });
   */
  async createTicket(reportData) {
    try {
      // Check if ticket already exists
      const { data: syncRecord } = await supabase
        .from('freshdesk_tickets_sync')
        .select('freshdesk_ticket_id')
        .eq('report_id', reportData.report_id)
        .single();

      if (syncRecord?.freshdesk_ticket_id) {
        logger.info('Ticket already synced to Freshdesk', {
          reportId: reportData.report_id,
          ticketId: syncRecord.freshdesk_ticket_id,
        });
        return {
          success: true,
          ticketId: syncRecord.freshdesk_ticket_id,
          alreadyExists: true,
        };
      }

      // Prepare ticket payload
      const ticketPayload = {
        name: reportData.customer_name,
        email: reportData.customer_email,
        subject: reportData.ticket_subject,
        description: this.formatTicketDescription(reportData),
        status: 2, // Open
        priority: this.mapPriorityToFreshdesk(reportData.priority),
        tags: [
          'int-triage',
          reportData.report_id,
          reportData.department.toLowerCase(),
        ],
        custom_fields: {
          cf_int_report_id: reportData.report_id,
          cf_sentiment: reportData.sentiment || 'neutral',
        },
      };

      // Create ticket
      const ticket = await this.makeRequest('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketPayload),
      });

      // Store sync record
      await supabase.from('freshdesk_tickets_sync').insert({
        report_id: reportData.report_id,
        freshdesk_ticket_id: ticket.id,
        sync_status: 'synced',
        sync_direction: 'to_freshdesk',
        last_synced_at: new Date().toISOString(),
        last_modified_source: 'int',
        status_mapping: {
          int_status: 'new',
          freshdesk_status: ticket.status,
        },
      });

      // Mark sync success
      await this.markSyncSuccess();

      logger.info('Freshdesk ticket created', {
        reportId: reportData.report_id,
        ticketId: ticket.id,
      });

      return {
        success: true,
        ticketId: ticket.id,
        ticketUrl: `https://${this.domain}/a/tickets/${ticket.id}`,
      };
    } catch (error) {
      await this.logError('createTicket', error, {
        report_id: reportData.report_id,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update ticket status in Freshdesk
   *
   * @async
   * @param {string} reportId - INT report ID
   * @param {string} status - New status (new/in_progress/resolved)
   * @param {string} [notes] - Optional status change notes
   * @returns {Promise<Object>} Update result
   */
  async updateTicketStatus(reportId, status, notes = null) {
    try {
      // Get Freshdesk ticket ID
      const { data: syncRecord } = await supabase
        .from('freshdesk_tickets_sync')
        .select('freshdesk_ticket_id')
        .eq('report_id', reportId)
        .single();

      if (!syncRecord?.freshdesk_ticket_id) {
        return { success: false, error: 'Ticket not synced to Freshdesk' };
      }

      const ticketId = syncRecord.freshdesk_ticket_id;
      const freshdeskStatus = this.mapStatusToFreshdesk(status);

      // Update ticket
      const updatePayload = {
        status: freshdeskStatus,
      };

      await this.makeRequest(`/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      });

      // Add note if provided
      if (notes) {
        await this.addNoteToTicket(ticketId, notes);
      }

      // Update sync record
      await supabase
        .from('freshdesk_tickets_sync')
        .update({
          last_synced_at: new Date().toISOString(),
          last_modified_source: 'int',
          status_mapping: {
            int_status: status,
            freshdesk_status: freshdeskStatus,
          },
        })
        .eq('report_id', reportId);

      logger.info('Freshdesk ticket status updated', {
        reportId,
        ticketId,
        status,
      });

      return { success: true, ticketId, status: freshdeskStatus };
    } catch (error) {
      await this.logError('updateTicketStatus', error, { reportId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add note/comment to Freshdesk ticket
   *
   * @async
   * @param {number} ticketId - Freshdesk ticket ID
   * @param {string} noteContent - Note content
   * @param {boolean} [isPrivate=true] - Whether note is private (internal)
   * @returns {Promise<Object>} Note creation result
   */
  async addNoteToTicket(ticketId, noteContent, isPrivate = true) {
    try {
      const notePayload = {
        body: noteContent,
        private: isPrivate,
      };

      const note = await this.makeRequest(`/tickets/${ticketId}/notes`, {
        method: 'POST',
        body: JSON.stringify(notePayload),
      });

      logger.info('Note added to Freshdesk ticket', {
        ticketId,
        noteId: note.id,
      });

      return { success: true, noteId: note.id };
    } catch (error) {
      await this.logError('addNoteToTicket', error, { ticketId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get ticket from Freshdesk by ID
   *
   * @async
   * @param {number} ticketId - Freshdesk ticket ID
   * @returns {Promise<Object>} Ticket data
   */
  async getTicket(ticketId) {
    return await this.makeRequest(`/tickets/${ticketId}`);
  }

  /**
   * Sync ticket status from Freshdesk to INT
   *
   * @async
   * @param {number} ticketId - Freshdesk ticket ID
   * @returns {Promise<Object>} Sync result
   */
  async syncTicketFromFreshdesk(ticketId) {
    try {
      // Get Freshdesk ticket
      const ticket = await this.getTicket(ticketId);

      // Find report ID from custom field or tags
      const reportId =
        ticket.custom_fields?.cf_int_report_id ||
        ticket.tags?.find((tag) => tag.startsWith('TR-'));

      if (!reportId) {
        return {
          success: false,
          error: 'Report ID not found in Freshdesk ticket',
        };
      }

      // Map Freshdesk status to INT status
      const intStatus = this.mapFreshdeskStatusToInt(ticket.status);

      // Update INT report
      const { error } = await supabase
        .from('reports')
        .update({
          status: intStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('report_id', reportId);

      if (error) throw error;

      // Update sync record
      await supabase
        .from('freshdesk_tickets_sync')
        .update({
          last_synced_at: new Date().toISOString(),
          last_modified_source: 'freshdesk',
          status_mapping: {
            int_status: intStatus,
            freshdesk_status: ticket.status,
          },
        })
        .eq('freshdesk_ticket_id', ticketId);

      logger.info('Ticket synced from Freshdesk to INT', {
        ticketId,
        reportId,
      });

      return { success: true, reportId, status: intStatus };
    } catch (error) {
      await this.logError('syncTicketFromFreshdesk', error, { ticketId });
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // Knowledge Base Access
  // ============================================================================

  /**
   * Search Freshdesk knowledge base articles
   *
   * @async
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search result
   * @returns {boolean} return.success - Whether search succeeded
   * @returns {Array<Object>} [return.articles] - Array of articles
   */
  async searchKnowledgeBase(query) {
    try {
      const searchUrl = `/solutions/articles?query=${encodeURIComponent(query)}`;
      const articles = await this.makeRequest(searchUrl);

      return {
        success: true,
        articles: articles || [],
        count: articles?.length || 0,
      };
    } catch (error) {
      await this.logError('searchKnowledgeBase', error, { query });
      return {
        success: false,
        error: error.message,
        articles: [],
      };
    }
  }

  /**
   * Get knowledge base article by ID
   *
   * @async
   * @param {number} articleId - Freshdesk article ID
   * @returns {Promise<Object>} Article data
   */
  async getKnowledgeBaseArticle(articleId) {
    try {
      const article = await this.makeRequest(
        `/solutions/articles/${articleId}`
      );
      return { success: true, article };
    } catch (error) {
      await this.logError('getKnowledgeBaseArticle', error, { articleId });
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Format ticket description with metadata
   *
   * @private
   * @param {Object} reportData - Report data
   * @returns {string} Formatted description
   */
  formatTicketDescription(reportData) {
    return `
${reportData.issue_description}

---
**Triage Report Details:**
- Report ID: ${reportData.report_id}
- Priority: ${reportData.priority?.toUpperCase()}
- Department: ${reportData.department}
- Sentiment: ${reportData.sentiment || 'Not analyzed'}
- Created via: INT Smart Triage AI 2.0

Customer: ${reportData.customer_name} (${reportData.customer_email})
    `.trim();
  }

  /**
   * Map INT priority to Freshdesk priority
   *
   * @private
   * @param {string} priority - INT priority (high/medium/low)
   * @returns {number} Freshdesk priority (1=Low, 2=Medium, 3=High, 4=Urgent)
   */
  mapPriorityToFreshdesk(priority) {
    const priorityMap = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4,
    };
    return priorityMap[priority?.toLowerCase()] || 2;
  }

  /**
   * Map INT status to Freshdesk status
   *
   * @private
   * @param {string} status - INT status
   * @returns {number} Freshdesk status (2=Open, 3=Pending, 4=Resolved, 5=Closed)
   */
  mapStatusToFreshdesk(status) {
    const statusMap = {
      new: 2, // Open
      in_progress: 3, // Pending
      resolved: 4, // Resolved
      closed: 5, // Closed
    };
    return statusMap[status?.toLowerCase()] || 2;
  }

  /**
   * Map Freshdesk status to INT status
   *
   * @private
   * @param {number} freshdeskStatus - Freshdesk status code
   * @returns {string} INT status
   */
  mapFreshdeskStatusToInt(freshdeskStatus) {
    const statusMap = {
      2: 'new', // Open
      3: 'in_progress', // Pending
      4: 'resolved', // Resolved
      5: 'resolved', // Closed
      6: 'in_progress', // Waiting on Customer
      7: 'in_progress', // Waiting on Third Party
    };
    return statusMap[freshdeskStatus] || 'new';
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
        p_integration_type: 'freshdesk',
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
        integration_type: 'freshdesk',
        operation,
        error_message: error.message,
        stack_trace: error.stack,
        request_payload: context,
        severity: 'error',
      });

      await supabase.rpc('increment_integration_errors', {
        p_integration_type: 'freshdesk',
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
      await this.makeRequest('/tickets?per_page=1');

      return {
        healthy: true,
        message: 'Freshdesk integration operational',
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
 * Singleton instance of Freshdesk Integration
 *
 * @type {FreshdeskIntegration}
 * @example
 * import { freshdeskIntegration } from './freshdeskIntegration.js';
 * await freshdeskIntegration.createTicket(reportData);
 */
export const freshdeskIntegration = new FreshdeskIntegration();

export default freshdeskIntegration;
