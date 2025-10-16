/**
 * Unit tests for Customer Profile Service
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { CustomerProfileService } from '../src/customerProfileService.js';

describe('CustomerProfileService', () => {
  let service;

  beforeEach(() => {
    service = new CustomerProfileService();
  });

  describe('getCustomerProfile()', () => {
    it('should return error when database not configured', async () => {
      const result = await service.getCustomerProfile('cust-123');
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should validate customer ID', async () => {
      const result = await service.getCustomerProfile('');
      assert.strictEqual(result.success, false);
      assert.match(result.error, /required/);
    });
  });

  describe('calculateOverallSentiment()', () => {
    it('should return neutral for no tickets', () => {
      const sentiment = service.calculateOverallSentiment([]);
      assert.strictEqual(sentiment.overall, 'neutral');
      assert.strictEqual(sentiment.score, 0);
      assert.strictEqual(sentiment.trend, 'stable');
    });

    it('should calculate sentiment from tickets', () => {
      const tickets = [
        { issue_description: 'Great service', customer_tone: 'calm' },
        { issue_description: 'Thank you for help', customer_tone: 'calm' },
      ];

      const sentiment = service.calculateOverallSentiment(tickets);
      assert.ok(sentiment.overall);
      assert.ok(sentiment.score);
      assert.ok(sentiment.trend);
    });
  });

  describe('calculateLifetimeValue()', () => {
    it('should calculate LTV from tickets', () => {
      const tickets = [
        { status: 'resolved' },
        { status: 'resolved' },
        { status: 'new' },
      ];

      const ltv = service.calculateLifetimeValue(tickets);
      assert.strictEqual(ltv.ticketsResolved, 2);
      assert.strictEqual(ltv.totalTickets, 3);
      assert.ok(ltv.estimatedValue);
      assert.ok(ltv.tier);
    });

    it('should assign correct tier based on value', () => {
      const manyResolved = Array(30).fill({ status: 'resolved' });
      const ltv = service.calculateLifetimeValue(manyResolved);
      assert.strictEqual(ltv.tier, 'premium'); // 30 * 500 = $15,000
    });

    it('should assign standard tier for low value', () => {
      const tickets = [{ status: 'resolved' }, { status: 'new' }];
      const ltv = service.calculateLifetimeValue(tickets);
      assert.strictEqual(ltv.tier, 'standard');
    });
  });

  describe('calculateChurnRisk()', () => {
    it('should return low risk for no issues', () => {
      const risk = service.calculateChurnRisk([], []);
      assert.ok(risk.score >= 0);
      assert.strictEqual(risk.level, 'low');
      assert.ok(Array.isArray(risk.recommendations));
    });

    it('should increase risk for unresolved tickets', () => {
      const tickets = [
        {
          status: 'new',
          customer_tone: 'calm',
          created_at: new Date().toISOString(),
        },
        {
          status: 'new',
          customer_tone: 'calm',
          created_at: new Date().toISOString(),
        },
      ];

      const risk = service.calculateChurnRisk(tickets, []);
      assert.ok(risk.score > 0);
    });

    it('should increase risk for negative sentiment', () => {
      const tickets = [
        {
          status: 'new',
          customer_tone: 'angry',
          created_at: new Date().toISOString(),
        },
      ];

      const risk = service.calculateChurnRisk(tickets, []);
      assert.ok(risk.score >= 20);
    });

    it('should provide recommendations based on risk level', () => {
      const highRiskTickets = Array(10).fill({
        status: 'new',
        customer_tone: 'angry',
        created_at: new Date().toISOString(),
      });

      const risk = service.calculateChurnRisk(highRiskTickets, []);
      assert.ok(risk.recommendations.length > 0);
      assert.strictEqual(risk.level, 'high');
    });
  });

  describe('calculateAvgResolutionTime()', () => {
    it('should return 0 for no resolved tickets', () => {
      const tickets = [{ status: 'new' }];
      const avg = service.calculateAvgResolutionTime(tickets);
      assert.strictEqual(avg, 0);
    });

    it('should calculate average resolution time', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);

      const tickets = [
        {
          status: 'resolved',
          created_at: twoHoursAgo.toISOString(),
          resolved_at: now.toISOString(),
        },
      ];

      const avg = service.calculateAvgResolutionTime(tickets);
      assert.ok(avg >= 1.9 && avg <= 2.1); // ~2 hours
    });
  });

  describe('getChurnPreventionRecommendations()', () => {
    it('should provide urgent actions for high risk', () => {
      const recommendations = service.getChurnPreventionRecommendations(80);
      assert.ok(recommendations.length > 0);
      assert.ok(recommendations.some((r) => r.priority === 'urgent'));
    });

    it('should provide high priority actions for medium risk', () => {
      const recommendations = service.getChurnPreventionRecommendations(50);
      assert.ok(recommendations.length > 0);
      assert.ok(recommendations.some((r) => r.priority === 'high'));
    });

    it('should provide low priority actions for low risk', () => {
      const recommendations = service.getChurnPreventionRecommendations(20);
      assert.ok(recommendations.length > 0);
      assert.ok(recommendations.some((r) => r.priority === 'low'));
    });
  });

  describe('calculateSimilarity()', () => {
    it('should return 0 for completely different customers', () => {
      const customer1 = {
        tags: ['vip'],
        sentiment: { overall: 'positive' },
        lifetimeValue: { tier: 'premium' },
        riskScore: { score: 10 },
      };
      const customer2 = {
        tags: ['basic'],
        sentiment: { overall: 'negative' },
        lifetimeValue: { tier: 'standard' },
        riskScore: { score: 90 },
      };

      const similarity = service.calculateSimilarity(customer1, customer2);
      assert.ok(similarity >= 0 && similarity <= 1);
    });

    it('should return high score for similar customers', () => {
      const customer1 = {
        tags: ['vip', 'enterprise'],
        sentiment: { overall: 'positive' },
        lifetimeValue: { tier: 'premium' },
        riskScore: { score: 10 },
      };
      const customer2 = {
        tags: ['vip', 'enterprise'],
        sentiment: { overall: 'positive' },
        lifetimeValue: { tier: 'premium' },
        riskScore: { score: 15 },
      };

      const similarity = service.calculateSimilarity(customer1, customer2);
      assert.ok(similarity > 0.7);
    });

    it('should consider common tags', () => {
      const customer1 = { tags: ['vip', 'enterprise', 'tech'] };
      const customer2 = { tags: ['vip', 'enterprise'] };

      const similarity = service.calculateSimilarity(customer1, customer2);
      assert.ok(similarity >= 0.6); // 2 common tags * 0.3 = 0.6
    });
  });

  describe('updateCustomerProfile()', () => {
    it('should return error when database not configured', async () => {
      const result = await service.updateCustomerProfile('cust-123', {
        name: 'John Doe',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should validate parameters', async () => {
      const result = await service.updateCustomerProfile('', {});
      assert.strictEqual(result.success, false);
      assert.match(result.error, /required/);
    });
  });

  describe('addCustomerNote()', () => {
    it('should return error when database not configured', async () => {
      const result = await service.addCustomerNote(
        'cust-123',
        'Test note',
        'Agent'
      );
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should validate all parameters', async () => {
      const result = await service.addCustomerNote('', '', '');
      assert.strictEqual(result.success, false);
      assert.match(result.error, /required/);
    });
  });

  describe('addCustomerTag()', () => {
    it('should return error when database not configured', async () => {
      const result = await service.addCustomerTag('cust-123', 'vip');
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should validate parameters', async () => {
      const result = await service.addCustomerTag('', '');
      assert.strictEqual(result.success, false);
      assert.match(result.error, /required/);
    });
  });

  describe('findSimilarCustomers()', () => {
    it('should return error when database not configured', async () => {
      const result = await service.findSimilarCustomers('cust-123');
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('getCommunicationPreferences()', () => {
    it('should return default preferences when database not configured', async () => {
      const result = await service.getCommunicationPreferences('cust-123');
      assert.strictEqual(result.success, true);
      assert.ok(result.preferences);
      assert.strictEqual(typeof result.preferences.email, 'boolean');
    });
  });
});
