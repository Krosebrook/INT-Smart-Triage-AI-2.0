import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  handleCreateTriageReport,
  __setTriageReportDependencies
} from '../src/api/public/v1/triageReports.js';
import { handleGenerateKnowledgeBaseArticle } from '../src/api/public/v1/knowledgeBase.js';

function createMockResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('Public API handlers', () => {
  let insertedReports;

  beforeEach(() => {
    insertedReports = [];
    const limiter = () => true;
    const mockDb = {
      isInitialized: true,
      insertReport: async report => {
        insertedReports.push(report);
        return {
          report_id: report.report_id,
          created_at: '2024-01-01T00:00:00.000Z',
          priority: report.priority,
          category: report.category,
          confidence_score: report.confidence_score
        };
      }
    };

    const mockEngine = {
      processTriageRequest: () => ({
        priority: 'high',
        confidence: '95%',
        responseApproach: 'Escalate to tier 2 with SLA update.',
        talkingPoints: ['Acknowledge outage', 'Provide ETA'],
        knowledgeBase: ['kb-123'],
        category: 'technical',
        metadata: { route: 'rule-engine' },
        processedAt: '2024-01-01T00:00:00.000Z'
      })
    };

    const mockGemini = {
      isConfigured: false,
      async generateTriageAnalysis() {
        throw new Error('Should not be called when isConfigured is false');
      }
    };

    __setTriageReportDependencies({
      database: mockDb,
      engine: mockEngine,
      gemini: mockGemini,
      limiter
    });
  });

  it('creates a triage report with sanitized payload', async () => {
    const req = {
      method: 'POST',
      body: {
        customerName: 'Casey Customer',
        ticketSubject: 'App down',
        issueDescription: 'Critical outage impacting all users',
        customerTone: 'Urgent',
        csrAgent: 'CSR-001'
      },
      headers: {
        'x-forwarded-for': '10.0.0.5',
        'user-agent': 'jest'
      }
    };
    const res = createMockResponse();

    await handleCreateTriageReport(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.ok(res.body.success, 'response should indicate success');
    assert.ok(insertedReports.length === 1, 'report should be persisted');
    assert.match(res.body.reportId, /^TR-/);
    assert.strictEqual(insertedReports[0].customer_name, 'Casey Customer');
    assert.strictEqual(res.body.priority, 'high');
  });

  it('rejects invalid triage payloads', async () => {
    const req = {
      method: 'POST',
      body: {
        ticketSubject: 'Missing name',
        issueDescription: 'No customer name provided',
        customerTone: 'calm',
        csrAgent: 'CSR-002'
      },
      headers: {}
    };
    const res = createMockResponse();

    await handleCreateTriageReport(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'Validation Error');
  });

  it('returns 400 when knowledge base subject missing', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('fetch should not be called for invalid request');
    };

    try {
      const req = {
        method: 'POST',
        body: {
          description: 'Sample description without subject'
        }
      };
      const res = createMockResponse();

      await handleGenerateKnowledgeBaseArticle(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.error, 'Missing required fields');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
