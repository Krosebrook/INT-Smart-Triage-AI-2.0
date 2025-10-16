// Real-time Collaboration Service using Supabase Realtime
import { supabase } from './supabaseClient.js';

class RealtimeService {
  constructor() {
    this.channels = new Map();
    this.presenceStates = new Map();
    this.eventHandlers = new Map();
  }

  subscribeToReports(callback) {
    if (!supabase) {
      
      return null;
    }

    const channel = supabase
      .channel('reports-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
        },
        (payload) => {
          
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set('reports', channel);
    return channel;
  }

  subscribeToNotes(reportId, callback) {
    if (!supabase) return null;

    const channel = supabase
      .channel(`notes-${reportId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_notes',
          filter: `report_id=eq.${reportId}`,
        },
        (payload) => {
          
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(`notes-${reportId}`, channel);
    return channel;
  }

  trackPresence(csrName, status = 'online') {
    if (!supabase) return null;

    const presenceChannel = supabase.channel('csr-presence', {
      config: {
        presence: {
          key: csrName,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        this.presenceStates.set('csr-presence', state);
        this.triggerEvent('presence-update', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        
        this.triggerEvent('presence-join', { key, presences: newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        
        this.triggerEvent('presence-leave', { key, presences: leftPresences });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user: csrName,
            status: status,
            online_at: new Date().toISOString(),
          });
        }
      });

    this.channels.set('presence', presenceChannel);
    return presenceChannel;
  }

  broadcastTicketActivity(reportId, activity) {
    if (!supabase) return;

    const channel =
      this.channels.get('reports') || supabase.channel('reports-channel');

    channel.send({
      type: 'broadcast',
      event: 'ticket-activity',
      payload: {
        reportId,
        activity,
        timestamp: new Date().toISOString(),
      },
    });
  }

  subscribeToTicketActivity(callback) {
    if (!supabase) return null;

    const channel = supabase
      .channel('ticket-activity')
      .on('broadcast', { event: 'ticket-activity' }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set('ticket-activity', channel);
    return channel;
  }

  notifyCSRs(message, priority = 'normal') {
    if (!supabase) return;

    const channel =
      this.channels.get('notifications') ||
      supabase.channel('csr-notifications');

    channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: {
        message,
        priority,
        timestamp: new Date().toISOString(),
      },
    });
  }

  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);
  }

  off(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) return;
    const handlers = this.eventHandlers.get(eventName);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  triggerEvent(eventName, data) {
    if (!this.eventHandlers.has(eventName)) return;
    this.eventHandlers.get(eventName).forEach((handler) => handler(data));
  }

  getOnlineCSRs() {
    return this.presenceStates.get('csr-presence') || {};
  }

  unsubscribe(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.presenceStates.clear();
    this.eventHandlers.clear();
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
