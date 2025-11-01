import { z } from "zod";
import { supabase } from "../supabaseClient.js";
import { notificationService, NotificationService } from "../services/notifications.ts";

const queueTicketSchema = z.object({
  id: z.number().optional(),
  report_id: z.string(),
  customer_name: z.string(),
  ticket_subject: z.string(),
  priority: z.enum(["low", "medium", "high"]).catch("medium"),
  status: z.string(),
  sla_status: z.enum(["on_track", "warning", "breached", "resolved"]).catch("on_track"),
  assigned_to: z.string().nullable(),
  first_response_due_at: z.string().nullable(),
  first_response_at: z.string().nullable(),
  resolution_due_at: z.string().nullable(),
  resolution_at: z.string().nullable(),
  created_at: z.string(),
  organization_id: z.string().nullable(),
});

type QueueTicket = z.infer<typeof queueTicketSchema>;

const SLA_STATUS_COLORS: Record<QueueTicket["sla_status"], string> = {
  on_track: "badge-success",
  warning: "badge-warning",
  breached: "badge-danger",
  resolved: "badge-neutral",
};

export class QueueDashboardPage {
  private container: HTMLElement | null;
  private tickets: QueueTicket[] = [];
  private loading = false;
  private filter: "all" | "warning" | "breached" = "all";

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`QueueDashboardPage: container ${containerId} not found`);
    }
  }

  async init() {
    await this.loadTickets();
    this.render();
  }

  private setLoading(state: boolean) {
    this.loading = state;
    if (state) {
      this.container!.innerHTML = '<div class="loading">Loading queue...</div>';
    }
  }

  private toDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }

  private getDueBadge(ticket: QueueTicket) {
    const dueAt = this.toDate(ticket.resolution_due_at);
    if (!dueAt) return "<span class=\"badge\">No target</span>";
    const now = new Date();
    const diffHours = Math.round((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    const className = diffHours < 0 ? "badge-danger" : diffHours <= 2 ? "badge-warning" : "badge-info";
    const label = diffHours < 0 ? `${Math.abs(diffHours)}h overdue` : `${diffHours}h remaining`;
    return `<span class=\"badge ${className}\">${label}</span>`;
  }

  private getQueueSummary() {
    const total = this.tickets.length;
    const warnings = this.tickets.filter(ticket => ticket.sla_status === "warning").length;
    const breaches = this.tickets.filter(ticket => ticket.sla_status === "breached").length;
    return { total, warnings, breaches };
  }

  private renderTickets() {
    const filtered = this.tickets.filter(ticket => {
      if (this.filter === "all") return true;
      return ticket.sla_status === this.filter;
    });

    if (filtered.length === 0) {
      return '<div class="empty-state">No tickets match the current filter.</div>';
    }

    return filtered
      .map(ticket => {
        const dueBadge = this.getDueBadge(ticket);
        const statusBadge = SLA_STATUS_COLORS[ticket.sla_status];
        return `
          <div class="queue-card">
            <div class="queue-card-header">
              <div>
                <h3>${ticket.ticket_subject}</h3>
                <p class="queue-card-subtitle">${ticket.customer_name} · Priority ${ticket.priority}</p>
              </div>
              <div class="queue-card-actions">
                <span class="badge ${statusBadge}">${ticket.sla_status.replace('_', ' ')}</span>
                ${dueBadge}
                <button class="btn btn-secondary" data-alert="${ticket.report_id}">Send Alert</button>
              </div>
            </div>
            <div class="queue-card-body">
              <div>Assigned to: ${ticket.assigned_to ?? 'Unassigned'}</div>
              <div>Status: ${ticket.status}</div>
              <div>Created: ${new Date(ticket.created_at).toLocaleString()}</div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  private renderFilters() {
    return `
      <div class="queue-filters">
        <button class="btn ${this.filter === 'all' ? 'btn-primary' : 'btn-ghost'}" data-filter="all">All</button>
        <button class="btn ${this.filter === 'warning' ? 'btn-primary' : 'btn-ghost'}" data-filter="warning">Warnings</button>
        <button class="btn ${this.filter === 'breached' ? 'btn-primary' : 'btn-ghost'}" data-filter="breached">Breaches</button>
      </div>
    `;
  }

  private renderLayout() {
    const summary = this.getQueueSummary();
    this.container!.innerHTML = `
      <section class="queue-dashboard">
        <header class="queue-header">
          <div>
            <h1>Operational Queue</h1>
            <p>Real-time SLA monitoring across all tickets.</p>
          </div>
          <div class="queue-stats">
            <div class="stat">
              <span class="stat-value">${summary.total}</span>
              <span class="stat-label">Open Tickets</span>
            </div>
            <div class="stat">
              <span class="stat-value">${summary.warnings}</span>
              <span class="stat-label">SLA Warnings</span>
            </div>
            <div class="stat">
              <span class="stat-value">${summary.breaches}</span>
              <span class="stat-label">SLA Breaches</span>
            </div>
          </div>
        </header>
        ${this.renderFilters()}
        <section class="queue-list">${this.renderTickets()}</section>
      </section>
    `;

    this.attachEventHandlers();
  }

  private attachEventHandlers() {
    const buttons = this.container!.querySelectorAll<HTMLButtonElement>("button[data-filter]");
    buttons.forEach(button =>
      button.addEventListener("click", event => {
        const target = event.currentTarget as HTMLButtonElement;
        this.filter = target.dataset.filter as typeof this.filter;
        this.render();
      }),
    );

    const alertButtons = this.container!.querySelectorAll<HTMLButtonElement>("button[data-alert]");
    alertButtons.forEach(button =>
      button.addEventListener("click", async event => {
        const target = event.currentTarget as HTMLButtonElement;
        const reportId = target.dataset.alert;
        const ticket = this.tickets.find(item => item.report_id === reportId);
        if (!ticket) return;
        target.disabled = true;
        target.textContent = "Sending...";

        try {
          await notificationService.sendSlaBreachAlert({
            reportId: ticket.report_id,
            ticketId: ticket.id,
            slaType: "resolution",
            severity: ticket.sla_status === "breached" ? "critical" : "warning",
            breachDetectedAt: new Date(),
            dueAt: ticket.resolution_due_at ?? ticket.created_at,
            priority: ticket.priority,
            assignedTo: ticket.assigned_to ?? undefined,
            organizationId: ticket.organization_id ?? undefined,
            metadata: { status: ticket.status },
            recipients: {},
          });
          target.textContent = "Alert Sent";
        } catch (error) {
          console.error("Failed to send alert", error);
          target.textContent = "Retry";
          alert("Failed to send SLA alert. Check console for details.");
        } finally {
          setTimeout(() => {
            target.disabled = false;
            target.textContent = "Send Alert";
          }, 2000);
        }
      }),
    );
  }

  async refresh() {
    await this.loadTickets();
    this.render();
  }

  private render() {
    if (this.loading) return;
    this.renderLayout();
  }

  private async loadTickets() {
    if (!supabase) {
      console.warn("Supabase client not configured; queue unavailable");
      this.tickets = [];
      return;
    }

    this.setLoading(true);

    try {
      const { data, error } = await supabase
        .from("reports")
        .select(
          `id, report_id, customer_name, ticket_subject, priority, status, sla_status, assigned_to, first_response_due_at, first_response_at, resolution_due_at, resolution_at, created_at, organization_id`,
        )
        .eq("status", "in_progress")
        .order("resolution_due_at", { ascending: true })
        .limit(100);

      if (error) {
        throw error;
      }

      const parsed = z.array(queueTicketSchema).parse(data ?? []);
      this.tickets = parsed.map(ticket => ({
        ...ticket,
        // ensure due dates string
        resolution_due_at: ticket.resolution_due_at,
      }));
    } catch (error) {
      console.error("Failed to load queue", error);
      this.tickets = [];
    } finally {
      this.loading = false;
    }
  }
}

export function mountQueueDashboard(containerId: string) {
  const dashboard = new QueueDashboardPage(containerId);
  dashboard.init();
  return dashboard;
}

export { notificationService, NotificationService };
