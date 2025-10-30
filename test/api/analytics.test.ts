import assert from 'node:assert/strict';
import test from 'node:test';
import type { AnalyticsRecord } from '../../api/analytics.ts';
import {
  computeAnalyticsSummary,
  createAnalyticsHandler,
  resolveFilters,
} from '../../api/analytics.ts';

interface MockResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => void;
  setHeader: (key: string, value: string) => void;
}

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
    },
    setHeader(key: string, value: string) {
      this.headers[key.toLowerCase()] = value;
    },
  };
}

test('computeAnalyticsSummary aggregates ticket data correctly', () => {
  const records: AnalyticsRecord[] = [
    {
      priority: 'high',
      customer_tone: 'angry',
      category: 'billing',
      created_at: new Date().toISOString(),
      confidence_score: 92.5,
    },
    {
      priority: 'medium',
      customer_tone: 'calm',
      category: 'product',
      created_at: new Date().toISOString(),
      confidence_score: '88.12',
    },
    {
      priority: 'high',
      customer_tone: 'angry',
      category: 'billing',
      created_at: new Date().toISOString(),
      confidence_score: null,
    },
  ];

  const filters = resolveFilters({ range: '7d' });
  const summary = computeAnalyticsSummary(records, filters);

  assert.equal(summary.totalReports, 3);
  assert.equal(summary.breakdowns.priority.high, 2);
  assert.equal(summary.breakdowns.priority.medium, 1);
  assert.ok(summary.breakdowns.category.find((entry) => entry.name === 'billing'));
  assert.ok(summary.averages.confidenceScore && summary.averages.confidenceScore > 0);
  assert.equal(summary.trend.length, filters.rangeDays);
});

test('analytics handler returns aggregated response', async () => {
  const records: AnalyticsRecord[] = [
    {
      priority: 'high',
      customer_tone: 'urgent',
      category: 'outage',
      created_at: new Date().toISOString(),
      confidence_score: 90,
    },
  ];

  const handler = createAnalyticsHandler({
    dbService: { isInitialized: true } as never,
    fetchReports: async () => records,
    limiter: () => true,
  });

  const res = createMockResponse();

  await handler(
    {
      method: 'GET',
      headers: {},
      query: { range: '7d' },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.ok(res.body && typeof res.body === 'object');
  const payload = res.body as { success: boolean; analytics: { totalReports: number } };
  assert.equal(payload.success, true);
  assert.equal(payload.analytics.totalReports, 1);
});

test('analytics handler validates query parameters', async () => {
  const handler = createAnalyticsHandler({
    dbService: { isInitialized: true } as never,
    fetchReports: async () => [],
    limiter: () => true,
  });

  const res = createMockResponse();

  await handler(
    {
      method: 'GET',
      headers: {},
      query: { range: '5d' },
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  const payload = res.body as { error: string };
  assert.equal(payload.error, 'Validation Error');
});

test('analytics handler returns service unavailable when database is not configured', async () => {
  const handler = createAnalyticsHandler({
    dbService: { isInitialized: false } as never,
    fetchReports: async () => [],
    limiter: () => true,
  });

  const res = createMockResponse();

  await handler(
    {
      method: 'GET',
      headers: {},
      query: { range: '7d' },
    },
    res,
  );

  assert.equal(res.statusCode, 503);
  const payload = res.body as { error: string };
  assert.equal(payload.error, 'Service Unavailable');
});
