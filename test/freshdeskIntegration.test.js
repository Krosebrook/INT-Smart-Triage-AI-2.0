/**
 * Unit tests for Freshdesk Integration
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { FreshdeskIntegration } from '../src/freshdeskIntegration.js';

describe('FreshdeskIntegration', () => {
  let integration;

  beforeEach(() => {
    integration = new FreshdeskIntegration();
  });

  describe('Constructor', () => {
    it('should initialize with environment configuration', () => {
      assert.ok(integration);
      assert.strictEqual(typeof integration.enabled, 'boolean');
    });

    it('should accept custom configuration', () => {
      const custom = new FreshdeskIntegration({
        domain: 'testdomain.freshdesk.com',
        apiKey: 'test-api-key',
      });
      
      assert.strictEqual(custom.domain, 'testdomain.freshdesk.com');
      assert.strictEqual(custom.apiKey, 'test-api-key');
      assert.strictEqual(custom.apiBase, 'https://testdomain.freshdesk.com/api/v2');
      assert.strictEqual(custom.enabled, true);
    });

    it('should be disabled without credentials', () => {
      const noConfig = new FreshdeskIntegration({
        domain: null,
        apiKey: null,
      });
      
      assert.strictEqual(noConfig.enabled, false);
    });
  });

  describe('createTicket()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.createTicket, 'function');
    });
  });

  describe('updateTicketStatus()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.updateTicketStatus, 'function');
    });
  });

  describe('getTicket()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.getTicket, 'function');
    });
  });

  describe('addNoteToTicket()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.addNoteToTicket, 'function');
    });
  });

  describe('searchKnowledgeBase()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.searchKnowledgeBase, 'function');
    });
  });

  describe('healthCheck()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof integration.healthCheck, 'function');
    });
  });
});
