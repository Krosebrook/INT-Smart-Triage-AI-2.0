/**
 * Unit tests for Reporting Service
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ReportingService } from '../src/reportingService.js';

describe('ReportingService', () => {
  let service;

  beforeEach(() => {
    service = new ReportingService();
  });

  describe('Constructor', () => {
    it('should initialize with report templates', () => {
      assert.ok(service);
      assert.ok(service.reportTemplates);
      assert.strictEqual(typeof service.reportTemplates, 'object');
    });

    it('should have executive_summary template', () => {
      assert.ok(service.reportTemplates.executive_summary);
      assert.strictEqual(
        service.reportTemplates.executive_summary.name,
        'Executive Summary Report'
      );
    });

    it('should have csr_performance template', () => {
      assert.ok(service.reportTemplates.csr_performance);
      assert.strictEqual(
        service.reportTemplates.csr_performance.name,
        'CSR Performance Report'
      );
    });

    it('should have customer_satisfaction template', () => {
      assert.ok(service.reportTemplates.customer_satisfaction);
    });

    it('should have operational_metrics template', () => {
      assert.ok(service.reportTemplates.operational_metrics);
    });

    it('should have department_analysis template', () => {
      assert.ok(service.reportTemplates.department_analysis);
    });
  });

  describe('initializeTemplates()', () => {
    it('should return all templates', () => {
      const templates = service.initializeTemplates();
      assert.ok(templates);
      assert.ok(templates.executive_summary);
      assert.ok(templates.csr_performance);
      assert.ok(templates.customer_satisfaction);
    });
  });

  describe('generateReport()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof service.generateReport, 'function');
    });

    it('should throw error for unknown template', async () => {
      await assert.rejects(
        async () => {
          await service.generateReport('unknown_template');
        },
        { message: /Report template unknown_template not found/ }
      );
    });

    it('should accept valid template name', async () => {
      const result = await service.generateReport('executive_summary');
      assert.ok(result);
      assert.strictEqual(typeof result, 'object');
    });

    it('should accept options', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await service.generateReport('executive_summary', {
        startDate,
        endDate,
        format: 'json',
      });
      assert.ok(result);
    });
  });

  describe('exportToCSV()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof service.exportToCSV, 'function');
    });
  });

  describe('scheduleReport()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof service.scheduleReport, 'function');
    });
  });

  describe('getSavedReports()', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof service.getSavedReports, 'function');
    });
  });

  describe('getAvailableTemplates()', () => {
    it('should be a function', () => {
      const result = service.getAvailableTemplates();
      assert.strictEqual(typeof result, 'object');
    });
  });
});
