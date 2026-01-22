import { supabase } from '../services/supabaseClient.js';
import { isGuestDemoMode } from '../services/sessionState.js';
import { fetchDemoData } from '../services/demoApiClient.js';

export class MultiChannelHub {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.messages = [];
    this.selectedChannel = 'all';
    this.subscription = null;
  }

  async init() {
    await this.loadMessages();
    this.setupRealtimeSubscription();
    this.render();
  }

  async loadMessages() {
    if (isGuestDemoMode()) {
      const { data, error } = await fetchDemoData('channel-messages', { channel: this.selectedChannel });
      if (error) {
        console.error('Error loading demo channel messages:', error);
        this.messages = [];
        return;
      }
      this.messages = data?.messages || [];
      return;
    }

    const query = supabase
      .from('channel_integrations')
      .select(`
        *,
        ticket:tickets(ticket_number, subject, status),
        customer:customers(name, email, company)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (this.selectedChannel !== 'all') {
      query.eq('channel_type', this.selectedChannel);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading channel messages:', error);
      return;
    }

    this.messages = data || [];
  }

  setupRealtimeSubscription() {
    if (isGuestDemoMode()) {
      return;
    }
    this.subscription = supabase
      .channel('channel-integrations')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'channel_integrations' },
        (payload) => {
          this.handleNewMessage(payload.new);
        }
      )
      .subscribe();
  }

  handleNewMessage(message) {
    this.messages.unshift(message);
    this.render();
    this.showNotification(message);
  }

  showNotification(message) {
    console.log('New message from', message.channel_type);
  }

  async processMessage(messageId) {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) return;

    if (isGuestDemoMode()) {
      alert('Message processing is disabled in demo mode.');
      return null;
    }

    let ticketId = message.ticket_id;

    if (!ticketId) {
      const newTicket = await this.createTicketFromMessage(message);
      ticketId = newTicket.id;

      await supabase
        .from('channel_integrations')
        .update({ ticket_id: ticketId })
        .eq('id', messageId);
    }

    await supabase
      .from('channel_integrations')
      .update({ processed: true })
      .eq('id', messageId);

    message.processed = true;
    message.ticket_id = ticketId;

    this.render();
    return ticketId;
  }

  async createTicketFromMessage(message) {
    if (isGuestDemoMode()) {
      throw new Error('Ticket creation is disabled in demo mode.');
    }
    const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`;

    const extractedContent = this.extractMessageContent(message.raw_message);

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        ticket_number: ticketNumber,
        customer_id: message.customer_id,
        subject: extractedContent.subject || `${message.channel_type} inquiry`,
        description: extractedContent.body,
        channel: message.channel_type,
        status: 'open',
        priority: 'medium'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }

    await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'customer',
        message: extractedContent.body,
        channel: message.channel_type
      });

    return ticket;
  }

  extractMessageContent(rawMessage) {
    if (typeof rawMessage === 'string') {
      return {
        subject: rawMessage.substring(0, 100),
        body: rawMessage
      };
    }

    return {
      subject: rawMessage.subject || rawMessage.title || 'No subject',
      body: rawMessage.body || rawMessage.text || rawMessage.message || JSON.stringify(rawMessage)
    };
  }

  render() {
    const unprocessedCount = this.messages.filter(m => !m.processed).length;
    const channels = ['email', 'chat', 'phone', 'social'];

    this.container.innerHTML = `
      <div class="multichannel-hub">
        <div class="hub-header">
          <h3>Multi-Channel Integration Hub</h3>
          <div class="hub-badge">
            <span class="badge badge-danger">${unprocessedCount} Unprocessed</span>
          </div>
        </div>

        <div class="hub-filters">
          <div class="channel-tabs">
            <button class="channel-tab ${this.selectedChannel === 'all' ? 'active' : ''}"
                    onclick="window.multiChannelHub.filterChannel('all')">
              All (${this.messages.length})
            </button>
            ${channels.map(channel => {
              const count = this.messages.filter(m => m.channel_type === channel).length;
              return `
                <button class="channel-tab ${this.selectedChannel === channel ? 'active' : ''}"
                        onclick="window.multiChannelHub.filterChannel('${channel}')">
                  ${this.getChannelIcon(channel)} ${channel} (${count})
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="messages-list">
          ${this.messages.map(msg => this.renderMessageCard(msg)).join('')}
          ${this.messages.length === 0 ? '<div class="empty-state">No messages found</div>' : ''}
        </div>
      </div>
    `;
  }

  renderMessageCard(message) {
    const content = this.extractMessageContent(message.raw_message);
    const timeAgo = this.getTimeAgo(message.created_at);
    const statusClass = message.processed ? 'processed' : 'unprocessed';
    const customerName = message.customer?.name || 'Unknown Customer';

    return `
      <div class="message-card ${statusClass}">
        <div class="message-header">
          <div class="message-channel">
            ${this.getChannelIcon(message.channel_type)}
            <span>${message.channel_type}</span>
          </div>
          <div class="message-status">
            ${message.processed ? '✓ Processed' : '⚠ Needs Processing'}
          </div>
          <span class="message-time">${timeAgo}</span>
        </div>

        <div class="message-customer">
          <strong>${this.escapeHtml(customerName)}</strong>
          ${message.customer?.email ? `<span class="text-muted">${this.escapeHtml(message.customer.email)}</span>` : ''}
        </div>

        <div class="message-content">
          <h4>${this.escapeHtml(content.subject)}</h4>
          <p>${this.escapeHtml(content.body.substring(0, 200))}${content.body.length > 200 ? '...' : ''}</p>
        </div>

        ${message.ticket_id ? `
          <div class="message-ticket">
            Linked to ticket: <a href="#ticket-${message.ticket_id}">#${message.ticket?.ticket_number}</a>
          </div>
        ` : ''}

        <div class="message-actions">
          ${!message.processed ? `
            <button class="btn-small btn-primary" onclick="window.multiChannelHub.processMessageAction('${message.id}')">
              Process & Create Ticket
            </button>
          ` : ''}
          <button class="btn-small btn-secondary" onclick="window.multiChannelHub.viewRawMessage('${message.id}')">
            View Raw
          </button>
          ${message.ticket_id ? `
            <button class="btn-small btn-secondary" onclick="window.multiChannelHub.viewTicket('${message.ticket_id}')">
              View Ticket
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  getChannelIcon(channel) {
    const icons = {
      email: '✉️',
      chat: '💬',
      phone: '📞',
      social: '👥',
      slack: '💼',
      teams: '👔',
      twitter: '🐦',
      facebook: '📘'
    };
    return icons[channel] || '📨';
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async filterChannel(channel) {
    this.selectedChannel = channel;
    await this.loadMessages();
    this.render();
  }

  async processMessageAction(messageId) {
    try {
      const ticketId = await this.processMessage(messageId);
      alert(`Ticket created successfully! Ticket ID: ${ticketId}`);
    } catch (error) {
      alert('Failed to process message: ' + error.message);
    }
  }

  viewRawMessage(messageId) {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      const rawJson = JSON.stringify(message.raw_message, null, 2);
      alert(rawJson);
    }
  }

  viewTicket(ticketId) {
    window.dispatchEvent(new CustomEvent('view-ticket', { detail: { ticketId } }));
  }

  destroy() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
    }
  }
}
