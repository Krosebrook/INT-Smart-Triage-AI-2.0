/**
 * Sync Queue Manager
 *
 * Manages asynchronous synchronization tasks between INT Smart Triage AI
 * and external systems (HubSpot, Freshdesk, Teams).
 *
 * Features:
 * - Priority-based queue processing
 * - Automatic retry with exponential backoff
 * - Concurrent task processing with rate limiting
 * - Dead letter queue for failed tasks
 * - Graceful error handling
 *
 * @module SyncQueue
 * @since 2.0.0
 */

import { supabase } from './supabaseClient.js';
import { logger } from './logger.js';
import { hubspotIntegration } from './hubspotIntegration.js';
import { freshdeskIntegration } from './freshdeskIntegration.js';

/**
 * Sync Queue Manager
 *
 * @class SyncQueue
 */
export class SyncQueue {
  /**
   * Initialize Sync Queue Manager
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.maxConcurrent=5] - Max concurrent tasks
   * @param {number} [options.pollInterval=5000] - Poll interval in ms
   * @param {number} [options.maxRetries=3] - Max retry attempts
   */
  constructor(options = {}) {
    /**
     * Maximum concurrent tasks
     * @type {number}
     * @private
     */
    this.maxConcurrent = options.maxConcurrent || 5;

    /**
     * Poll interval in milliseconds
     * @type {number}
     * @private
     */
    this.pollInterval = options.pollInterval || 5000;

    /**
     * Maximum retry attempts
     * @type {number}
     * @private
     */
    this.maxRetries = options.maxRetries || 3;

    /**
     * Currently running tasks
     * @type {Set<Promise>}
     * @private
     */
    this.runningTasks = new Set();

    /**
     * Queue running status
     * @type {boolean}
     * @private
     */
    this.isRunning = false;

    /**
     * Integration service instances
     * @type {Object}
     * @private
     */
    this.integrations = {
      hubspot: hubspotIntegration,
      freshdesk: freshdeskIntegration,
    };
  }

  // ============================================================================
  // Queue Management
  // ============================================================================

  /**
   * Start queue processing
   *
   * Begins polling for queued tasks and processing them.
   *
   * @async
   * @returns {Promise<void>}
   *
   * @example
   * await syncQueue.start();
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Sync queue already running');
      return;
    }

    this.isRunning = true;
    logger.info('Sync queue started', {
      maxConcurrent: this.maxConcurrent,
      pollInterval: this.pollInterval,
    });

    // Start processing loop
    this.processingLoop();
  }

  /**
   * Stop queue processing
   *
   * Waits for current tasks to complete before stopping.
   *
   * @async
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping sync queue...');
    this.isRunning = false;

    // Wait for all running tasks to complete
    await Promise.allSettled(Array.from(this.runningTasks));

    logger.info('Sync queue stopped');
  }

  /**
   * Main processing loop
   *
   * Continuously polls for and processes queued tasks.
   *
   * @async
   * @private
   * @returns {Promise<void>}
   */
  async processingLoop() {
    while (this.isRunning) {
      try {
        // Check if we can process more tasks
        if (this.runningTasks.size < this.maxConcurrent) {
          await this.processNextTask();
        }

        // Wait before next poll
        await this.sleep(this.pollInterval);
      } catch (error) {
        logger.error('Error in sync queue processing loop', { error });
        // Continue processing despite errors
      }
    }
  }

  /**
   * Process next queued task
   *
   * @async
   * @private
   * @returns {Promise<void>}
   */
  async processNextTask() {
    try {
      // Get next task from queue (using database function)
      const { data, error } = await supabase.rpc('get_next_sync_task');

      if (error) throw error;

      // No tasks available
      if (!data || data.length === 0) {
        return;
      }

      const task = data[0];

      // Mark task as processing
      await supabase
        .from('sync_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', task.task_id);

      // Process task asynchronously
      const taskPromise = this.executeTask(task).finally(() => {
        this.runningTasks.delete(taskPromise);
      });

      this.runningTasks.add(taskPromise);
    } catch (error) {
      logger.error('Error getting next task', { error });
    }
  }

  /**
   * Execute a sync task
   *
   * @async
   * @private
   * @param {Object} task - Task to execute
   * @returns {Promise<void>}
   */
  async executeTask(task) {
    const {
      task_id,
      integration_type,
      operation,
      entity_type,
      entity_id,
      payload,
    } = task;

    logger.info('Executing sync task', {
      taskId: task_id,
      integration: integration_type,
      operation,
      entityType: entity_type,
    });

    try {
      // Route to appropriate integration
      const result = await this.routeTask(
        integration_type,
        operation,
        entity_type,
        entity_id,
        payload
      );

      if (result.success) {
        // Mark task as completed
        await supabase
          .from('sync_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', task_id);

        logger.info('Sync task completed', { taskId: task_id });
      } else {
        // Task failed, handle retry
        await this.handleTaskFailure(task_id, result.error);
      }
    } catch (error) {
      await this.handleTaskFailure(task_id, error.message);
    }
  }

  /**
   * Route task to appropriate integration service
   *
   * @async
   * @private
   * @param {string} integrationType - Integration type (hubspot/freshdesk)
   * @param {string} operation - Operation (create/update/sync)
   * @param {string} entityType - Entity type (contact/ticket)
   * @param {string} entityId - Entity ID
   * @param {Object} payload - Task payload
   * @returns {Promise<Object>} Operation result
   */
  async routeTask(integrationType, operation, entityType, entityId, payload) {
    const integration = this.integrations[integrationType];

    if (!integration) {
      return {
        success: false,
        error: `Unknown integration type: ${integrationType}`,
      };
    }

    // Route to appropriate method based on integration and operation
    try {
      switch (integrationType) {
        case 'hubspot':
          return await this.routeHubSpotTask(
            integration,
            operation,
            entityType,
            payload
          );

        case 'freshdesk':
          return await this.routeFreshdeskTask(
            integration,
            operation,
            entityType,
            payload
          );

        default:
          return { success: false, error: 'Integration not implemented' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Route HubSpot task
   *
   * @async
   * @private
   * @param {Object} integration - HubSpot integration instance
   * @param {string} operation - Operation type
   * @param {string} entityType - Entity type
   * @param {Object} payload - Task payload
   * @returns {Promise<Object>} Operation result
   */
  async routeHubSpotTask(integration, operation, entityType, payload) {
    switch (entityType) {
      case 'contact':
        if (
          operation === 'sync' ||
          operation === 'create' ||
          operation === 'update'
        ) {
          return await integration.syncContact(payload);
        }
        break;

      case 'deal':
        if (operation === 'create') {
          return await integration.createDeal(payload);
        }
        if (operation === 'update') {
          return await integration.updateDealStage(
            payload.reportId,
            payload.status
          );
        }
        break;

      case 'timeline':
        if (operation === 'create') {
          return await integration.trackTriageInteraction(
            payload.customerId,
            payload.reportId,
            payload.priority,
            payload.sentiment
          );
        }
        break;
    }

    return { success: false, error: 'Unknown operation/entity combination' };
  }

  /**
   * Route Freshdesk task
   *
   * @async
   * @private
   * @param {Object} integration - Freshdesk integration instance
   * @param {string} operation - Operation type
   * @param {string} entityType - Entity type
   * @param {Object} payload - Task payload
   * @returns {Promise<Object>} Operation result
   */
  async routeFreshdeskTask(integration, operation, entityType, payload) {
    switch (entityType) {
      case 'ticket':
        if (operation === 'create') {
          return await integration.createTicket(payload);
        }
        if (operation === 'update') {
          return await integration.updateTicketStatus(
            payload.reportId,
            payload.status,
            payload.notes
          );
        }
        if (operation === 'sync') {
          return await integration.syncTicketFromFreshdesk(payload.ticketId);
        }
        break;

      case 'note':
        if (operation === 'create') {
          return await integration.addNoteToTicket(
            payload.ticketId,
            payload.noteContent
          );
        }
        break;
    }

    return { success: false, error: 'Unknown operation/entity combination' };
  }

  /**
   * Handle task failure and retry logic
   *
   * @async
   * @private
   * @param {string} taskId - Task ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<void>}
   */
  async handleTaskFailure(taskId, errorMessage) {
    try {
      // Get current task state
      const { data: task } = await supabase
        .from('sync_queue')
        .select('retry_count, max_retries')
        .eq('id', taskId)
        .single();

      if (!task) return;

      const newRetryCount = task.retry_count + 1;

      if (newRetryCount < task.max_retries) {
        // Schedule retry with exponential backoff
        const backoffDelay = this.calculateBackoff(newRetryCount);
        const scheduledAt = new Date(Date.now() + backoffDelay);

        await supabase
          .from('sync_queue')
          .update({
            status: 'queued',
            retry_count: newRetryCount,
            error_message: errorMessage,
            scheduled_at: scheduledAt.toISOString(),
            started_at: null,
          })
          .eq('id', taskId);

        logger.warn('Sync task failed, scheduled retry', {
          taskId,
          retryCount: newRetryCount,
          backoffDelay,
          error: errorMessage,
        });
      } else {
        // Max retries reached, mark as failed
        await supabase
          .from('sync_queue')
          .update({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('id', taskId);

        logger.error('Sync task failed permanently', {
          taskId,
          error: errorMessage,
        });
      }
    } catch (error) {
      logger.error('Error handling task failure', { taskId, error });
    }
  }

  /**
   * Calculate exponential backoff delay
   *
   * @private
   * @param {number} retryCount - Current retry count
   * @returns {number} Backoff delay in milliseconds
   */
  calculateBackoff(retryCount) {
    // Exponential backoff: 2^retryCount * 1000ms
    // e.g., 2s, 4s, 8s, 16s...
    const baseDelay = 1000;
    const maxDelay = 60000; // Cap at 60 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay;
  }

  // ============================================================================
  // Queue Operations
  // ============================================================================

  /**
   * Add task to sync queue
   *
   * @async
   * @param {Object} task - Task to queue
   * @param {string} task.integrationType - Integration (hubspot/freshdesk)
   * @param {string} task.operation - Operation (create/update/sync)
   * @param {string} task.entityType - Entity type (contact/ticket/deal)
   * @param {string} task.entityId - Entity ID
   * @param {Object} task.payload - Task payload
   * @param {number} [task.priority=5] - Priority (1=highest, 10=lowest)
   * @returns {Promise<Object>} Queue result
   *
   * @example
   * await syncQueue.enqueue({
   *   integrationType: 'freshdesk',
   *   operation: 'create',
   *   entityType: 'ticket',
   *   entityId: 'TR-12345',
   *   payload: { ... },
   *   priority: 1
   * });
   */
  async enqueue(task) {
    try {
      const { data, error } = await supabase
        .from('sync_queue')
        .insert({
          integration_type: task.integrationType,
          operation: task.operation,
          entity_type: task.entityType,
          entity_id: task.entityId,
          payload: task.payload,
          priority: task.priority || 5,
          status: 'queued',
          retry_count: 0,
          max_retries: this.maxRetries,
        })
        .select();

      if (error) throw error;

      logger.info('Task queued for sync', {
        taskId: data[0].id,
        integration: task.integrationType,
        operation: task.operation,
      });

      return { success: true, taskId: data[0].id };
    } catch (error) {
      logger.error('Failed to enqueue task', { error, task });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get queue statistics
   *
   * @async
   * @returns {Promise<Object>} Queue statistics
   */
  async getStats() {
    try {
      const { data, error } = await supabase
        .from('sync_queue')
        .select('status, integration_type');

      if (error) throw error;

      const stats = {
        total: data.length,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        byIntegration: {},
      };

      data.forEach((task) => {
        stats[task.status] = (stats[task.status] || 0) + 1;

        if (!stats.byIntegration[task.integration_type]) {
          stats.byIntegration[task.integration_type] = {
            total: 0,
            queued: 0,
            processing: 0,
            completed: 0,
            failed: 0,
          };
        }

        stats.byIntegration[task.integration_type].total++;
        stats.byIntegration[task.integration_type][task.status]++;
      });

      return { success: true, stats };
    } catch (error) {
      logger.error('Failed to get queue stats', { error });
      return { success: false, error: error.message };
    }
  }

  /**
   * Retry failed task
   *
   * @async
   * @param {string} taskId - Task ID to retry
   * @returns {Promise<Object>} Retry result
   */
  async retryTask(taskId) {
    try {
      const { error } = await supabase
        .from('sync_queue')
        .update({
          status: 'queued',
          retry_count: 0,
          error_message: null,
          scheduled_at: new Date().toISOString(),
          started_at: null,
          completed_at: null,
        })
        .eq('id', taskId);

      if (error) throw error;

      logger.info('Task retry scheduled', { taskId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to retry task', { taskId, error });
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear completed tasks older than specified days
   *
   * @async
   * @param {number} [daysOld=7] - Days old threshold
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldTasks(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('sync_queue')
        .delete()
        .eq('status', 'completed')
        .lt('completed_at', cutoffDate.toISOString());

      if (error) throw error;

      logger.info('Old completed tasks cleaned up', { daysOld });

      return { success: true };
    } catch (error) {
      logger.error('Failed to cleanup old tasks', { error });
      return { success: false, error: error.message };
    }
  }

  /**
   * Sleep helper
   *
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance of Sync Queue Manager
 *
 * @type {SyncQueue}
 * @example
 * import { syncQueue } from './syncQueue.js';
 * await syncQueue.start();
 */
export const syncQueue = new SyncQueue();

export default syncQueue;
