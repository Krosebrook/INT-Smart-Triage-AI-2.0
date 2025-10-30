import { DatabaseService } from '../src/services/database.js';
import {
  createRateLimiter,
  setSecurityHeaders,
  validateHttpMethod,
} from '../src/utils/security.js';
import { z } from 'zod';

interface HttpRequest {
  method?: string;
  query?: Record<string, string | string[]>;
  headers: Record<string, string | string[] | undefined>;
}

interface HttpResponse {
  status: (statusCode: number) => HttpResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export interface AnalyticsFilters {
  rangeDays: number;
  fromDate: Date;
  toDate: Date;
  agent?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AnalyticsRecord {
  priority: string | null;
  customer_tone: string | null;
  category: string | null;
  created_at: string;
  confidence_score: number | string | null;
}

export interface AnalyticsSummary {
  totalReports: number;
  rangeDays: number;
  startDate: string;
  endDate: string;
  averages: {
    confidenceScore: number | null;
  };
  breakdowns: {
    priority: Record<string, number>;
    tone: Record<string, number>;
    category: Array<{ name: string; count: number }>;
  };
  trend: Array<{ date: string; total: number }>;
  metadata: {
    generatedAt: string;
  };
}

const DEFAULT_RANGE = 30;

const querySchema = z.object({
  range: z
    .enum(['7d', '30d', '90d'])
    .optional()
    .transform((value) => value ?? '30d'),
  agent: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high'])
    .optional(),
});

const rateLimiter = createRateLimiter(60_000, 30);

function normalizeQueryValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function resolveFilters(query: HttpRequest['query']): AnalyticsFilters {
  const parsed = querySchema.safeParse({
    range: normalizeQueryValue(query?.range),
    agent: normalizeQueryValue(query?.agent),
    priority: normalizeQueryValue(query?.priority),
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    throw Object.assign(new Error('Invalid analytics query'), {
      statusCode: 400,
      details: issues,
    });
  }

  const rangeValue = parsed.data.range;
  const rangeDays = Number.parseInt(rangeValue.replace('d', ''), 10) || DEFAULT_RANGE;
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - (rangeDays - 1));

  return {
    rangeDays,
    fromDate,
    toDate,
    agent: parsed.data.agent,
    priority: parsed.data.priority,
  };
}

export function computeAnalyticsSummary(
  records: AnalyticsRecord[],
  filters: AnalyticsFilters,
): AnalyticsSummary {
  const priorityCounts: Record<string, number> = { high: 0, medium: 0, low: 0, other: 0 };
  const toneCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const trendMap = new Map<string, number>();

  const start = new Date(filters.fromDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(filters.toDate);
  end.setHours(0, 0, 0, 0);

  for (let i = 0; i < filters.rangeDays; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    trendMap.set(key, 0);
  }

  let confidenceSum = 0;
  let confidenceCount = 0;

  for (const record of records) {
    const priority = (record.priority ?? 'other').toLowerCase();
    if (priority in priorityCounts) {
      priorityCounts[priority] += 1;
    } else {
      priorityCounts.other += 1;
    }

    const toneKey = (record.customer_tone ?? 'unspecified').toLowerCase();
    toneCounts.set(toneKey, (toneCounts.get(toneKey) ?? 0) + 1);

    const categoryKey = record.category?.toLowerCase() ?? 'uncategorized';
    categoryCounts.set(categoryKey, (categoryCounts.get(categoryKey) ?? 0) + 1);

    const created = new Date(record.created_at);
    if (!Number.isNaN(created.valueOf())) {
      const dayKey = created.toISOString().slice(0, 10);
      if (trendMap.has(dayKey)) {
        trendMap.set(dayKey, (trendMap.get(dayKey) ?? 0) + 1);
      }
    }

    if (record.confidence_score !== null && record.confidence_score !== undefined) {
      const confidenceValue =
        typeof record.confidence_score === 'string'
          ? Number.parseFloat(record.confidence_score)
          : record.confidence_score;
      if (Number.isFinite(confidenceValue)) {
        confidenceSum += confidenceValue;
        confidenceCount += 1;
      }
    }
  }

  const toneBreakdown = Object.fromEntries(toneCounts);
  const categoryBreakdown = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    totalReports: records.length,
    rangeDays: filters.rangeDays,
    startDate: filters.fromDate.toISOString(),
    endDate: filters.toDate.toISOString(),
    averages: {
      confidenceScore:
        confidenceCount > 0 ? Number.parseFloat((confidenceSum / confidenceCount).toFixed(2)) : null,
    },
    breakdowns: {
      priority: priorityCounts,
      tone: toneBreakdown,
      category: categoryBreakdown,
    },
    trend: Array.from(trendMap.entries()).map(([date, total]) => ({ date, total })),
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  };
}

async function defaultFetchReports(dbService: DatabaseService, filters: AnalyticsFilters): Promise<AnalyticsRecord[]> {
  if (!dbService.supabase) {
    throw Object.assign(new Error('Database client unavailable'), { statusCode: 503 });
  }

  const { fromDate, toDate } = filters;
  let query = dbService.supabase
    .from('reports')
    .select('priority, customer_tone, category, created_at, confidence_score')
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString())
    .order('created_at', { ascending: true });

  if (filters.agent) {
    query = query.eq('csr_agent', filters.agent);
  }

  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data, error } = await query;

  if (error) {
    const sanitizedMessage = error.message || 'Unknown database error';
    throw Object.assign(new Error(`Failed to load analytics data: ${sanitizedMessage}`), {
      statusCode: 500,
    });
  }

  return data ?? [];
}

interface AnalyticsHandlerDependencies {
  dbService?: DatabaseService | null;
  fetchReports?: (db: DatabaseService, filters: AnalyticsFilters) => Promise<AnalyticsRecord[]>;
  limiter?: (req: HttpRequest, res: HttpResponse) => boolean;
}

export function createAnalyticsHandler(
  deps: AnalyticsHandlerDependencies = {},
): (req: HttpRequest, res: HttpResponse) => Promise<void> {
  let dbService = deps.dbService ?? null;

  if (!dbService) {
    try {
      dbService = new DatabaseService();
    } catch (error) {
      console.error('Analytics API initialization error:', error instanceof Error ? error.message : error);
      dbService = null;
    }
  }

  const fetcher = deps.fetchReports ?? defaultFetchReports;
  const limiter = deps.limiter ?? rateLimiter;

  return async function handler(req: HttpRequest, res: HttpResponse) {
    setSecurityHeaders(res);

    if (!validateHttpMethod(req as never, res as never, ['GET'])) {
      return;
    }

    if (!limiter(req, res)) {
      return;
    }

    if (!dbService || !dbService.isInitialized) {
      res
        .status(503)
        .json({
          error: 'Service Unavailable',
          message: 'Analytics service is not configured',
        });
      return;
    }

    let filters: AnalyticsFilters;

    try {
      filters = resolveFilters(req.query);
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode ?? 400;
      res.status(statusCode).json({
        error: 'Validation Error',
        message: 'Invalid analytics query parameters',
        details: (error as { details?: string[] }).details,
      });
      return;
    }

    try {
      const records = await fetcher(dbService, filters);
      const summary = computeAnalyticsSummary(records, filters);

      res.status(200).json({
        success: true,
        filters: {
          rangeDays: filters.rangeDays,
          agent: filters.agent ?? null,
          priority: filters.priority ?? null,
        },
        analytics: summary,
      });
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
      const message = error instanceof Error ? error.message : 'Unknown analytics error';
      console.error('Analytics API error:', message);
      res.status(statusCode).json({
        error: 'Internal Server Error',
        message: statusCode === 500 ? 'Failed to retrieve analytics data' : message,
      });
    }
  };
}

export default createAnalyticsHandler();
