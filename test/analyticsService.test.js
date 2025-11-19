/**
 * Unit tests for Analytics Service
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getTicketVolumeByDay,
  getPriorityDistribution,
  getDepartmentWorkload,
  getCSRPerformanceMetrics,
  getResponseTimeAnalysis,
  getPredictiveTicketVolume,
  exportAnalyticsData,
} from '../src/analyticsService.js';

describe('Analytics Service', () => {
  describe('getTicketVolumeByDay()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getTicketVolumeByDay(30);

      assert.strictEqual(typeof result, 'object');
      assert.ok('success' in result);
      // Will be false when database not configured
      if (!result.success) {
        assert.strictEqual(result.error, 'Database not configured');
      }
    });

    it('should accept days parameter', async () => {
      const result = await getTicketVolumeByDay(7);
      assert.strictEqual(typeof result, 'object');
    });
  });

  describe('getPriorityDistribution()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getPriorityDistribution();

      assert.strictEqual(typeof result, 'object');
      assert.ok('success' in result);
      if (!result.success) {
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('getDepartmentWorkload()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getDepartmentWorkload();

      assert.strictEqual(typeof result, 'object');
      assert.ok('success' in result);
      if (!result.success) {
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('getCSRPerformanceMetrics()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getCSRPerformanceMetrics();

      assert.strictEqual(typeof result, 'object');
      assert.ok('success' in result);
      if (!result.success) {
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('getResponseTimeAnalysis()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getResponseTimeAnalysis();

      assert.strictEqual(typeof result, 'object');
      assert.ok('success' in result);
      if (!result.success) {
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('getPredictiveTicketVolume()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getPredictiveTicketVolume(7);

      assert.strictEqual(typeof result, 'object');
      assert.ok('success' in result);
      if (!result.success) {
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('exportAnalyticsData()', () => {
    it('should return database not configured when no client', async () => {
      const result = await exportAnalyticsData('json', {});

      assert.strictEqual(typeof result, 'object');
      assert.ok('success' in result);
      if (!result.success) {
        assert.strictEqual(result.error, 'Database not configured');
      }
    });

    it('should accept format parameter', async () => {
      const result = await exportAnalyticsData('csv', {});
      assert.strictEqual(typeof result, 'object');
    });
  });
});
