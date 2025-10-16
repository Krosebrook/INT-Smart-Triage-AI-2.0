/**
 * Real-time Collaboration Service using Supabase Realtime
 *
 * WebSocket-based real-time features including:
 * - Live report updates and notifications
 * - Real-time note collaboration
 * - CSR presence tracking
 * - Team activity broadcasts
 * - Live ticket status updates
 *
 * @module RealtimeService
 * @since 1.0.0
 */

import { supabase } from './supabaseClient.js';
import { logger } from './logger.js';

/**
 * Real-time Service for WebSocket-based collaboration and notifications.
 *
 * @class RealtimeService
 */
class RealtimeService {
  /**
   * Initialize the Realtime Service.
   *
   * @constructor
   */
  constructor() {
    /**
     * Map of active subscription channels.
     * Key: channel name, Value: Supabase channel object
     *
     * @type {Map<string, Object>}
     * @private
     */
    this.channels = new Map();

    /**
     * Map of presence states for online users.
     * Key: channel name, Value: presence state object
     *
     * @type {Map<string, Object>}
     * @private
     */
    this.presenceStates = new Map();

    /**
     * Map of event handlers by event name.
     * Key: event name, Value: array of handler functions
     *
     * @type {Map<string, Array<Function>>}
     * @private
     */
    this.eventHandlers = new Map();
  }

  /**
   * Subscribe to real-time report updates.
   *
   * Listens for INSERT, UPDATE, and DELETE operations on the reports table.
   * Useful for dashboards that need to show live ticket updates.
   *
   * @param {Function} callback - Function called when report changes occur
   * @returns {Object|null} Subscription channel object or null if database unavailable
   *
   * @example
   * const channel = realtimeService.subscribeToReports((payload) => {
   *   console.log('Report changed:', payload.eventType, payload.new);
   *   // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
   *   // payload.new: new/updated record data
   *   // payload.old: old record data (for UPDATE/DELETE)
   * });
   */
  subscribeToReports(callback) {
    if (!supabase) {
      logger.warn('Supabase not configured - realtime features disabled');
      return null;
    }

    const channel = supabase
      .channel('reports-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'reports',
        },
        (payload) => {
          logger.debug('Report change detected', {
            eventType: payload.eventType,
          });
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set('reports', channel);
    return channel;
  }

  /**
   * Subscribe to real-time notes for a specific report.
   *
   * Listens for note additions, updates, and deletions for a report.
   *
   * @param {string} reportId - Report ID to subscribe to
   * @param {Function} callback - Function called when notes change
   * @returns {Object|null} Subscription channel object or null if database unavailable
   *
   * @example
   * const channel = realtimeService.subscribeToNotes('TR-12345', (payload) => {
   *   if (payload.eventType === 'INSERT') {
   *     console.log('New note added:', payload.new);
   *   }
   * });
   */
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
          logger.debug('Note change detected', {
            eventType: payload.eventType,
          });
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(`notes-${reportId}`, channel);
    return channel;
  }

  /**
   * Track CSR presence (online/offline status).
   *
   * Shows who is currently online and their status.
   * Automatically broadcasts presence updates to all connected clients.
   *
   * @param {string} csrName - CSR name to track
   * @param {string} [status='online'] - Initial status
   * @returns {Object|null} Presence channel object or null if database unavailable
   *
   * @example
   * const channel = realtimeService.trackPresence('Sarah Johnson', 'online');
   *
   * // Listen for presence changes
   * realtimeService.on('presence-update', (state) => {
   *   console.log('Online CSRs:', Object.keys(state));
   * });
   *
   * realtimeService.on('presence-join', ({ key }) => {
   *   console.log(`${key} came online`);
   * });
   *
   * realtimeService.on('presence-leave', ({ key }) => {
   *   console.log(`${key} went offline`);
   * });
   */
  trackPresence(csrName, _status = 'online') {
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
        logger.debug('CSR joined', { csrName: key });
        this.triggerEvent('presence-join', { key, presences: newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        logger.debug('CSR left', { csrName: key });
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

  /**
   * Broadcast ticket activity to all connected clients.
   *
   * Used to notify team members of ticket changes in real-time.
   *
   * @param {string} reportId - Report ID
   * @param {Object} activity - Activity data
   * @param {string} activity.type - Activity type (e.g., 'assigned', 'updated', 'note_added')
   * @param {string} activity.user - User who performed the activity
   * @param {string} [activity.message] - Activity message
   * @returns {void}
   *
   * @example
   * realtimeService.broadcastTicketActivity('TR-12345', {
   *   type: 'assigned',
   *   user: 'Sarah Johnson',
   *   message: 'Ticket assigned to Sarah Johnson'
   * });
   */
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

  /**
   * Subscribe to ticket activity broadcasts.
   *
   * @param {Function} callback - Function called when activity occurs
   * @returns {Object|null} Subscription channel or null if database unavailable
   *
   * @example
   * const channel = realtimeService.subscribeToTicketActivity((payload) => {
   *   console.log('Ticket activity:', payload.activity);
   *   showNotification(`${payload.activity.message}`);
   * });
   */
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

  /**
   * Notify all connected CSRs with a broadcast message.
   *
   * Useful for system announcements, urgent notifications, etc.
   *
   * @param {string} message - Message to broadcast
   * @param {string} [priority='normal'] - Priority level (normal/high/urgent)
   * @returns {void}
   *
   * @example
   * realtimeService.notifyCSRs(
   *   'System maintenance in 10 minutes',
   *   'urgent'
   * );
   */
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

  /**
   * Register event handler for custom events.
   *
   * Allows components to listen for specific realtime events.
   *
   * @param {string} eventName - Event name to listen for
   * @param {Function} handler - Handler function
   * @returns {void}
   *
   * @example
   * realtimeService.on('presence-update', (state) => {
   *   updateOnlineUsers(state);
   * });
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);
  }

  /**
   * Unregister event handler.
   *
   * @param {string} eventName - Event name
   * @param {Function} handler - Handler function to remove
   * @returns {void}
   *
   * @example
   * const handler = (state) => console.log(state);
   * realtimeService.on('presence-update', handler);
   * // Later...
   * realtimeService.off('presence-update', handler);
   */
  off(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) return;

    const handlers = this.eventHandlers.get(eventName);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Trigger custom event with data.
   *
   * @private
   * @param {string} eventName - Event name to trigger
   * @param {*} data - Data to pass to handlers
   * @returns {void}
   */
  triggerEvent(eventName, data) {
    if (!this.eventHandlers.has(eventName)) return;
    this.eventHandlers.get(eventName).forEach((handler) => handler(data));
  }

  /**
   * Get currently online CSRs.
   *
   * @returns {Object} Presence state object with online CSRs
   *
   * @example
   * const onlineCSRs = realtimeService.getOnlineCSRs();
   * console.log('Online:', Object.keys(onlineCSRs));
   */
  getOnlineCSRs() {
    return this.presenceStates.get('csr-presence') || {};
  }

  /**
   * Unsubscribe from a specific channel.
   *
   * @param {string} channelName - Name of channel to unsubscribe from
   * @returns {void}
   *
   * @example
   * realtimeService.unsubscribe('reports');
   */
  unsubscribe(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels and clean up.
   *
   * Call this when component unmounts or user logs out.
   *
   * @returns {void}
   *
   * @example
   * // Component cleanup
   * useEffect(() => {
   *   const channel = realtimeService.subscribeToReports(handleUpdate);
   *   return () => {
   *     realtimeService.unsubscribeAll();
   *   };
   * }, []);
   */
  unsubscribeAll() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.presenceStates.clear();
    this.eventHandlers.clear();
  }
}

/**
 * Singleton instance of the Realtime Service.
 *
 * @type {RealtimeService}
 * @example
 * import { realtimeService } from './realtimeService.js';
 *
 * // Subscribe to report updates
 * realtimeService.subscribeToReports((payload) => {
 *   console.log('Report changed:', payload);
 * });
 *
 * // Track presence
 * realtimeService.trackPresence('John Doe', 'online');
 *
 * // Cleanup on unmount
 * realtimeService.unsubscribeAll();
 */
export const realtimeService = new RealtimeService();

export default realtimeService;
