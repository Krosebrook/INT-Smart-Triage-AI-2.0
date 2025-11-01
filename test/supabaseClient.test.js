/**
 * Unit tests for Supabase Client
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  supabase,
  saveTriageReport,
  getCustomerReports,
  getReportById,
  searchReports,
  getReportStats,
  updateReportStatus,
  getNotes,
  addNote,
  deleteNote,
  assignReport,
  getAvailableCSRs,
  autoAssignReport,
  getSuggestedResponses,
  searchKnowledgeBase,
} from '../src/supabaseClient.js';

describe('Supabase Client', () => {
  describe('Client initialization', () => {
    it('should export supabase client', () => {
      // Client may be null if env vars not set
      assert.ok(supabase === null || typeof supabase === 'object');
    });
  });

  describe('saveTriageReport()', () => {
    it('should return database not configured when no client', async () => {
      const result = await saveTriageReport({
        reportId: 'TEST-001',
        customerName: 'Test Customer',
        ticketSubject: 'Test Subject',
        issueDescription: 'Test Description',
        customerTone: 'calm',
        priority: 'medium',
        confidence: '85%',
        responseApproach: 'Standard',
        talkingPoints: ['Point 1'],
        knowledgeBase: ['KB-001'],
      });

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('getCustomerReports()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getCustomerReports('Test Customer');

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('getReportById()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getReportById('TEST-001');

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('searchReports()', () => {
    it('should return database not configured when no client', async () => {
      const result = await searchReports('test query');

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });

    it('should handle empty query', async () => {
      const result = await searchReports('');

      if (!supabase) {
        assert.strictEqual(result.success, false);
      }
    });

    it('should handle filters', async () => {
      const result = await searchReports('test', {
        priority: 'high',
        category: 'technical',
      });

      if (!supabase) {
        assert.strictEqual(result.success, false);
      }
    });
  });

  describe('getReportStats()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getReportStats();

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('updateReportStatus()', () => {
    it('should return database not configured when no client', async () => {
      const result = await updateReportStatus('TEST-001', 'resolved');

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('getNotes()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getNotes('TEST-001');

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('addNote()', () => {
    it('should return database not configured when no client', async () => {
      const result = await addNote('TEST-001', 'Test note', 'CSR-001');

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('deleteNote()', () => {
    it('should return database not configured when no client', async () => {
      const result = await deleteNote(1);

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('assignReport()', () => {
    it('should return database not configured when no client', async () => {
      const result = await assignReport('TEST-001', 'CSR-001');

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('getAvailableCSRs()', () => {
    it('should return database not configured when no client', async () => {
      const result = await getAvailableCSRs();

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('autoAssignReport()', () => {
    it('should return database not configured when no client', async () => {
      const result = await autoAssignReport('TEST-001');

      if (!supabase) {
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Database not configured');
      }
    });
  });

  describe('getSuggestedResponses()', () => {
    it('should return password reset suggestion', async () => {
      const result = await getSuggestedResponses(
        'I forgot my password',
        'Account Access'
      );

      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.suggestions));
      assert.ok(result.suggestions.length > 0);
      assert.strictEqual(result.suggestions[0].title, 'Password Reset');
    });

    it('should return performance suggestion', async () => {
      const result = await getSuggestedResponses(
        'Application is slow',
        'Technical Issue'
      );

      assert.strictEqual(result.success, true);
      assert.ok(
        result.suggestions.some((s) => s.title === 'Performance Issue')
      );
    });

    it('should return billing suggestion', async () => {
      const result = await getSuggestedResponses(
        'Question about billing',
        'Billing'
      );

      assert.strictEqual(result.success, true);
      assert.ok(result.suggestions.some((s) => s.title === 'Billing Inquiry'));
    });

    it('should return general support for unknown issues', async () => {
      const result = await getSuggestedResponses('Random issue', 'Other');

      assert.strictEqual(result.success, true);
      assert.ok(result.suggestions.some((s) => s.title === 'General Support'));
    });
  });

  describe('searchKnowledgeBase()', () => {
    it('should return articles array', async () => {
      const result = await searchKnowledgeBase('password reset', null);

      assert.ok(Array.isArray(result.articles));
      if (supabase) {
        assert.strictEqual(result.success, true);
      } else {
        assert.strictEqual(result.success, false);
      }
    });

    it('should return relevant articles for password query when client available', async () => {
      if (supabase) {
        const result = await searchKnowledgeBase('password reset', null);
        assert.strictEqual(result.success, true);
        assert.ok(result.articles.length > 0);
      }
    });

    it('should filter by category when client available', async () => {
      if (supabase) {
        const result = await searchKnowledgeBase('api', 'Technical Issue');
        assert.strictEqual(result.success, true);
        assert.ok(Array.isArray(result.articles));
      }
    });

    it('should return empty array when no Supabase client', async () => {
      if (!supabase) {
        const result = await searchKnowledgeBase('test', null);
        assert.strictEqual(result.success, false);
        assert.deepStrictEqual(result.articles, []);
      }
    });
  });
});
