/**
 * Unit tests for Assignment Engine
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AssignmentEngine } from '../src/assignmentEngine.js';

describe('AssignmentEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new AssignmentEngine();
  });

  describe('Constructor', () => {
    it('should initialize with departments', () => {
      assert.ok(engine.departments);
      assert.strictEqual(typeof engine.departments, 'object');
      assert.ok(engine.departments['Information Security']);
      assert.ok(engine.departments['Technology']);
    });

    it('should initialize with skill matrix', () => {
      assert.ok(engine.skillMatrix);
      assert.strictEqual(typeof engine.skillMatrix, 'object');
      assert.ok(engine.skillMatrix.security_expert);
      assert.ok(engine.skillMatrix.it_specialist);
    });
  });

  describe('determineDepartment()', () => {
    it('should route security issues to Information Security', () => {
      const dept = engine.determineDepartment('We have a security breach');
      assert.strictEqual(dept, 'Information Security');
    });

    it('should route network issues to Technology', () => {
      const dept = engine.determineDepartment('Server is down');
      assert.strictEqual(dept, 'Technology');
    });

    it('should route website issues to Website Design', () => {
      const dept = engine.determineDepartment('Need a new website design');
      assert.strictEqual(dept, 'Website Design');
    });

    it('should default to Technology for generic issues', () => {
      const dept = engine.determineDepartment('General help needed');
      assert.strictEqual(dept, 'Technology');
    });

    it('should handle multiple matching keywords', () => {
      const dept = engine.determineDepartment('Security audit for our server');
      // Should match Information Security (security, audit) with higher score
      assert.strictEqual(dept, 'Information Security');
    });
  });

  describe('getMockCSRs()', () => {
    it('should return all CSRs when no department specified', () => {
      const csrs = engine.getMockCSRs();
      assert.ok(Array.isArray(csrs));
      assert.strictEqual(csrs.length, 3);
    });

    it('should filter CSRs by department', () => {
      const csrs = engine.getMockCSRs('Information Security');
      assert.ok(Array.isArray(csrs));
      assert.ok(csrs.length > 0);
      assert.ok(csrs[0].specialties.includes('Information Security'));
    });

    it('should return empty array for non-existent department', () => {
      const csrs = engine.getMockCSRs('Non-Existent Department');
      assert.ok(Array.isArray(csrs));
      assert.strictEqual(csrs.length, 0);
    });

    it('should include all required CSR properties', () => {
      const csrs = engine.getMockCSRs();
      const csr = csrs[0];
      assert.ok(csr.id);
      assert.ok(csr.name);
      assert.ok(csr.email);
      assert.ok(Array.isArray(csr.specialties));
      assert.ok(csr.skill_level);
      assert.ok(typeof csr.current_workload === 'number');
      assert.ok(typeof csr.avg_resolution_time === 'number');
      assert.ok(typeof csr.satisfaction_rating === 'number');
      assert.ok(typeof csr.is_available === 'boolean');
    });
  });

  describe('selectBestCSR()', () => {
    it('should select CSR with lowest workload', () => {
      const csrs = [
        {
          id: 1,
          name: 'CSR A',
          current_workload: 5,
          satisfaction_rating: 4.5,
          skill_level: 'senior',
          avg_resolution_time: 3.0,
        },
        {
          id: 2,
          name: 'CSR B',
          current_workload: 2,
          satisfaction_rating: 4.5,
          skill_level: 'senior',
          avg_resolution_time: 3.0,
        },
      ];
      const best = engine.selectBestCSR(csrs, { priority: 'medium' });
      assert.strictEqual(best.name, 'CSR B');
    });

    it('should prefer expert for high priority tickets', () => {
      const csrs = [
        {
          id: 1,
          name: 'Expert CSR',
          current_workload: 3,
          satisfaction_rating: 4.8,
          skill_level: 'expert',
          avg_resolution_time: 2.5,
        },
        {
          id: 2,
          name: 'Senior CSR',
          current_workload: 2,
          satisfaction_rating: 4.6,
          skill_level: 'senior',
          avg_resolution_time: 3.0,
        },
      ];
      const best = engine.selectBestCSR(csrs, { priority: 'high' });
      assert.strictEqual(best.name, 'Expert CSR');
    });

    it('should consider satisfaction rating in scoring', () => {
      const csrs = [
        {
          id: 1,
          name: 'High Satisfaction',
          current_workload: 3,
          satisfaction_rating: 4.9,
          skill_level: 'senior',
          avg_resolution_time: 3.0,
        },
        {
          id: 2,
          name: 'Low Satisfaction',
          current_workload: 3,
          satisfaction_rating: 3.0,
          skill_level: 'senior',
          avg_resolution_time: 3.0,
        },
      ];
      const best = engine.selectBestCSR(csrs, { priority: 'medium' });
      assert.strictEqual(best.name, 'High Satisfaction');
    });
  });

  describe('estimateResponseTime()', () => {
    it('should return 15 base minutes for high priority', () => {
      const estimate = engine.estimateResponseTime('high', 0);
      assert.strictEqual(estimate.minutes, 15);
      assert.strictEqual(estimate.display, '15 minutes');
    });

    it('should return 60 base minutes for medium priority', () => {
      const estimate = engine.estimateResponseTime('medium', 0);
      assert.strictEqual(estimate.minutes, 60);
      assert.strictEqual(estimate.display, '1 hours');
    });

    it('should return 240 base minutes for low priority', () => {
      const estimate = engine.estimateResponseTime('low', 0);
      assert.strictEqual(estimate.minutes, 240);
      assert.strictEqual(estimate.display, '4 hours');
    });

    it('should add 10 minutes per workload item', () => {
      const estimate = engine.estimateResponseTime('high', 3);
      assert.strictEqual(estimate.minutes, 45); // 15 + (3 * 10)
    });

    it('should format hours correctly when over 60 minutes', () => {
      const estimate = engine.estimateResponseTime('medium', 5);
      assert.strictEqual(estimate.minutes, 110); // 60 + (5 * 10)
      assert.strictEqual(estimate.display, '2 hours');
    });
  });

  describe('autoAssign()', () => {
    it('should reject invalid report data', async () => {
      const result = await engine.autoAssign(null);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject report without issue description', async () => {
      const result = await engine.autoAssign({ priority: 'high' });
      assert.strictEqual(result.success, false);
      assert.match(result.error, /issueDescription/);
    });

    it('should return assignment with mock CSRs', async () => {
      const result = await engine.autoAssign({
        issueDescription: 'Server is down',
        priority: 'high',
        reportId: 'TR-12345',
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.assignedTo);
      assert.ok(result.department);
      assert.ok(result.estimatedResponseTime);
    });

    it('should handle missing priority gracefully', async () => {
      const result = await engine.autoAssign({
        issueDescription: 'Need help',
        reportId: 'TR-12345',
      });

      assert.strictEqual(result.success, true);
      // Should default to medium priority
    });
  });

  describe('getAvailableCSRs()', () => {
    it('should return mock CSRs when no database', async () => {
      const csrs = await engine.getAvailableCSRs('Technology');
      assert.ok(Array.isArray(csrs));
      assert.ok(csrs.length > 0);
    });

    it('should filter by department', async () => {
      const csrs = await engine.getAvailableCSRs('Information Security');
      assert.ok(
        csrs.every((csr) => csr.specialties.includes('Information Security'))
      );
    });
  });

  describe('reassignTicket()', () => {
    it('should return error when database not configured', async () => {
      const result = await engine.reassignTicket(
        'TR-12345',
        'John Doe',
        'Workload balancing'
      );
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('getWorkloadDistribution()', () => {
    it('should return error when database not configured', async () => {
      const result = await engine.getWorkloadDistribution();
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('escalateTicket()', () => {
    it('should return error when database not configured', async () => {
      const result = await engine.escalateTicket(
        'TR-12345',
        'Customer complaint'
      );
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });
});
