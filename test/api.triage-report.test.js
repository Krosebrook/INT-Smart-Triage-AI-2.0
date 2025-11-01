import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTriageReportHandler } from '../api/triage-report.js';

const baseRequest = {
  customerName: 'Acme Corp',
  ticketSubject: 'System outage',
  issueDescription: 'Primary system is down for all users',
  customerTone: 'Angry',
  csrAgent: 'alex.hunter',
  timestamp: '2024-01-01T00:00:00.000Z'
};

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

function setupHandler({
  geminiResult,
  geminiConfigured = true,
  geminiShouldThrow = false,
  fallbackResult,
  dbInsertResult,
  dbShouldThrow = false,
  dbInitialized = true
}) {
  let capturedInsert;
  let fallbackCalls = 0;

  const geminiService = {
    isConfigured: geminiConfigured,
    async generateTriageAnalysis(payload) {
      if (geminiShouldThrow) {
        throw new Error('Gemini failed');
      }
      return typeof geminiResult === 'function' ? geminiResult(payload) : geminiResult;
    }
  };

  const triageEngine = {
    processTriageRequest() {
      fallbackCalls += 1;
      return typeof fallbackResult === 'function' ? fallbackResult() : fallbackResult;
    }
  };

  const dbService = {
    isInitialized: dbInitialized,
    async insertReport(data) {
      if (dbShouldThrow) {
        throw new Error('Insert failed');
      }
      capturedInsert = data;
      return typeof dbInsertResult === 'function' ? dbInsertResult(data) : dbInsertResult;
    }
  };

  const rateLimiter = () => true;

  const handler = createTriageReportHandler({
    geminiService,
    triageEngine,
    dbService,
    rateLimiter
  });

  return {
    handler,
    getCapturedInsert: () => capturedInsert,
    getFallbackCalls: () => fallbackCalls
  };
}

test('triage-report handler returns success when Gemini provides valid analysis', async () => {
  const triageResult = {
    priority: 'high',
    category: 'technology',
    confidence: '92%',
    responseApproach: 'Immediate outreach with escalation path',
    talkingPoints: ['Acknowledge outage', 'Provide ETA', 'Offer workaround'],
    knowledgeBase: ['KB-001', 'KB-002'],
    metadata: { model: 'gemini-pro' }
  };

  const insertResult = {
    report_id: 'TR-12345',
    created_at: '2024-01-01T00:00:00.000Z',
    priority: 'high'
  };

  const { handler, getCapturedInsert } = setupHandler({
    geminiResult: triageResult,
    fallbackResult: triageResult,
    dbInsertResult: insertResult
  });

  const req = {
    method: 'POST',
    headers: { 'user-agent': 'node-test' },
    connection: { remoteAddress: '127.0.0.1' },
    body: { ...baseRequest }
  };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.success, 'response should indicate success');
  assert.equal(res.body.reportId, insertResult.report_id);
  assert.equal(res.body.metadata.usedLLM, true);
  assert.deepEqual(res.body.talkingPoints, triageResult.talkingPoints);
  assert.equal(res.body.security.rlsEnforced, true);

  const inserted = getCapturedInsert();
  assert.ok(inserted.report_id.startsWith('TR-'));
  assert.equal(inserted.customer_name, baseRequest.customerName);
  assert.equal(inserted.metadata.usedLLM, true);
  assert.equal(inserted.metadata.managementSummary, null);
});

test('triage-report handler falls back to rule engine when Gemini fails', async () => {
  const fallbackResult = {
    priority: 'medium',
    category: 'operations',
    confidence: '75%',
    responseApproach: 'Standard follow-up',
    talkingPoints: ['Confirm details'],
    knowledgeBase: ['KB-OPS'],
    metadata: { engine: 'rule' }
  };

  const insertResult = {
    report_id: 'TR-98765',
    created_at: '2024-01-02T00:00:00.000Z',
    priority: 'medium'
  };

  const { handler, getFallbackCalls } = setupHandler({
    geminiResult: null,
    geminiShouldThrow: true,
    fallbackResult,
    dbInsertResult: insertResult
  });

  const req = {
    method: 'POST',
    headers: { 'user-agent': 'node-test' },
    connection: { remoteAddress: '192.168.1.10' },
    body: { ...baseRequest }
  };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.metadata.usedLLM, false);
  assert.equal(getFallbackCalls(), 1, 'fallback engine should be invoked once');
});

test('triage-report handler returns validation error for invalid payload', async () => {
  const { handler } = setupHandler({
    geminiResult: {},
    fallbackResult: {},
    dbInsertResult: {}
  });

  const req = {
    method: 'POST',
    headers: {},
    connection: { remoteAddress: '127.0.0.1' },
    body: {
      ticketSubject: 'Missing customer name',
      issueDescription: 'No customer name provided',
      customerTone: 'calm'
    }
  };

  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Validation Error');
  assert.ok(Array.isArray(res.body.details));
  assert.ok(res.body.details.length > 0);
});

test('triage-report handler returns 500 when database insert fails', async () => {
  const triageResult = {
    priority: 'low',
    category: 'general',
    confidence: '60%',
    responseApproach: 'Queue for follow-up',
    talkingPoints: ['Acknowledge request'],
    knowledgeBase: ['KB-GEN'],
    metadata: {}
  };

  const { handler } = setupHandler({
    geminiResult: triageResult,
    fallbackResult: triageResult,
    dbInsertResult: null,
    dbShouldThrow: true
  });

  const req = {
    method: 'POST',
    headers: { 'user-agent': 'node-test' },
    connection: { remoteAddress: '10.0.0.5' },
    body: { ...baseRequest }
  };

  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'Internal Server Error');
  assert.equal(res.body.reportId, null);
});
