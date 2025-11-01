/**
 * Unit tests for HubSpot Integration
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { HubSpotIntegration } from '../src/hubspotIntegration.js';

describe('HubSpotIntegration', () => {
  let integration;

  beforeEach(() => {
    integration = new HubSpotIntegration();
  });

  describe('Constructor', () => {
    it('should initialize with environment configuration', () => {
      assert.ok(integration);
      assert.strictEqual(typeof integration.enabled, 'boolean');
    });

    it('should accept custom configuration', () => {
      const custom = new HubSpotIntegration({
        accessToken: 'test-token',
        portalId: 'test-portal',
      });
      
      assert.strictEqual(custom.accessToken, 'test-token');
      assert.strictEqual(custom.portalId, 'test-portal');
      assert.strictEqual(custom.enabled, true);
    });

    it('should be disabled without credentials', () => {
      const noConfig = new HubSpotIntegration({
        accessToken: null,
        portalId: null,
      });
      
      assert.strictEqual(noConfig.enabled, false);
    });
  });

  describe('syncContact()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.syncContact, 'function');
    });
  });

  describe('findContactByEmail()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.findContactByEmail, 'function');
    });
  });

  describe('getContact()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.getContact, 'function');
    });
  });

  describe('createDeal()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.createDeal, 'function');
    });
  });

  describe('updateDealStage()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.updateDealStage, 'function');
    });
  });

  describe('addTimelineEvent()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.addTimelineEvent, 'function');
    });
  });

  describe('trackTriageInteraction()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.trackTriageInteraction, 'function');
    });
  });

  describe('healthCheck()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.healthCheck, 'function');
    });
  });
});
