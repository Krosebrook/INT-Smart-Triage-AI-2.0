import { followUpService } from '../services/followUpService.js';
import { supabase } from '../services/supabaseClient.js';

export class FollowUpManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.pendingFollowUps = [];
    this.upcomingFollowUps = [];
  }

  async init() {
    await this.loadFollowUps();
    this.render();
  }

  async loadFollowUps() {
    this.pendingFollowUps = await followUpService.getPendingFollowUps();
    this.upcomingFollowUps = await followUpService.getUpcomingFollowUps(20);
  }

  async scheduleFollowUp(ticketId, type, hours) {
    try {
      await followUpService.scheduleFollowUp(ticketId, type, hours);
      await this.loadFollowUps();
      this.render();
      return true;
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      return false;
    }
  }

  async executeFollowUp(followUpId) {
    try {
      await followUpService.executeFollowUp(followUpId);
      await this.loadFollowUps();
      this.render();
      return true;
    } catch (error) {
      console.error('Error executing follow-up:', error);
      return false;
    }
  }

  async cancelFollowUp(followUpId) {
    try {
      await followUpService.cancelFollowUp(followUpId);
      await this.loadFollowUps();
      this.render();
      return true;
    } catch (error) {
      console.error('Error canceling follow-up:', error);
      return false;
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="followup-manager">
        <div class="followup-header">
          <h3>Follow-Up Management</h3>
          <button class="btn-primary btn-small" onclick="window.followUpManager.showScheduleDialog()">
            + Schedule Follow-Up
          </button>
        </div>

        <div class="followup-section">
          <h4>Pending Follow-Ups (${this.pendingFollowUps.length})</h4>
          ${this.pendingFollowUps.length > 0 ? `
            <div class="followup-list">
              ${this.pendingFollowUps.map(fu => this.renderFollowUpCard(fu, true)).join('')}
            </div>
          ` : '<div class="empty-state">No pending follow-ups</div>'}
        </div>

        <div class="followup-section">
          <h4>Upcoming Follow-Ups</h4>
          ${this.upcomingFollowUps.length > 0 ? `
            <div class="followup-list">
              ${this.upcomingFollowUps.map(fu => this.renderFollowUpCard(fu, false)).join('')}
            </div>
          ` : '<div class="empty-state">No upcoming follow-ups scheduled</div>'}
        </div>
      </div>

      <div id="scheduleFollowUpModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h4>Schedule Follow-Up</h4>
            <button class="btn-icon" onclick="window.followUpManager.closeScheduleDialog()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Ticket Number</label>
              <input type="text" id="followUpTicketNumber" class="form-input" placeholder="TKT-12345">
            </div>
            <div class="form-group">
              <label>Follow-Up Type</label>
              <select id="followUpType" class="form-input">
                <option value="check_in">Check-In</option>
                <option value="resolution_confirm">Resolution Confirmation</option>
                <option value="satisfaction_survey">Satisfaction Survey</option>
              </select>
            </div>
            <div class="form-group">
              <label>Schedule In (hours)</label>
              <input type="number" id="followUpHours" class="form-input" value="24" min="1">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="window.followUpManager.closeScheduleDialog()">Cancel</button>
            <button class="btn-primary" onclick="window.followUpManager.saveScheduledFollowUp()">Schedule</button>
          </div>
        </div>
      </div>
    `;
  }

  renderFollowUpCard(followUp, isPending) {
    const scheduledDate = new Date(followUp.scheduled_for);
    const ticket = followUp.ticket;
    const customer = ticket?.customer;

    return `
      <div class="followup-card ${isPending ? 'pending' : ''}">
        <div class="followup-card-header">
          <div>
            <strong>Ticket #${ticket?.ticket_number || 'Unknown'}</strong>
            <span class="badge">${followUp.follow_up_type.replace('_', ' ')}</span>
          </div>
          <div class="followup-time">
            ${scheduledDate.toLocaleString()}
          </div>
        </div>
        <div class="followup-card-body">
          <p><strong>Customer:</strong> ${this.escapeHtml(customer?.name || 'Unknown')}</p>
          <p><strong>Subject:</strong> ${this.escapeHtml(ticket?.subject || 'N/A')}</p>
          <p class="followup-preview">${this.escapeHtml(followUp.message_template.substring(0, 100))}...</p>
        </div>
        <div class="followup-card-actions">
          ${isPending ? `
            <button class="btn-small btn-primary" onclick="window.followUpManager.executeFollowUpAction('${followUp.id}')">
              Execute Now
            </button>
          ` : ''}
          <button class="btn-small btn-secondary" onclick="window.followUpManager.viewTicketAction('${ticket?.id}')">
            View Ticket
          </button>
          <button class="btn-small btn-secondary" onclick="window.followUpManager.cancelFollowUpAction('${followUp.id}')">
            Cancel
          </button>
        </div>
      </div>
    `;
  }

  showScheduleDialog() {
    document.getElementById('scheduleFollowUpModal').style.display = 'flex';
  }

  closeScheduleDialog() {
    document.getElementById('scheduleFollowUpModal').style.display = 'none';
  }

  async saveScheduledFollowUp() {
    const ticketNumber = document.getElementById('followUpTicketNumber').value;
    const type = document.getElementById('followUpType').value;
    const hours = parseInt(document.getElementById('followUpHours').value);

    if (!ticketNumber) {
      alert('Please enter a ticket number');
      return;
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('id')
      .eq('ticket_number', ticketNumber)
      .maybeSingle();

    if (error || !ticket) {
      alert('Ticket not found');
      return;
    }

    const success = await this.scheduleFollowUp(ticket.id, type, hours);
    if (success) {
      alert('Follow-up scheduled successfully!');
      this.closeScheduleDialog();
    } else {
      alert('Failed to schedule follow-up');
    }
  }

  async executeFollowUpAction(followUpId) {
    const success = await this.executeFollowUp(followUpId);
    if (success) {
      alert('Follow-up executed successfully!');
    } else {
      alert('Failed to execute follow-up');
    }
  }

  async cancelFollowUpAction(followUpId) {
    if (!confirm('Are you sure you want to cancel this follow-up?')) {
      return;
    }

    const success = await this.cancelFollowUp(followUpId);
    if (success) {
      alert('Follow-up cancelled');
    } else {
      alert('Failed to cancel follow-up');
    }
  }

  viewTicketAction(ticketId) {
    window.dispatchEvent(new CustomEvent('view-ticket', { detail: { ticketId } }));
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
