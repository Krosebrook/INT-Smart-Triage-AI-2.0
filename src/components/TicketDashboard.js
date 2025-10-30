import { supabase } from '../services/supabaseClient.js';

export class TicketDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.tickets = [];
    this.filter = { status: 'all', priority: 'all', assigned: 'all' };
    this.subscription = null;
  }

  async init() {
    await this.loadTickets();
    this.setupRealtimeSubscription();
    this.render();
    this.attachEventListeners();
  }

  async loadTickets() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customers(name, email, company, health_score),
        assigned_user:users(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading tickets:', error);
      return;
    }

    this.tickets = data || [];
  }

  setupRealtimeSubscription() {
    this.subscription = supabase
      .channel('tickets-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload) => {
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe();
  }

  handleRealtimeUpdate(payload) {
    if (payload.eventType === 'INSERT') {
      this.tickets.unshift(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const index = this.tickets.findIndex(t => t.id === payload.new.id);
      if (index !== -1) {
        this.tickets[index] = payload.new;
      }
    } else if (payload.eventType === 'DELETE') {
      this.tickets = this.tickets.filter(t => t.id !== payload.old.id);
    }
    this.render();
  }

  getFilteredTickets() {
    return this.tickets.filter(ticket => {
      if (this.filter.status !== 'all' && ticket.status !== this.filter.status) {
        return false;
      }
      if (this.filter.priority !== 'all' && ticket.priority !== this.filter.priority) {
        return false;
      }
      if (this.filter.assigned === 'mine') {
        return ticket.assigned_to !== null;
      }
      if (this.filter.assigned === 'unassigned') {
        return ticket.assigned_to === null;
      }
      return true;
    });
  }

  render() {
    const filteredTickets = this.getFilteredTickets();
    const statusCounts = this.getStatusCounts();

    this.container.innerHTML = `
      <div class="dashboard-header">
        <h2>Live Ticket Dashboard</h2>
        <div class="status-badges">
          <span class="badge badge-open">${statusCounts.open} Open</span>
          <span class="badge badge-progress">${statusCounts.in_progress} In Progress</span>
          <span class="badge badge-urgent">${statusCounts.urgent} Urgent</span>
        </div>
      </div>

      <div class="dashboard-filters">
        <select id="statusFilter" class="filter-select">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_customer">Waiting on Customer</option>
          <option value="resolved">Resolved</option>
        </select>

        <select id="priorityFilter" class="filter-select">
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select id="assignedFilter" class="filter-select">
          <option value="all">All Tickets</option>
          <option value="mine">My Tickets</option>
          <option value="unassigned">Unassigned</option>
        </select>

        <button id="refreshBtn" class="btn-icon">🔄</button>
      </div>

      <div class="tickets-grid">
        ${filteredTickets.map(ticket => this.renderTicketCard(ticket)).join('')}
        ${filteredTickets.length === 0 ? '<div class="empty-state">No tickets found</div>' : ''}
      </div>
    `;
  }

  renderTicketCard(ticket) {
    const priorityClass = `priority-${ticket.priority}`;
    const statusClass = `status-${ticket.status}`;
    const timeAgo = this.getTimeAgo(ticket.created_at);
    const customerName = ticket.customer?.name || 'Unknown';
    const assignedTo = ticket.assigned_user?.name || 'Unassigned';
    const healthIndicator = this.getHealthIndicator(ticket.customer?.health_score);

    return `
      <div class="ticket-card ${priorityClass} ${statusClass}" data-ticket-id="${ticket.id}">
        <div class="ticket-header">
          <span class="ticket-number">#${ticket.ticket_number}</span>
          <span class="priority-badge ${priorityClass}">${ticket.priority}</span>
        </div>

        <h3 class="ticket-subject">${this.escapeHtml(ticket.subject)}</h3>

        <div class="ticket-meta">
          <div class="meta-row">
            <span class="meta-label">Customer:</span>
            <span class="meta-value">${this.escapeHtml(customerName)} ${healthIndicator}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Assigned:</span>
            <span class="meta-value">${this.escapeHtml(assignedTo)}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Channel:</span>
            <span class="meta-value">${ticket.channel}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Created:</span>
            <span class="meta-value">${timeAgo}</span>
          </div>
        </div>

        <div class="ticket-actions">
          <button class="btn-small btn-primary" onclick="window.ticketDashboard.viewTicket('${ticket.id}')">View</button>
          ${ticket.assigned_to === null ? `<button class="btn-small btn-secondary" onclick="window.ticketDashboard.assignToMe('${ticket.id}')">Assign to Me</button>` : ''}
        </div>
      </div>
    `;
  }

  getStatusCounts() {
    return {
      open: this.tickets.filter(t => t.status === 'open').length,
      in_progress: this.tickets.filter(t => t.status === 'in_progress').length,
      urgent: this.tickets.filter(t => t.priority === 'urgent').length
    };
  }

  getHealthIndicator(score) {
    if (!score) return '';
    if (score >= 75) return '🟢';
    if (score >= 50) return '🟡';
    return '🔴';
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

  attachEventListeners() {
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const assignedFilter = document.getElementById('assignedFilter');
    const refreshBtn = document.getElementById('refreshBtn');

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filter.status = e.target.value;
        this.render();
      });
    }

    if (priorityFilter) {
      priorityFilter.addEventListener('change', (e) => {
        this.filter.priority = e.target.value;
        this.render();
      });
    }

    if (assignedFilter) {
      assignedFilter.addEventListener('change', (e) => {
        this.filter.assigned = e.target.value;
        this.render();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh());
    }
  }

  async refresh() {
    await this.loadTickets();
    this.render();
  }

  async viewTicket(ticketId) {
    window.dispatchEvent(new CustomEvent('view-ticket', { detail: { ticketId } }));
  }

  async assignToMe(ticketId) {
    const { error } = await supabase
      .from('tickets')
      .update({
        assigned_to: (await supabase.auth.getUser()).data.user?.id,
        status: 'in_progress'
      })
      .eq('id', ticketId);

    if (error) {
      console.error('Error assigning ticket:', error);
      alert('Failed to assign ticket');
    }
  }

  destroy() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
    }
  }
}
