import { supabase } from '../services/supabaseClient.js';

export class NotificationCenter {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.subscriptions = [];
  }

  init() {
    this.createContainer();
    this.setupRealtimeListeners();
  }

  createContainer() {
    const existing = document.getElementById('notificationCenter');
    if (existing) {
      this.container = existing;
      return;
    }

    this.container = document.createElement('div');
    this.container.id = 'notificationCenter';
    this.container.className = 'notification-center';
    document.body.appendChild(this.container);

    const style = document.createElement('style');
    style.textContent = `
      .notification-center {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
      }

      .notification-toast {
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .notification-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .notification-content {
        flex: 1;
      }

      .notification-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #111827;
      }

      .notification-message {
        font-size: 14px;
        color: #6b7280;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #9ca3af;
        padding: 0;
        line-height: 1;
      }

      .notification-close:hover {
        color: #4b5563;
      }

      .notification-toast.info { border-left: 4px solid #3b82f6; }
      .notification-toast.success { border-left: 4px solid #10b981; }
      .notification-toast.warning { border-left: 4px solid #f59e0b; }
      .notification-toast.error { border-left: 4px solid #ef4444; }
      .notification-toast.urgent { border-left: 4px solid #dc2626; background: #fef2f2; }
    `;
    document.head.appendChild(style);
  }

  setupRealtimeListeners() {
    const ticketChannel = supabase
      .channel('ticket-notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tickets' },
        (payload) => {
          this.showNotification({
            type: 'info',
            title: 'New Ticket',
            message: `${payload.new.ticket_number}: ${payload.new.subject}`,
            icon: '🎫'
          });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: 'escalated=eq.true' },
        (payload) => {
          if (payload.new.escalated && !payload.old.escalated) {
            this.showNotification({
              type: 'urgent',
              title: 'Ticket Escalated',
              message: `${payload.new.ticket_number} has been escalated`,
              icon: '⚠️',
              duration: 10000
            });
          }
        }
      )
      .subscribe();

    this.subscriptions.push(ticketChannel);

    const escalationChannel = supabase
      .channel('escalation-notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'escalations' },
        (payload) => {
          if (payload.new.ai_detected) {
            this.showNotification({
              type: 'warning',
              title: 'AI Detected Escalation',
              message: `Ticket requires senior attention: ${payload.new.reason}`,
              icon: '🤖',
              duration: 8000
            });
          }
        }
      )
      .subscribe();

    this.subscriptions.push(escalationChannel);

    const messageChannel = supabase
      .channel('message-notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: 'sender_type=eq.customer' },
        (payload) => {
          this.showNotification({
            type: 'info',
            title: 'New Customer Message',
            message: payload.new.message.substring(0, 80) + '...',
            icon: '💬'
          });
        }
      )
      .subscribe();

    this.subscriptions.push(messageChannel);

    const followUpChannel = supabase
      .channel('followup-notifications')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ticket_follow_ups', filter: 'completed=eq.true' },
        (payload) => {
          if (payload.new.completed && !payload.old.completed) {
            this.showNotification({
              type: 'success',
              title: 'Follow-up Completed',
              message: `Follow-up sent for ${payload.new.follow_up_type}`,
              icon: '✅'
            });
          }
        }
      )
      .subscribe();

    this.subscriptions.push(followUpChannel);
  }

  showNotification({ type = 'info', title, message, icon = 'ℹ️', duration = 5000 }) {
    const id = Date.now();
    const notification = {
      id,
      type,
      title,
      message,
      icon
    };

    this.notifications.push(notification);
    this.render();

    setTimeout(() => {
      this.removeNotification(id);
    }, duration);
  }

  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = this.notifications.map(notif => `
      <div class="notification-toast ${notif.type}" data-id="${notif.id}">
        <div class="notification-icon">${notif.icon}</div>
        <div class="notification-content">
          <div class="notification-title">${this.escapeHtml(notif.title)}</div>
          <div class="notification-message">${this.escapeHtml(notif.message)}</div>
        </div>
        <button class="notification-close" onclick="window.notificationCenter.removeNotification(${notif.id})">×</button>
      </div>
    `).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    this.subscriptions.forEach(sub => {
      supabase.removeChannel(sub);
    });
    if (this.container) {
      this.container.remove();
    }
  }
}

export const notificationCenter = new NotificationCenter();
