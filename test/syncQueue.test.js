/**
 * Unit tests for Sync Queue
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SyncQueue } from '../src/syncQueue.js';

describe('SyncQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new SyncQueue();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      assert.ok(queue);
      assert.strictEqual(queue.maxConcurrent, 5);
      assert.strictEqual(queue.pollInterval, 5000);
      assert.strictEqual(queue.maxRetries, 3);
      assert.strictEqual(queue.isRunning, false);
    });

    it('should accept custom options', () => {
      const customQueue = new SyncQueue({
        maxConcurrent: 10,
        pollInterval: 3000,
        maxRetries: 5,
      });

      assert.strictEqual(customQueue.maxConcurrent, 10);
      assert.strictEqual(customQueue.pollInterval, 3000);
      assert.strictEqual(customQueue.maxRetries, 5);
    });

    it('should initialize empty running tasks set', () => {
      assert.ok(queue.runningTasks);
      assert.ok(queue.runningTasks instanceof Set);
      assert.strictEqual(queue.runningTasks.size, 0);
    });

    it('should initialize integrations object', () => {
      assert.ok(queue.integrations);
      assert.strictEqual(typeof queue.integrations, 'object');
      assert.ok('hubspot' in queue.integrations);
      assert.ok('freshdesk' in queue.integrations);
    });
  });

  describe('start()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof queue.start, 'function');
    });

    it('should return a promise', () => {
      const result = queue.start();
      assert.ok(result instanceof Promise);
      // Stop immediately to avoid infinite loop
      queue.stop();
    });
  });

  describe('stop()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof queue.stop, 'function');
    });

    it('should set isRunning to false', () => {
      queue.stop();
      assert.strictEqual(queue.isRunning, false);
    });
  });

  describe('processNextTask()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof queue.processNextTask, 'function');
    });
  });

  describe('enqueue()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof queue.enqueue, 'function');
    });

    it('should accept task data', async () => {
      const result = await queue.enqueue({
        integrationType: 'hubspot',
        operation: 'sync',
        entityType: 'contact',
        priority: 1,
      });

      // Should return object with success property
      assert.strictEqual(typeof result, 'object');
      assert.ok('success' in result);
    });
  });

  describe('getStats()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof queue.getStats, 'function');
    });

    it('should return statistics object', async () => {
      const stats = await queue.getStats();

      assert.strictEqual(typeof stats, 'object');
      assert.ok('success' in stats);
    });
  });

  describe('retryTask()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof queue.retryTask, 'function');
    });
  });

  describe('cleanupOldTasks()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof queue.cleanupOldTasks, 'function');
    });
  });

  describe('Integration types', () => {
    it('should have hubspot integration', () => {
      assert.ok(queue.integrations.hubspot);
    });

    it('should have freshdesk integration', () => {
      assert.ok(queue.integrations.freshdesk);
    });
  });
});
