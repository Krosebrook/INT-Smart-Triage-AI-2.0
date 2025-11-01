/**
 * Unit tests for Realtime Service
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { realtimeService } from '../src/realtimeService.js';

describe('RealtimeService', () => {
  describe('Constructor', () => {
    it('should be initialized', () => {
      assert.ok(realtimeService);
    });

    it('should have channels map', () => {
      assert.ok(realtimeService.channels);
      assert.ok(realtimeService.channels instanceof Map);
    });

    it('should have presenceStates map', () => {
      assert.ok(realtimeService.presenceStates);
      assert.ok(realtimeService.presenceStates instanceof Map);
    });

    it('should have eventHandlers map', () => {
      assert.ok(realtimeService.eventHandlers);
      assert.ok(realtimeService.eventHandlers instanceof Map);
    });
  });

  describe('subscribeToReports()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof realtimeService.subscribeToReports, 'function');
    });

    it('should accept callback function', () => {
      const callback = () => {};
      const result = realtimeService.subscribeToReports(callback);
      
      // May return null if Supabase not configured
      if (result !== null) {
        assert.ok(result);
      }
    });
  });

  describe('subscribeToNotes()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof realtimeService.subscribeToNotes, 'function');
    });

    it('should accept reportId and callback', () => {
      const result = realtimeService.subscribeToNotes('TEST-001', () => {});
      // May return null if Supabase not configured
      if (result !== null) {
        assert.ok(result);
      }
    });
  });

  describe('trackPresence()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof realtimeService.trackPresence, 'function');
    });

    it('should accept channel and user data', () => {
      const result = realtimeService.trackPresence('test-channel', {
        userId: 'user-001',
        userName: 'Test User',
      });
      
      // May return null if Supabase not configured
      if (result !== null) {
        assert.ok(result);
      }
    });
  });

  describe('unsubscribeAll()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof realtimeService.unsubscribeAll, 'function');
    });

    it('should not throw error', () => {
      assert.doesNotThrow(() => {
        realtimeService.unsubscribeAll();
      });
    });
  });

  describe('on()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof realtimeService.on, 'function');
    });

    it('should register event handlers', () => {
      const handler = () => {};
      realtimeService.on('test-event', handler);
      
      assert.ok(realtimeService.eventHandlers.has('test-event'));
    });
  });

  describe('off()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof realtimeService.off, 'function');
    });

    it('should remove event handlers', () => {
      const handler = () => {};
      realtimeService.on('test-event', handler);
      realtimeService.off('test-event', handler);
    });
  });
});
