/**
 * Automated Email Integration Service
 *
 * Professional email template system with support for:
 * - Multiple email templates (confirmations, assignments, alerts, etc.)
 * - HTML email generation with responsive layout
 * - Dynamic content injection
 * - Email tracking
 * - Scheduled follow-ups
 *
 * @module EmailService
 * @since 1.0.0
 */

/**
 * Email service for automated customer communications.
 *
 * @class EmailService
 */
export class EmailService {
  /**
   * Initialize email service with templates.
   *
   * @constructor
   */
  constructor() {
    /**
     * Email templates library.
     *
     * @type {Object}
     * @private
     */
    this.templates = this.initializeTemplates();
  }

  /**
   * Initialize all email templates.
   *
   * Templates include:
   * - ticket_received: Confirmation email when ticket is created
   * - ticket_assigned: Notification when ticket is assigned to CSR
   * - high_priority_alert: Urgent notification for high-priority tickets
   * - resolution_confirmation: Notification when ticket is resolved
   * - follow_up_reminder: Follow-up check after resolution
   * - knowledge_base_articles: Helpful resource suggestions
   *
   * @private
   * @returns {Object} Template definitions
   */
  initializeTemplates() {
    return {
      ticket_received: {
        subject: "Ticket #{reportId} - We've Received Your Request",
        template: `
                    <h2>Thank you for contacting INT Inc.</h2>
                    <p>Dear {customerName},</p>
                    <p>We've received your support request and our team is reviewing it now.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
                        <strong>Ticket Details:</strong><br>
                        Report ID: {reportId}<br>
                        Priority: {priority}<br>
                        Department: {department}<br>
                        Subject: {ticketSubject}
                    </div>
                    <p><strong>What happens next?</strong></p>
                    <p>{nextSteps}</p>
                    <p>Estimated response time: {estimatedTime}</p>
                    <p>If you have any urgent concerns, please don't hesitate to reach out.</p>
                    <p>Best regards,<br>{csrName}<br>INT Inc. Customer Success Team</p>
                `,
      },
      ticket_assigned: {
        subject: 'Ticket #{reportId} - Assigned to Specialist',
        template: `
                    <h2>Your ticket has been assigned</h2>
                    <p>Dear {customerName},</p>
                    <p>Good news! Your support request has been assigned to one of our specialists.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;">
                        <strong>Assignment Details:</strong><br>
                        Assigned to: {assignedTo}<br>
                        Department: {department}<br>
                        Expected response: {estimatedTime}
                    </div>
                    <p>{assignedTo} will be reaching out to you shortly to assist with your request.</p>
                    <p>Best regards,<br>INT Inc. Customer Success Team</p>
                `,
      },
      high_priority_alert: {
        subject: 'URGENT: Ticket #{reportId} Requires Immediate Attention',
        template: `
                    <h2 style="color: #e74c3c;">High Priority Ticket Alert</h2>
                    <p>Dear {customerName},</p>
                    <p>We understand this matter is urgent and requires immediate attention. Our team is prioritizing your request.</p>
                    <div style="background: #fee; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
                        <strong>Priority Status:</strong><br>
                        This ticket has been flagged as HIGH PRIORITY<br>
                        Response time: Within {estimatedTime}
                    </div>
                    <p>A specialist will contact you immediately to address your concerns.</p>
                    <p>Direct contact: {csrEmail} | {csrPhone}</p>
                    <p>Best regards,<br>{csrName}<br>INT Inc. Customer Success Team</p>
                `,
      },
      resolution_confirmation: {
        subject: 'Ticket #{reportId} - Resolved',
        template: `
                    <h2>Your ticket has been resolved</h2>
                    <p>Dear {customerName},</p>
                    <p>We're pleased to inform you that your support request has been resolved.</p>
                    <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;">
                        <strong>Resolution Summary:</strong><br>
                        {resolutionSummary}
                    </div>
                    <p><strong>Was this helpful?</strong></p>
                    <p>We'd love to hear your feedback:</p>
                    <p>
                        <a href="{feedbackLink}?rating=5" style="background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; margin: 5px;">Excellent</a>
                        <a href="{feedbackLink}?rating=3" style="background: #f39c12; color: white; padding: 10px 20px; text-decoration: none; margin: 5px;">Good</a>
                        <a href="{feedbackLink}?rating=1" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; margin: 5px;">Needs Improvement</a>
                    </p>
                    <p>If you need any further assistance, please don't hesitate to reach out.</p>
                    <p>Best regards,<br>{csrName}<br>INT Inc. Customer Success Team</p>
                `,
      },
      follow_up_reminder: {
        subject: 'Ticket #{reportId} - Follow-up Check',
        template: `
                    <h2>Checking in on your recent ticket</h2>
                    <p>Dear {customerName},</p>
                    <p>This is a follow-up regarding ticket #{reportId} that was recently resolved.</p>
                    <p>We want to make sure everything is working as expected and you're completely satisfied.</p>
                    <p><strong>Is everything resolved to your satisfaction?</strong></p>
                    <p>
                        <a href="{confirmLink}?satisfied=yes" style="background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; margin: 5px;">Yes, all good!</a>
                        <a href="{confirmLink}?satisfied=no" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; margin: 5px;">Still need help</a>
                    </p>
                    <p>If you have any concerns, I'm here to help.</p>
                    <p>Best regards,<br>{csrName}<br>INT Inc. Customer Success Team</p>
                `,
      },
      knowledge_base_articles: {
        subject: 'Helpful Resources for Your Request',
        template: `
                    <h2>Resources that might help</h2>
                    <p>Dear {customerName},</p>
                    <p>Based on your support request, we've found some helpful articles that might provide immediate answers:</p>
                    <div style="background: #f8f9fa; padding: 15px; margin: 20px 0;">
                        {articlesList}
                    </div>
                    <p>These articles cover common questions and solutions related to your inquiry.</p>
                    <p>If you still need assistance after reviewing these resources, our team is here to help!</p>
                    <p>Best regards,<br>INT Inc. Customer Success Team</p>
                `,
      },
    };
  }

  /**
   * Generate email from template with data injection.
   *
   * Replaces all {placeholder} variables in template with actual values.
   *
   * @param {string} templateName - Name of template to use
   * @param {Object} data - Data object with values for placeholders
   * @returns {Object} Generated email
   * @returns {string} return.subject - Email subject line
   * @returns {string} return.body - Email HTML body
   * @returns {string} return.templateUsed - Template name used
   *
   * @throws {Error} If template not found
   *
   * @example
   * const email = emailService.generateEmail('ticket_received', {
   *   customerName: 'John Doe',
   *   reportId: 'TR-12345',
   *   priority: 'HIGH'
   * });
   */
  generateEmail(templateName, data) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    let subject = template.subject;
    let body = template.template;

    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      subject = subject.replace(placeholder, value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    });

    return {
      subject,
      body,
      templateUsed: templateName,
    };
  }

  /**
   * Send email using template.
   *
   * Generates email from template, wraps in layout, and sends (simulated).
   * In production, this would integrate with an email service like SendGrid,
   * Amazon SES, or Postmark.
   *
   * @async
   * @param {string} to - Recipient email address
   * @param {string} templateName - Template to use
   * @param {Object} data - Template data
   * @param {Object} [options={}] - Additional email options
   * @param {string} [options.from='support@intinc.com'] - Sender email
   * @param {string} [options.replyTo] - Reply-to email
   * @param {Array} [options.attachments] - Email attachments
   * @returns {Promise<Object>} Send result
   * @returns {boolean} return.success - Whether email sent successfully
   * @returns {Object} return.emailData - Complete email data
   * @returns {string} return.trackingId - Unique tracking identifier
   *
   * @example
   * const result = await emailService.sendEmail(
   *   'customer@example.com',
   *   'ticket_received',
   *   { reportId: 'TR-12345', customerName: 'John Doe' }
   * );
   */
  async sendEmail(to, templateName, data, options = {}) {
    const email = this.generateEmail(templateName, data);

    const emailData = {
      to,
      from: options.from || 'support@intinc.com',
      subject: email.subject,
      html: this.wrapInLayout(email.body, options),
      text: this.stripHTML(email.body),
      ...options,
    };

    return {
      success: true,
      emailData,
      message: 'Email sent successfully (simulated)',
      trackingId: this.generateTrackingId(),
    };
  }

  wrapInLayout(content, _options = {}) {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    a {
                        color: #667eea;
                        text-decoration: none;
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }
                    .content {
                        background: white;
                        padding: 30px;
                        border: 1px solid #e1e8ed;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #7f8c8d;
                        border-radius: 0 0 10px 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0;">INT Inc.</h1>
                    <p style="margin: 5px 0 0 0;">Smart Triage AI - Customer Success</p>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p>INT Inc. | 123 Business Street | City, State 12345</p>
                    <p>© ${new Date().getFullYear()} INT Inc. All rights reserved.</p>
                    <p><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a></p>
                </div>
            </body>
            </html>
        `;
  }

  /**
   * Strip HTML tags from content for plain text version.
   *
   * @param {string} html - HTML content
   * @returns {string} Plain text version
   */
  stripHTML(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate unique tracking ID for email.
   *
   * Format: TRACK-[timestamp]-[random]
   *
   * @returns {string} Unique tracking ID
   */
  generateTrackingId() {
    return `TRACK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Send ticket confirmation email to customer.
   *
   * Automatically sends when a new ticket is created.
   *
   * @async
   * @param {Object} reportData - Ticket/report data
   * @param {string} reportData.customerName - Customer name
   * @param {string} reportData.reportId - Report ID
   * @param {string} reportData.priority - Priority level
   * @param {string} reportData.department - Assigned department
   * @param {string} reportData.ticketSubject - Ticket subject
   * @param {string} [reportData.customerEmail] - Customer email
   * @param {string} [reportData.csrAgent] - CSR agent name
   * @returns {Promise<Object>} Send result
   *
   * @example
   * await emailService.sendTicketConfirmation({
   *   customerName: 'John Doe',
   *   reportId: 'TR-12345',
   *   priority: 'high',
   *   department: 'Technology',
   *   ticketSubject: 'Server down',
   *   customerEmail: 'john@example.com'
   * });
   */
  async sendTicketConfirmation(reportData) {
    const emailData = {
      customerName: reportData.customerName,
      reportId: reportData.reportId,
      priority: reportData.priority?.toUpperCase(),
      department: reportData.department,
      ticketSubject: reportData.ticketSubject,
      nextSteps: this.getNextSteps(reportData.priority),
      estimatedTime: this.getEstimatedTime(reportData.priority),
      csrName: reportData.csrAgent || 'Customer Success Team',
    };

    return await this.sendEmail(
      reportData.customerEmail || 'customer@example.com',
      'ticket_received',
      emailData
    );
  }

  /**
   * Send notification when ticket is assigned to CSR.
   *
   * @async
   * @param {Object} reportData - Ticket data
   * @param {Object} assignedTo - CSR information
   * @param {string} assignedTo.name - CSR name
   * @returns {Promise<Object>} Send result
   */
  async sendAssignmentNotification(reportData, assignedTo) {
    const emailData = {
      customerName: reportData.customerName,
      reportId: reportData.reportId,
      assignedTo: assignedTo.name,
      department: reportData.department,
      estimatedTime: this.getEstimatedTime(reportData.priority),
    };

    return await this.sendEmail(
      reportData.customerEmail || 'customer@example.com',
      'ticket_assigned',
      emailData
    );
  }

  /**
   * Send high-priority alert notification.
   *
   * Sent immediately for high-priority tickets to ensure rapid response.
   *
   * @async
   * @param {Object} reportData - Ticket data
   * @param {Object} csrContact - CSR contact information
   * @param {string} csrContact.name - CSR name
   * @param {string} csrContact.email - CSR email
   * @param {string} [csrContact.phone] - CSR phone number
   * @returns {Promise<Object>} Send result
   */
  async sendHighPriorityAlert(reportData, csrContact) {
    const emailData = {
      customerName: reportData.customerName,
      reportId: reportData.reportId,
      estimatedTime: '30 minutes',
      csrEmail: csrContact.email,
      csrPhone: csrContact.phone || '(555) 123-4567',
      csrName: csrContact.name,
    };

    return await this.sendEmail(
      reportData.customerEmail || 'customer@example.com',
      'high_priority_alert',
      emailData
    );
  }

  /**
   * Send knowledge base article suggestions to customer.
   *
   * Helps customers find answers quickly and reduces support load.
   *
   * @async
   * @param {Object} reportData - Ticket data
   * @param {Array<Object>} articles - Array of article objects
   * @param {string} articles[].title - Article title
   * @param {string} articles[].category - Article category
   * @param {string} [articles[].readTime] - Estimated read time
   * @param {string} [articles[].url] - Article URL
   * @returns {Promise<Object>} Send result
   */
  async sendKnowledgeBaseArticles(reportData, articles) {
    const articlesList = articles
      .map(
        (article) => `
            <div style="margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #667eea;">
                <strong>${article.title}</strong><br>
                <small>${article.category} - ${article.readTime || '5 min read'}</small><br>
                <a href="${article.url || '#'}" style="color: #667eea;">Read Article →</a>
            </div>
        `
      )
      .join('');

    const emailData = {
      customerName: reportData.customerName,
      articlesList,
    };

    return await this.sendEmail(
      reportData.customerEmail || 'customer@example.com',
      'knowledge_base_articles',
      emailData
    );
  }

  /**
   * Get next steps text based on priority.
   *
   * @param {string} priority - Priority level
   * @returns {string} Next steps description
   */
  getNextSteps(priority) {
    const steps = {
      high: 'A specialist will contact you within 30 minutes to begin resolving this issue immediately.',
      medium:
        'Our team will review your request and respond within 2-4 hours with next steps.',
      low: "We'll review your inquiry and get back to you within 24 hours with assistance.",
    };
    return steps[priority] || steps['medium'];
  }

  /**
   * Get estimated response time based on priority.
   *
   * @param {string} priority - Priority level
   * @returns {string} Estimated time string
   */
  getEstimatedTime(priority) {
    const times = {
      high: '30 minutes',
      medium: '2-4 hours',
      low: '24 hours',
    };
    return times[priority] || times['medium'];
  }

  /**
   * Schedule follow-up email after resolution.
   *
   * @async
   * @param {string} reportId - Report ID
   * @param {string} customerEmail - Customer email
   * @param {number} [daysFromNow=3] - Days to wait before follow-up
   * @returns {Promise<Object>} Schedule result
   *
   * @example
   * await emailService.scheduleFollowUp('TR-12345', 'customer@example.com', 3);
   */
  async scheduleFollowUp(reportId, customerEmail, daysFromNow = 3) {
    return {
      success: true,
      scheduledFor: new Date(
        Date.now() + daysFromNow * 24 * 60 * 60 * 1000
      ).toISOString(),
      reportId,
      customerEmail,
    };
  }

  /**
   * Track email open event.
   *
   * Would integrate with email service provider's tracking in production.
   *
   * @async
   * @param {string} trackingId - Email tracking ID
   * @returns {Promise<Object>} Tracking result
   */
  async trackEmailOpen(trackingId) {
    return {
      success: true,
      trackingId,
      openedAt: new Date().toISOString(),
    };
  }

  /**
   * Track email link click event.
   *
   * Tracks which links customers click in emails for analytics.
   *
   * @async
   * @param {string} trackingId - Email tracking ID
   * @param {string} linkUrl - URL that was clicked
   * @returns {Promise<Object>} Tracking result
   */
  async trackEmailClick(trackingId, linkUrl) {
    return {
      success: true,
      trackingId,
      linkUrl,
      clickedAt: new Date().toISOString(),
    };
  }
}

/**
 * Singleton instance of the Email Service.
 *
 * @type {EmailService}
 * @example
 * import { emailService } from './emailService.js';
 * await emailService.sendTicketConfirmation(reportData);
 */
export const emailService = new EmailService();

export default emailService;
