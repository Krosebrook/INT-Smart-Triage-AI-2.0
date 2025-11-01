import { supabase } from '../services/supabaseClient.js';

export class CSRAssignmentPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.csrs = [];
    this.unassignedTickets = [];
    this.assignedTickets = [];
  }

  async init() {
    await this.loadData();
    this.render();
  }

  async loadData() {
    const [csrResult, ticketsResult] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .in('role', ['csr', 'senior_csr'])
        .order('name'),

      supabase
        .from('tickets')
        .select(`
          *,
          customer:customers(name),
          assigned_user:users(name)
        `)
        .in('status', ['open', 'in_progress'])
        .order('priority')
    ]);

    this.csrs = csrResult.data || [];

    const tickets = ticketsResult.data || [];
    this.unassignedTickets = tickets.filter(t => !t.assigned_to);
    this.assignedTickets = tickets.filter(t => t.assigned_to);
  }

  async assignTicket(ticketId, csrId) {
    const { error } = await supabase
      .from('tickets')
      .update({
        assigned_to: csrId,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) {
      console.error('Error assigning ticket:', error);
      return false;
    }

    await this.loadData();
    this.render();
    return true;
  }

  async unassignTicket(ticketId) {
    const { error } = await supabase
      .from('tickets')
      .update({
        assigned_to: null,
        status: 'open',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) {
      console.error('Error unassigning ticket:', error);
      return false;
    }

    await this.loadData();
    this.render();
    return true;
  }

  getCSRWorkload(csrId) {
    return this.assignedTickets.filter(t => t.assigned_to === csrId).length;
  }

  render() {
    this.container.innerHTML = `
      <div class="assignment-panel">
        <div class="assignment-header">
          <h3>CSR Assignment Dashboard</h3>
          <button class="btn-secondary btn-small" onclick="window.csrAssignmentPanel.autoAssignTickets()">
            🤖 Auto-Assign
          </button>
        </div>

        <div class="assignment-grid">
          <div class="assignment-column">
            <h4>Unassigned Tickets (${this.unassignedTickets.length})</h4>
            <div class="ticket-list">
              ${this.unassignedTickets.map(ticket => this.renderTicketCard(ticket, false)).join('')}
              ${this.unassignedTickets.length === 0 ? '<div class="empty-state">No unassigned tickets</div>' : ''}
            </div>
          </div>

          <div class="assignment-column">
            <h4>CSR Workload</h4>
            <div class="csr-list">
              ${this.csrs.map(csr => this.renderCSRCard(csr)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderTicketCard(ticket, showUnassign) {
    return `
      <div class="assignment-ticket-card priority-${ticket.priority}">
        <div class="ticket-header">
          <span class="ticket-number">#${ticket.ticket_number}</span>
          <span class="priority-badge priority-${ticket.priority}">${ticket.priority}</span>
        </div>
        <div class="ticket-subject">${this.escapeHtml(ticket.subject)}</div>
        <div class="ticket-customer">${this.escapeHtml(ticket.customer?.name || 'Unknown')}</div>
        ${showUnassign ? `
          <div class="ticket-assignment">
            <span>Assigned to: ${this.escapeHtml(ticket.assigned_user?.name || 'Unknown')}</span>
            <button class="btn-small btn-secondary" onclick="window.csrAssignmentPanel.unassignTicketAction('${ticket.id}')">
              Unassign
            </button>
          </div>
        ` : `
          <div class="ticket-actions">
            <select class="csr-select" id="csr-${ticket.id}">
              <option value="">Select CSR...</option>
              ${this.csrs.map(csr => `
                <option value="${csr.id}">${csr.name} (${this.getCSRWorkload(csr.id)})</option>
              `).join('')}
            </select>
            <button class="btn-small btn-primary" onclick="window.csrAssignmentPanel.assignTicketAction('${ticket.id}')">
              Assign
            </button>
          </div>
        `}
      </div>
    `;
  }

  renderCSRCard(csr) {
    const workload = this.getCSRWorkload(csr.id);
    const maxLoad = csr.max_concurrent_tickets || 5;
    const loadPercent = (workload / maxLoad) * 100;
    const loadClass = loadPercent >= 100 ? 'overloaded' : loadPercent >= 80 ? 'high-load' : 'normal-load';

    const csrTickets = this.assignedTickets.filter(t => t.assigned_to === csr.id);

    return `
      <div class="csr-card ${loadClass}">
        <div class="csr-header">
          <div>
            <strong>${this.escapeHtml(csr.name)}</strong>
            <div class="csr-role">${csr.role}</div>
          </div>
          <div class="csr-status ${csr.availability_status}">
            ${csr.availability_status}
          </div>
        </div>
        <div class="csr-workload">
          <div class="workload-bar">
            <div class="workload-fill ${loadClass}" style="width: ${Math.min(loadPercent, 100)}%"></div>
          </div>
          <span>${workload} / ${maxLoad} tickets</span>
        </div>
        <div class="csr-specializations">
          ${csr.specializations?.map(spec => `<span class="spec-badge">${spec}</span>`).join('') || ''}
        </div>
        ${csrTickets.length > 0 ? `
          <div class="csr-tickets">
            <strong>Current Tickets:</strong>
            <div class="csr-ticket-list">
              ${csrTickets.slice(0, 3).map(ticket => `
                <div class="csr-ticket-item">
                  #${ticket.ticket_number} - ${ticket.priority}
                </div>
              `).join('')}
              ${csrTickets.length > 3 ? `<div class="text-muted">+${csrTickets.length - 3} more</div>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  async assignTicketAction(ticketId) {
    const select = document.getElementById(`csr-${ticketId}`);
    const csrId = select.value;

    if (!csrId) {
      alert('Please select a CSR');
      return;
    }

    const success = await this.assignTicket(ticketId, csrId);
    if (success) {
      alert('Ticket assigned successfully!');
    } else {
      alert('Failed to assign ticket');
    }
  }

  async unassignTicketAction(ticketId) {
    const success = await this.unassignTicket(ticketId);
    if (success) {
      alert('Ticket unassigned');
    } else {
      alert('Failed to unassign ticket');
    }
  }

  async autoAssignTickets() {
    if (this.unassignedTickets.length === 0) {
      alert('No unassigned tickets to assign');
      return;
    }

    let assigned = 0;

    for (const ticket of this.unassignedTickets) {
      const availableCSRs = this.csrs
        .filter(csr => {
          const workload = this.getCSRWorkload(csr.id);
          const maxLoad = csr.max_concurrent_tickets || 5;
          return workload < maxLoad && csr.availability_status === 'available';
        })
        .filter(csr => {
          if (csr.specializations && csr.specializations.length > 0) {
            return csr.specializations.includes(ticket.category);
          }
          return true;
        });

      if (availableCSRs.length === 0) continue;

      availableCSRs.sort((a, b) => {
        const aLoad = this.getCSRWorkload(a.id);
        const bLoad = this.getCSRWorkload(b.id);
        return aLoad - bLoad;
      });

      const selectedCSR = availableCSRs[0];
      const success = await this.assignTicket(ticket.id, selectedCSR.id);
      if (success) assigned++;
    }

    alert(`Auto-assigned ${assigned} tickets`);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
