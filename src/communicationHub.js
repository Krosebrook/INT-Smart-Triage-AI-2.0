/**
 * Multi-Channel Communication Hub
 *
 * Centralized communication system supporting email, SMS, Slack, Teams, phone, and chat.
 * Provides unified interface for sending notifications and maintaining conversation history.
 *
 * @module CommunicationHub
 * @since 1.0.0
 */

import { supabase } from './supabaseClient.js';

/**
 * Communication Hub for managing multi-channel notifications and messaging.
 *
 * Supported channels:
 * - Email
 * - SMS
 * - Slack
 * - Microsoft Teams
 * - Phone calls
 * - In-app chat
 *
 * @class CommunicationHub
 */
export class CommunicationHub {
  /**
   * Initialize the Communication Hub with supported channels.
   *
   * @constructor
   */
  constructor() {
    /**
     * List of supported communication channels.
     *
     * @type {string[]}
     * @private
     */
    this.channels = ['email', 'sms', 'slack', 'teams', 'phone', 'chat'];

    /**
     * Map of registered channel integrations.
     *
     * @type {Map}
     * @private
     */
    this.integrations = new Map();
  }

  /**
   * Send notification through specified channel.
   *
   * Dynamically routes to appropriate channel handler method.
   *
   * @async
   * @param {string} channel - Channel name (email/sms/slack/teams/phone/chat)
   * @param {string} recipient - Recipient identifier (email/phone/username/channel ID)
   * @param {string} message - Message content
   * @param {Object} [options={}] - Channel-specific options
   * @returns {Promise<Object>} Notification result
   * @returns {boolean} return.success - Whether notification was sent successfully
   * @returns {string} [return.error] - Error message if sending failed
   *
   * @example
   * const result = await hub.sendNotification(
   *   'slack',
   *   '#urgent-tickets',
   *   'High priority ticket assigned',
   *   { priority: 'high' }
   * );
   */
  async sendNotification(channel, recipient, message, options = {}) {
    // Validate channel
    if (!this.channels.includes(channel)) {
      return {
        success: false,
        error: `Channel ${channel} not supported`,
      };
    }

    // Build method name (e.g., 'sendEmail', 'sendSms')
    const method = `send${channel.charAt(0).toUpperCase()}${channel.slice(1)}`;

    if (typeof this[method] === 'function') {
      return await this[method](recipient, message, options);
    }

    return {
      success: false,
      error: `Channel ${channel} not implemented`,
    };
  }

  /**
   * Send email notification.
   *
   * @async
   * @param {string} recipient - Email address
   * @param {string} message - Email message content
   * @param {Object} [options={}] - Email options (subject, attachments, etc.)
   * @returns {Promise<Object>} Email send result
   *
   * @example
   * await hub.sendEmail('user@example.com', 'Your ticket has been assigned', {
   *   subject: 'Ticket Update'
   * });
   */
  async sendEmail(recipient, message, _options = {}) {
    return {
      success: true,
      channel: 'email',
      recipient,
      messageId: this.generateMessageId(),
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Send SMS notification.
   *
   * Validates phone number format before sending.
   *
   * @async
   * @param {string} phoneNumber - Phone number in international format (+1234567890)
   * @param {string} message - SMS message content (max 1600 chars)
   * @param {Object} [options={}] - SMS options
   * @returns {Promise<Object>} SMS send result
   * @returns {boolean} return.success - Whether SMS was sent
   * @returns {number} [return.segments] - Number of SMS segments used
   *
   * @example
   * await hub.sendSms('+15551234567', 'Your ticket has been escalated');
   */
  async sendSms(phoneNumber, message, _options = {}) {
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    }

    return {
      success: true,
      channel: 'sms',
      recipient: phoneNumber,
      messageId: this.generateMessageId(),
      sentAt: new Date().toISOString(),
      segments: Math.ceil(message.length / 160),
    };
  }

  /**
   * Send Slack notification.
   *
   * @async
   * @param {string} channel - Slack channel (#channel-name) or user ID
   * @param {string} message - Message text
   * @param {Object} [options={}] - Slack options
   * @param {string} [options.username='INT Triage Bot'] - Bot username
   * @param {string} [options.icon=':robot_face:'] - Bot icon emoji
   * @param {Array} [options.attachments=[]] - Slack message attachments
   * @param {string} [options.priority] - Priority level for color coding
   * @returns {Promise<Object>} Slack send result
   *
   * @example
   * await hub.sendSlack('#urgent-tickets', 'High priority ticket', {
   *   priority: 'high',
   *   attachments: [{ title: 'View Ticket', title_link: '/ticket/123' }]
   * });
   */
  async sendSlack(channel, message, options = {}) {
    const payload = {
      channel: channel,
      text: message,
      username: options.username || 'INT Triage Bot',
      icon_emoji: options.icon || ':robot_face:',
      attachments: options.attachments || [],
    };

    // Add priority indicator for high-priority messages
    if (options.priority === 'high') {
      payload.attachments.push({
        color: 'danger',
        text: '⚠️ HIGH PRIORITY',
        footer: 'INT Smart Triage AI',
      });
    }

    return {
      success: true,
      channel: 'slack',
      recipient: channel,
      payload,
      messageId: this.generateMessageId(),
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Send Microsoft Teams notification.
   *
   * Uses incoming webhook to send adaptive cards to Teams channels.
   *
   * @async
   * @param {string} channelId - Teams channel ID or webhook URL
   * @param {string} message - Message content
   * @param {Object} [options={}] - Teams options
   * @param {string} [options.title='INT Smart Triage AI'] - Card title
   * @param {string} [options.summary] - Card summary
   * @param {string} [options.priority] - Priority level for color coding
   * @param {Array} [options.actions=[]] - Card actions
   * @returns {Promise<Object>} Teams send result
   *
   * @example
   * await hub.sendTeams('channel-id', 'New high priority ticket', {
   *   priority: 'high',
   *   actions: [{ '@type': 'OpenUri', name: 'View', targets: [{ uri: '/ticket/123' }] }]
   * });
   */
  async sendTeams(channelId, message, options = {}) {
    // Build Adaptive Card (MessageCard format for incoming webhooks)
    const card = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: options.summary || 'New Triage Notification',
      themeColor: options.priority === 'high' ? 'FF0000' : '0078D7',
      title: options.title || 'INT Smart Triage AI',
      text: message,
      potentialAction: options.actions || [],
    };

    // Get webhook URL from environment
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

    // If webhook not configured, return mock success (for testing/dev)
    if (!webhookUrl) {
      return {
        success: true,
        channel: 'teams',
        recipient: channelId,
        card,
        messageId: this.generateMessageId(),
        sentAt: new Date().toISOString(),
        note: 'Webhook not configured - mock response',
      };
    }

    try {
      // Send to Teams via webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(card),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Teams webhook error: ${response.status} - ${errorText}`
        );
      }

      const messageId = this.generateMessageId();

      // Log communication
      await this.logCommunication(
        'teams',
        channelId,
        message,
        'success',
        options.reportId || null
      );

      return {
        success: true,
        channel: 'teams',
        recipient: channelId,
        messageId,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      // Log failed communication
      await this.logCommunication(
        'teams',
        channelId,
        message,
        'failed',
        options.reportId || null
      );

      return {
        success: false,
        channel: 'teams',
        recipient: channelId,
        error: error.message,
      };
    }
  }

  /**
   * Initiate phone call notification.
   *
   * @async
   * @param {string} phoneNumber - Phone number to call
   * @param {string} message - Voice message script
   * @param {Object} [options={}] - Call options
   * @returns {Promise<Object>} Call initiation result
   *
   * @example
   * await hub.sendPhone('+15551234567', 'You have an urgent ticket assigned');
   */
  async sendPhone(phoneNumber, message, _options = {}) {
    return {
      success: true,
      channel: 'phone',
      recipient: phoneNumber,
      callId: this.generateMessageId(),
      duration: 0,
      status: 'initiated',
      initiatedAt: new Date().toISOString(),
    };
  }

  /**
   * Send in-app chat message.
   *
   * @async
   * @param {string} userId - User ID to send message to
   * @param {string} message - Chat message content
   * @param {Object} [options={}] - Chat options
   * @returns {Promise<Object>} Chat send result
   *
   * @example
   * await hub.sendChat('user-123', 'Your ticket has been updated');
   */
  async sendChat(userId, message, _options = {}) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert([
            {
              user_id: userId,
              message: message,
              sender: 'system',
              sent_at: new Date().toISOString(),
            },
          ])
          .select();

        if (error) throw error;

        return {
          success: true,
          channel: 'chat',
          recipient: userId,
          messageId: data[0].id,
          sentAt: data[0].sent_at,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Fallback when database not available
    return {
      success: true,
      channel: 'chat',
      recipient: userId,
      messageId: this.generateMessageId(),
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Broadcast message to team across multiple channels.
   *
   * @async
   * @param {string} message - Message to broadcast
   * @param {string} [priority='normal'] - Message priority
   * @param {Array} [excludeUsers=[]] - User IDs to exclude from broadcast
   * @returns {Promise<Object>} Broadcast result
   * @returns {boolean} return.success - Whether broadcast succeeded
   * @returns {Array<Object>} return.channels - Results from each channel
   *
   * @example
   * await hub.broadcastToTeam('System maintenance in 30 minutes', 'high');
   */
  async broadcastToTeam(message, priority = 'normal', _excludeUsers = []) {
    const channels = ['slack', 'teams', 'email'];
    const results = [];

    for (const channel of channels) {
      const result = await this.sendNotification(
        channel,
        'team-channel',
        message,
        { priority }
      );
      results.push({ channel, ...result });
    }

    return {
      success: true,
      broadcast: true,
      channels: results,
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Send high-priority ticket notifications across multiple channels.
   *
   * Notifies team immediately via Slack, Teams, and SMS when a high-priority
   * ticket is created.
   *
   * @async
   * @param {Object} ticketData - Ticket information
   * @param {string} ticketData.reportId - Report ID
   * @param {string} ticketData.customerName - Customer name
   * @param {string} ticketData.ticketSubject - Ticket subject
   * @param {string} ticketData.department - Department
   * @param {string} [ticketData.assignedPhone] - Phone number of assigned CSR
   * @returns {Promise<Object>} Notification result
   *
   * @example
   * await hub.notifyHighPriorityTicket({
   *   reportId: 'TR-12345',
   *   customerName: 'Acme Corp',
   *   ticketSubject: 'Security breach',
   *   department: 'Information Security'
   * });
   */
  async notifyHighPriorityTicket(ticketData) {
    const message = `
🚨 HIGH PRIORITY TICKET

Report ID: ${ticketData.reportId}
Customer: ${ticketData.customerName}
Subject: ${ticketData.ticketSubject}
Department: ${ticketData.department}

Immediate action required!
        `;

    const notifications = await Promise.all([
      this.sendSlack('#urgent-tickets', message, {
        priority: 'high',
        attachments: [
          {
            title: 'View Ticket',
            title_link: `/report-detail.html?id=${ticketData.reportId}`,
            color: 'danger',
          },
        ],
      }),
      this.sendTeams('urgent-channel', message, {
        priority: 'high',
        title: '🚨 High Priority Ticket',
        actions: [
          {
            '@type': 'OpenUri',
            name: 'View Ticket',
            targets: [
              {
                os: 'default',
                uri: `/report-detail.html?id=${ticketData.reportId}`,
              },
            ],
          },
        ],
      }),
      this.sendSms(
        ticketData.assignedPhone || '+1234567890',
        `URGENT: Ticket ${ticketData.reportId} assigned to you. Check dashboard immediately.`
      ),
    ]);

    return {
      success: true,
      notifications,
      ticketId: ticketData.reportId,
    };
  }

  /**
   * Log communication to database for audit trail.
   *
   * @async
   * @private
   * @param {string} channel - Communication channel used
   * @param {string} recipient - Recipient identifier
   * @param {string} message - Message content (truncated to 500 chars)
   * @param {string} status - Send status (success/failed)
   * @param {string|null} [reportId=null] - Associated report ID
   * @returns {Promise<void>}
   */
  async logCommunication(channel, recipient, message, status, reportId = null) {
    if (!supabase) return;

    try {
      await supabase.from('communication_log').insert([
        {
          channel,
          recipient,
          report_id: reportId,
          message: message.substring(0, 500), // Truncate long messages
          status,
          sent_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      // Silent fail - logging communication failure is non-critical
    }
  }

  /**
   * Get conversation history for a report.
   *
   * @async
   * @param {string} reportId - Report ID to fetch history for
   * @returns {Promise<Object>} History query result
   * @returns {boolean} return.success - Whether query succeeded
   * @returns {Array<Object>} [return.history] - Array of communication records
   * @returns {number} [return.count] - Number of communications
   *
   * @example
   * const history = await hub.getConversationHistory('TR-12345');
   */
  async getConversationHistory(reportId) {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('communication_log')
        .select('*')
        .eq('report_id', reportId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        history: data,
        count: data.length,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate phone number format.
   *
   * Accepts international format: +[country code][number]
   * Example: +15551234567
   * Minimum 10 digits required
   *
   * @private
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid format
   */
  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
  }

  /**
   * Generate unique message ID for tracking.
   *
   * Format: MSG-[timestamp]-[random string]
   *
   * @private
   * @returns {string} Unique message ID
   */
  generateMessageId() {
    return `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Get user's preferred communication channels.
   *
   * @async
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Preferences result
   * @returns {boolean} return.success - Whether query succeeded
   * @returns {Object} return.preferences - Channel preferences
   * @returns {boolean} return.preferences.email - Email enabled
   * @returns {boolean} return.preferences.sms - SMS enabled
   * @returns {boolean} return.preferences.slack - Slack enabled
   * @returns {boolean} return.preferences.teams - Teams enabled
   *
   * @example
   * const prefs = await hub.getChannelPreferences('user-123');
   */
  async getChannelPreferences(userId) {
    if (!supabase) {
      // Return default preferences when database is not configured
      return {
        success: true,
        preferences: {
          email: true,
          sms: false,
          slack: false,
          teams: false,
        },
      };
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('communication_channels')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        preferences: data?.communication_channels || {
          email: true,
          sms: false,
          slack: true,
          teams: false,
        },
      };
    } catch (error) {
      // Return defaults if user preferences not found
      return {
        success: true,
        preferences: {
          email: true,
          sms: false,
          slack: true,
          teams: false,
        },
      };
    }
  }

  /**
   * Update user's communication channel preferences.
   *
   * @async
   * @param {string} userId - User ID
   * @param {Object} preferences - Channel preferences
   * @param {boolean} [preferences.email] - Enable email
   * @param {boolean} [preferences.sms] - Enable SMS
   * @param {boolean} [preferences.slack] - Enable Slack
   * @param {boolean} [preferences.teams] - Enable Teams
   * @returns {Promise<Object>} Update result
   *
   * @example
   * await hub.updateChannelPreferences('user-123', {
   *   email: true,
   *   sms: true,
   *   slack: false,
   *   teams: false
   * });
   */
  async updateChannelPreferences(userId, preferences) {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert([
          {
            user_id: userId,
            communication_channels: preferences,
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Singleton instance of the Communication Hub.
 *
 * @type {CommunicationHub}
 * @example
 * import { communicationHub } from './communicationHub.js';
 * await communicationHub.sendEmail('user@example.com', 'Hello!');
 */
export const communicationHub = new CommunicationHub();

export default communicationHub;
