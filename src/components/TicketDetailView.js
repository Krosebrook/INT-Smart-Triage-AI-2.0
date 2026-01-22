import { supabase } from '../services/supabaseClient.js';
import { qualityAssuranceService } from '../services/qualityAssuranceService.js';
import { escalationService } from '../services/escalationService.js';
import { isGuestDemoMode } from '../services/sessionState.js';
import { fetchDemoData } from '../services/demoApiClient.js';

export class TicketDetailView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.ticketId = null;
    this.ticket = null;
    this.messages = [];
    this.templates = [];
  }

  async loadTicket(ticketId) {
    this.ticketId = ticketId;

    if (isGuestDemoMode()) {
      const { data, error } = await fetchDemoData('ticket-detail', { ticketId });
      if (error || !data?.ticket) {
        console.error('Error loading demo ticket detail:', error);
        return;
      }
      this.ticket = data.ticket;
      this.messages = data.ticket.messages || [];
      this.render();
      return;
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customers(*),
        assigned_user:users(name, email),
        messages:ticket_messages(
          *,
          sender_user:users(name)
        )
      `)
      .eq('id', ticketId)
      .single();

    if (error) {
      console.error('Error loading ticket:', error);
      return;
    }

    this.ticket = ticket;
    this.messages = ticket.messages || [];
    this.render();
  }

  async sendResponse(responseText, useQA = true) {
    if (isGuestDemoMode()) {
      alert('Demo mode is read-only. Responses cannot be sent.');
      return { success: false, reason: 'demo_read_only' };
    }
    if (useQA) {
      const qaResult = await qualityAssuranceService.reviewResponse(
        this.ticketId,
        responseText,
        (await supabase.auth.getUser()).data.user?.id
      );

      if (!qaResult.passed) {
        const proceed = confirm(
          `Quality Check Warning:\n\n${qaResult.feedback.join('\n')}\n\nScore: ${(qaResult.score * 100).toFixed(0)}%\n\nDo you want to send anyway?`
        );
        if (!proceed) {
          return { success: false, reason: 'qa_failed' };
        }
      }
    }

    const { data: user } = await supabase.auth.getUser();

    const { data: message, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: this.ticketId,
        sender_type: 'csr',
        sender_id: user?.user?.id,
        message: responseText,
        channel: this.ticket.channel,
        ai_reviewed: useQA
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending response:', error);
      return { success: false, error };
    }

    await supabase
      .from('tickets')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', this.ticketId);

    if (useQA) {
      await qualityAssuranceService.autoReviewMessage(message.id);
    }

    await this.loadTicket(this.ticketId);
    return { success: true, message };
  }

  async updateTicketStatus(status) {
    if (isGuestDemoMode()) {
      alert('Demo mode is read-only. Ticket status cannot be changed.');
      return;
    }
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    } else if (status === 'closed') {
      updates.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', this.ticketId);

    if (error) {
      console.error('Error updating ticket status:', error);
      return;
    }

    await this.loadTicket(this.ticketId);
  }

  async escalateTicket() {
    if (isGuestDemoMode()) {
      alert('Demo escalations are disabled in read-only demo mode.');
      return;
    }
    try {
      const escalation = await escalationService.autoEscalateIfNeeded(this.ticketId);
      if (escalation) {
        alert('Ticket escalated successfully!');
        await this.loadTicket(this.ticketId);
      } else {
        alert('No escalation needed or no available senior CSRs');
      }
    } catch (error) {
      alert('Failed to escalate ticket: ' + error.message);
    }
  }

  render() {
    if (!this.ticket) {
      this.container.innerHTML = '<div class="loading">Loading ticket...</div>';
      return;
    }

    const ticket = this.ticket;
    const customer = ticket.customer;

    this.container.innerHTML = `
      <div class="ticket-detail-view">
        <div class="ticket-detail-header">
          <div class="ticket-detail-title">
            <h2>${this.escapeHtml(ticket.subject)}</h2>
            <span class="ticket-number">#${ticket.ticket_number}</span>
          </div>
          <button class="btn-icon" onclick="window.ticketDetailView.close()">✕</button>
        </div>

        <div class="ticket-detail-meta">
          <div class="meta-section">
            <span class="meta-label">Status:</span>
            <select id="ticketStatus" class="status-select" onchange="window.ticketDetailView.updateTicketStatus(this.value)">
              <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
              <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="waiting_customer" ${ticket.status === 'waiting_customer' ? 'selected' : ''}>Waiting on Customer</option>
              <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
              <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
          <div class="meta-section">
            <span class="meta-label">Priority:</span>
            <span class="priority-badge priority-${ticket.priority}">${ticket.priority}</span>
          </div>
          <div class="meta-section">
            <span class="meta-label">Category:</span>
            <span class="badge">${ticket.category}</span>
          </div>
          <div class="meta-section">
            <span class="meta-label">Channel:</span>
            <span>${ticket.channel}</span>
          </div>
        </div>

        <div class="ticket-customer-info">
          <h4>Customer Information</h4>
          <div class="customer-grid">
            <div><strong>${this.escapeHtml(customer.name)}</strong></div>
            <div>${this.escapeHtml(customer.email)}</div>
            <div>${customer.company || 'N/A'}</div>
            <div>Health Score: ${customer.health_score}/100</div>
          </div>
        </div>

        <div class="ticket-conversation">
          <h4>Conversation Thread</h4>
          <div class="messages-thread">
            ${this.messages.map(msg => this.renderMessage(msg)).join('')}
          </div>
        </div>

        <div class="ticket-response-box">
          <h4>Respond to Ticket</h4>
          <div class="response-tools">
            <button class="btn-small btn-secondary" onclick="window.ticketDetailView.loadTemplates()">
              📋 Use Template
            </button>
            <label>
              <input type="checkbox" id="useQA" checked> AI Quality Check
            </label>
          </div>
          <textarea id="responseText" class="response-textarea" rows="6" placeholder="Type your response here..."></textarea>
          <div class="response-actions">
            <button class="btn-primary" onclick="window.ticketDetailView.sendResponseAction()">
              Send Response
            </button>
            ${!ticket.escalated ? `
              <button class="btn-secondary" onclick="window.ticketDetailView.escalateTicket()">
                ⚠️ Escalate
              </button>
            ` : '<span class="badge badge-danger">Escalated</span>'}
          </div>
        </div>

        ${ticket.escalated ? `
          <div class="escalation-banner">
            ⚠️ This ticket has been escalated to senior support
          </div>
        ` : ''}
      </div>

      <div id="templateSelectorModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h4>Select Response Template</h4>
            <button class="btn-icon" onclick="window.ticketDetailView.closeTemplateModal()">×</button>
          </div>
          <div class="modal-body" id="templateList"></div>
        </div>
      </div>
    `;
  }

  renderMessage(message) {
    const isCustomer = message.sender_type === 'customer';
    const senderName = isCustomer
      ? this.ticket.customer.name
      : (message.sender_user?.name || 'Support');

    const timestamp = new Date(message.created_at).toLocaleString();
    const qaIndicator = message.ai_reviewed
      ? `<span class="qa-badge" title="QA Score: ${(message.ai_review_score * 100).toFixed(0)}%">✓ QA Reviewed</span>`
      : '';

    return `
      <div class="message ${isCustomer ? 'customer-message' : 'csr-message'}">
        <div class="message-header">
          <strong>${this.escapeHtml(senderName)}</strong>
          <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-body">
          ${this.escapeHtml(message.message)}
        </div>
        ${qaIndicator}
      </div>
    `;
  }

  async loadTemplates() {
    if (isGuestDemoMode()) {
      const { data, error } = await fetchDemoData('response-templates');
      if (error) {
        console.error('Error loading demo templates:', error);
        this.templates = [];
      } else {
        const allTemplates = data?.templates || [];
        this.templates = allTemplates
          .filter(template => template.category === this.ticket.category)
          .slice(0, 10);
      }
    } else {
      const { data: templates, error } = await supabase
        .from('response_templates')
        .select('*')
        .eq('category', this.ticket.category)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading templates:', error);
        return;
      }

      this.templates = templates || [];
    }

    const templateList = document.getElementById('templateList');
    templateList.innerHTML = `
      <div class="template-list">
        ${this.templates.map(template => `
          <div class="template-option" onclick="window.ticketDetailView.selectTemplate('${template.id}')">
            <h5>${this.escapeHtml(template.name)}</h5>
            <p>${this.escapeHtml(template.template_text.substring(0, 100))}...</p>
            <div class="template-meta">
              <span>Used ${template.usage_count} times</span>
              ${template.effectiveness_score > 0 ? `<span>⭐ ${(template.effectiveness_score * 100).toFixed(0)}%</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('templateSelectorModal').style.display = 'flex';
  }

  selectTemplate(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    let text = template.template_text;
    text = text.replace(/\{\{customer_name\}\}/g, this.ticket.customer.name);
    text = text.replace(/\{\{ticket_number\}\}/g, this.ticket.ticket_number);

    document.getElementById('responseText').value = text;
    this.closeTemplateModal();
  }

  closeTemplateModal() {
    document.getElementById('templateSelectorModal').style.display = 'none';
  }

  async sendResponseAction() {
    const responseText = document.getElementById('responseText').value;
    const useQA = document.getElementById('useQA').checked;

    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    const result = await this.sendResponse(responseText, useQA);

    if (result.success) {
      document.getElementById('responseText').value = '';
      alert('Response sent successfully!');
    } else if (result.reason === 'qa_failed') {
      console.log('Response cancelled due to QA');
    } else {
      alert('Failed to send response');
    }
  }

  close() {
    window.dispatchEvent(new CustomEvent('close-ticket-detail'));
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
