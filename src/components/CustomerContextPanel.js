import { supabase } from '../services/supabaseClient.js';
import { isGuestDemoMode } from '../services/sessionState.js';
import { fetchDemoData } from '../services/demoApiClient.js';

export class CustomerContextPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.customerId = null;
    this.customerData = null;
    this.ticketHistory = [];
    this.sentimentData = null;
  }

  async loadCustomerData(customerId) {
    this.customerId = customerId;

    if (isGuestDemoMode()) {
      const { data, error } = await fetchDemoData('customer-context', { customerId });
      if (error || !data?.context) {
        console.error('Error loading demo customer context:', error);
        this.customerData = null;
        this.ticketHistory = [];
        this.sentimentData = null;
        this.render();
        return;
      }

      this.customerData = data.context.customer;
      this.ticketHistory = data.context.tickets || [];
      this.sentimentData = data.context.sentiment || null;
      this.render();
      return;
    }

    const [customerResult, ticketsResult, sentimentResult] = await Promise.all([
      supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle(),

      supabase
        .from('tickets')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from('sentiment_analytics')
        .select('*')
        .eq('customer_id', customerId)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    if (customerResult.error) {
      console.error('Error loading customer:', customerResult.error);
      return;
    }

    this.customerData = customerResult.data;
    this.ticketHistory = ticketsResult.data || [];
    this.sentimentData = sentimentResult.data;

    this.render();
  }

  render() {
    if (!this.customerData) {
      this.container.innerHTML = '<div class="empty-state">Select a ticket to view customer context</div>';
      return;
    }

    const customer = this.customerData;
    const healthColor = this.getHealthColor(customer.health_score);
    const riskBadge = customer.at_risk ? '<span class="badge badge-danger">At Risk</span>' : '';
    const contractDaysLeft = this.getDaysUntilContractEnd(customer.contract_end_date);

    this.container.innerHTML = `
      <div class="context-panel">
        <div class="context-header">
          <h3>Customer Context</h3>
          <button class="btn-icon" onclick="window.customerContextPanel.refresh()">🔄</button>
        </div>

        <div class="customer-profile">
          <div class="profile-avatar">
            ${this.getInitials(customer.name)}
          </div>
          <div class="profile-info">
            <h4>${this.escapeHtml(customer.name)}</h4>
            <p class="text-muted">${this.escapeHtml(customer.email)}</p>
            ${customer.company ? `<p class="text-muted">${this.escapeHtml(customer.company)}</p>` : ''}
          </div>
        </div>

        <div class="context-section">
          <h5>Account Health</h5>
          <div class="health-score">
            <div class="health-bar">
              <div class="health-bar-fill" style="width: ${customer.health_score}%; background-color: ${healthColor}"></div>
            </div>
            <span class="health-value">${customer.health_score}/100</span>
          </div>
          ${riskBadge}
        </div>

        <div class="context-section">
          <h5>Contract Details</h5>
          <div class="detail-row">
            <span class="detail-label">Tier:</span>
            <span class="detail-value">${customer.contract_tier}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Value:</span>
            <span class="detail-value">$${this.formatNumber(customer.account_value)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Contract Ends:</span>
            <span class="detail-value">${contractDaysLeft}</span>
          </div>
        </div>

        <div class="context-section">
          <h5>Sentiment Trend</h5>
          ${this.renderSentimentTrend()}
        </div>

        <div class="context-section">
          <h5>Recent Tickets (${this.ticketHistory.length})</h5>
          <div class="ticket-timeline">
            ${this.ticketHistory.map(ticket => this.renderTicketHistoryItem(ticket)).join('')}
          </div>
        </div>

        <div class="context-section">
          <h5>Quick Stats</h5>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${this.ticketHistory.length}</div>
              <div class="stat-label">Total Tickets</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.getOpenTicketsCount()}</div>
              <div class="stat-label">Open</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.getAvgResolutionTime()}</div>
              <div class="stat-label">Avg Resolution</div>
            </div>
          </div>
        </div>

        <div class="context-actions">
          <button class="btn-small btn-primary" onclick="window.customerContextPanel.viewFullHistory()">
            View Full History
          </button>
          <button class="btn-small btn-secondary" onclick="window.customerContextPanel.editCustomer()">
            Edit Customer
          </button>
        </div>
      </div>
    `;
  }

  renderSentimentTrend() {
    if (!this.sentimentData) {
      return '<p class="text-muted">No sentiment data available</p>';
    }

    const sentiment = this.sentimentData.avg_sentiment;
    const sentimentLabel = this.getSentimentLabel(sentiment);
    const sentimentColor = this.getSentimentColor(sentiment);

    return `
      <div class="sentiment-indicator">
        <div class="sentiment-bar">
          <div class="sentiment-marker" style="left: ${(sentiment + 1) * 50}%; background-color: ${sentimentColor}"></div>
        </div>
        <div class="sentiment-labels">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
        <p class="sentiment-label" style="color: ${sentimentColor}">${sentimentLabel}</p>
      </div>
    `;
  }

  renderTicketHistoryItem(ticket) {
    const statusIcon = this.getStatusIcon(ticket.status);
    const timeAgo = this.getTimeAgo(ticket.created_at);

    return `
      <div class="timeline-item" onclick="window.customerContextPanel.viewTicket('${ticket.id}')">
        <div class="timeline-icon">${statusIcon}</div>
        <div class="timeline-content">
          <div class="timeline-title">${this.escapeHtml(ticket.subject)}</div>
          <div class="timeline-meta">
            <span class="priority-badge priority-${ticket.priority}">${ticket.priority}</span>
            <span class="text-muted">${timeAgo}</span>
          </div>
        </div>
      </div>
    `;
  }

  getHealthColor(score) {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getSentimentLabel(sentiment) {
    if (sentiment >= 0.5) return 'Very Positive';
    if (sentiment >= 0.2) return 'Positive';
    if (sentiment >= -0.2) return 'Neutral';
    if (sentiment >= -0.5) return 'Negative';
    return 'Very Negative';
  }

  getSentimentColor(sentiment) {
    if (sentiment >= 0.2) return '#10b981';
    if (sentiment >= -0.2) return '#6b7280';
    return '#ef4444';
  }

  getStatusIcon(status) {
    const icons = {
      open: '⚪',
      in_progress: '🔵',
      waiting_customer: '🟡',
      resolved: '🟢',
      closed: '⚫'
    };
    return icons[status] || '⚪';
  }

  getDaysUntilContractEnd(endDate) {
    if (!endDate) return 'N/A';
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays < 30) return `${diffDays} days left`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months left`;
    return `${Math.floor(diffDays / 365)} years left`;
  }

  getOpenTicketsCount() {
    return this.ticketHistory.filter(t => ['open', 'in_progress', 'waiting_customer'].includes(t.status)).length;
  }

  getAvgResolutionTime() {
    const resolved = this.ticketHistory.filter(t => t.resolved_at);
    if (resolved.length === 0) return 'N/A';

    const totalMs = resolved.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at);
      const resolved = new Date(ticket.resolved_at);
      return sum + (resolved - created);
    }, 0);

    const avgMs = totalMs / resolved.length;
    const avgHours = Math.round(avgMs / (1000 * 60 * 60));

    if (avgHours < 24) return `${avgHours}h`;
    return `${Math.round(avgHours / 24)}d`;
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async refresh() {
    if (this.customerId) {
      await this.loadCustomerData(this.customerId);
    }
  }

  viewTicket(ticketId) {
    window.dispatchEvent(new CustomEvent('view-ticket', { detail: { ticketId } }));
  }

  viewFullHistory() {
    window.dispatchEvent(new CustomEvent('view-customer-history', { detail: { customerId: this.customerId } }));
  }

  editCustomer() {
    window.dispatchEvent(new CustomEvent('edit-customer', { detail: { customerId: this.customerId } }));
  }
}
