import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

type JsonRecord = Record<string, unknown>;

type Nullable<T> = T | null;

type LogLevel = 'info' | 'warn' | 'error';

interface StructuredLog {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface TicketRecord {
  report_id: string;
  created_at: string;
  resolved_at: Nullable<string>;
  status: Nullable<string>;
  priority: Nullable<string>;
  customer_tone: Nullable<string>;
  escalated_at: Nullable<string>;
  metadata: JsonRecord | null;
}

export interface CommunicationRecord {
  report_id: Nullable<string>;
  sent_at: string;
  channel: string;
  status: Nullable<string>;
}

export interface CustomerMetrics {
  customer_id: string;
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  high_priority_tickets: number;
  escalated_tickets: number;
  avg_resolution_time_minutes: Nullable<number>;
  avg_first_response_minutes: Nullable<number>;
  last_ticket_created_at: Nullable<string>;
  last_contact_at: Nullable<string>;
  sentiment_score: Nullable<number>;
  sentiment_bucket: Nullable<'detractor' | 'passive' | 'promoter'>;
  escalation_rate: Nullable<number>;
  csat_score: Nullable<number>;
  health_score: Nullable<number>;
  metadata: JsonRecord;
}

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CUSTOMER_ENRICH_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(50),
  CUSTOMER_ENRICH_DRY_RUN: z
    .string()
    .optional()
    .transform(value => value === 'true'),
});

const sentimentWeights: Record<string, number> = {
  delighted: 0.9,
  calm: 0.4,
  satisfied: 0.6,
  neutral: 0,
  confused: -0.2,
  frustrated: -0.6,
  angry: -0.8,
  urgent: -0.4,
};

function log(entry: StructuredLog): void {
  const payload = { ...entry, timestamp: new Date().toISOString(), source: 'customer-enrichment-job' };
  console.log(JSON.stringify(payload));
}

function average(values: number[]): Nullable<number> {
  if (values.length === 0) {
    return null;
  }
  const total = values.reduce((acc, value) => acc + value, 0);
  return Number((total / values.length).toFixed(2));
}

function minutesBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60);
}

function deriveSentimentScore(tickets: TicketRecord[]): Nullable<number> {
  if (tickets.length === 0) {
    return null;
  }

  const scores = tickets
    .map(ticket => {
      if (!ticket.customer_tone) {
        return undefined;
      }
      const tone = ticket.customer_tone.toLowerCase();
      if (tone in sentimentWeights) {
        return sentimentWeights[tone];
      }
      return 0;
    })
    .filter((score): score is number => typeof score === 'number' && Number.isFinite(score));

  if (scores.length === 0) {
    return null;
  }

  return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
}

function deriveSentimentBucket(score: Nullable<number>): Nullable<'detractor' | 'passive' | 'promoter'> {
  if (score === null) {
    return null;
  }
  if (score <= -0.2) {
    return 'detractor';
  }
  if (score >= 0.3) {
    return 'promoter';
  }
  return 'passive';
}

function deriveCsatScore(metrics: { resolved: number; total: number; sentiment: Nullable<number> }): Nullable<number> {
  if (metrics.total === 0) {
    return null;
  }
  const resolutionRate = metrics.total === 0 ? 0 : metrics.resolved / metrics.total;
  const sentimentBonus = metrics.sentiment ?? 0;
  const csat = Math.max(0, Math.min(100, 70 * resolutionRate + 30 + sentimentBonus * 20));
  return Number(csat.toFixed(2));
}

function deriveHealthScore(metrics: {
  openTickets: number;
  totalTickets: number;
  escalationRate: number;
  sentiment: Nullable<number>;
  avgResolutionMinutes: Nullable<number>;
}): Nullable<number> {
  if (metrics.totalTickets === 0) {
    return null;
  }

  const openRatio = metrics.totalTickets === 0 ? 0 : metrics.openTickets / metrics.totalTickets;
  const sentimentComponent = (metrics.sentiment ?? 0) * 20;
  const resolutionComponent = metrics.avgResolutionMinutes ? Math.max(0, 40 - Math.log(metrics.avgResolutionMinutes + 1) * 10) : 20;
  const escalationComponent = Math.max(0, 30 - metrics.escalationRate * 100 * 0.6);
  const workloadComponent = Math.max(0, 30 - openRatio * 100 * 0.5);

  const healthScore = 20 + sentimentComponent + resolutionComponent + escalationComponent + workloadComponent;
  return Number(Math.min(100, Math.max(0, healthScore)).toFixed(2));
}

export function buildAggregatedMetrics(
  customerId: string,
  tickets: TicketRecord[],
  communications: CommunicationRecord[],
): CustomerMetrics {
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved').length;
  const openTickets = tickets.filter(ticket => ticket.status !== 'resolved').length;
  const highPriorityTickets = tickets.filter(ticket => ticket.priority === 'high').length;
  const escalatedTickets = tickets.filter(ticket => ticket.escalated_at !== null || ticket.metadata?.escalated === true).length;

  const resolutionTimes = tickets
    .filter(ticket => ticket.resolved_at)
    .map(ticket => minutesBetween(ticket.created_at, ticket.resolved_at as string))
    .filter(duration => Number.isFinite(duration) && duration >= 0);

  const firstResponseTimes = tickets
    .map(ticket => {
      const relatedCommunications = communications
        .filter(comm => comm.report_id && comm.report_id === ticket.report_id)
        .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());

      if (relatedCommunications.length === 0) {
        return null;
      }

      const firstCommunication = relatedCommunications[0];
      const minutes = minutesBetween(ticket.created_at, firstCommunication.sent_at);
      return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
    })
    .filter((value): value is number => value !== null);

  const sentimentScore = deriveSentimentScore(tickets);
  const sentimentBucket = deriveSentimentBucket(sentimentScore);
  const escalationRate = totalTickets === 0 ? null : Number((escalatedTickets / totalTickets).toFixed(2));
  const avgResolutionTime = average(resolutionTimes);
  const avgFirstResponse = average(firstResponseTimes);
  const csatScore = deriveCsatScore({ resolved: resolvedTickets, total: totalTickets, sentiment: sentimentScore });
  const healthScore = deriveHealthScore({
    openTickets,
    totalTickets,
    escalationRate: escalationRate ?? 0,
    sentiment: sentimentScore,
    avgResolutionMinutes: avgResolutionTime,
  });

  const lastTicketCreatedAt = tickets.reduce<Nullable<string>>((latest, ticket) => {
    if (!latest) {
      return ticket.created_at;
    }
    return new Date(ticket.created_at) > new Date(latest) ? ticket.created_at : latest;
  }, null);

  const lastContactAt = communications.reduce<Nullable<string>>((latest, communication) => {
    if (!latest) {
      return communication.sent_at;
    }
    return new Date(communication.sent_at) > new Date(latest) ? communication.sent_at : latest;
  }, null);

  return {
    customer_id: customerId,
    total_tickets: totalTickets,
    open_tickets: openTickets,
    resolved_tickets: resolvedTickets,
    high_priority_tickets: highPriorityTickets,
    escalated_tickets: escalatedTickets,
    avg_resolution_time_minutes: avgResolutionTime,
    avg_first_response_minutes: avgFirstResponse,
    last_ticket_created_at: lastTicketCreatedAt,
    last_contact_at: lastContactAt,
    sentiment_score: sentimentScore,
    sentiment_bucket: sentimentBucket,
    escalation_rate: escalationRate,
    csat_score: csatScore,
    health_score: healthScore,
    metadata: {
      highPriorityRatio: totalTickets === 0 ? 0 : Number((highPriorityTickets / totalTickets).toFixed(2)),
      tones: tickets.reduce<Record<string, number>>((acc, ticket) => {
        if (!ticket.customer_tone) {
          return acc;
        }
        const tone = ticket.customer_tone.toLowerCase();
        acc[tone] = (acc[tone] ?? 0) + 1;
        return acc;
      }, {}),
      channels: communications.reduce<Record<string, number>>((acc, communication) => {
        const channel = communication.channel.toLowerCase();
        acc[channel] = (acc[channel] ?? 0) + 1;
        return acc;
      }, {}),
    },
  };
}

async function fetchTickets(client: SupabaseClient, customerId: string): Promise<TicketRecord[]> {
  const { data, error } = await client
    .from('reports')
    .select('report_id, created_at, resolved_at, status, priority, customer_tone, escalated_at, metadata')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) {
    throw error;
  }

  return (data ?? []) as TicketRecord[];
}

async function fetchCommunications(client: SupabaseClient, customerId: string): Promise<CommunicationRecord[]> {
  const { data, error } = await client
    .from('communication_log')
    .select('report_id, sent_at, channel, status')
    .eq('customer_id', customerId)
    .order('sent_at', { ascending: true })
    .limit(500);

  if (error) {
    throw error;
  }

  return (data ?? []) as CommunicationRecord[];
}

async function upsertMetrics(
  client: SupabaseClient,
  metrics: CustomerMetrics,
  dryRun: boolean,
): Promise<void> {
  if (dryRun) {
    log({ level: 'info', message: 'Dry run active; skipping metrics upsert', context: { customerId: metrics.customer_id } });
    return;
  }

  const { error } = await client.from('customer_profile_metrics').upsert(metrics, {
    onConflict: 'customer_id',
  });

  if (error) {
    throw error;
  }
}

async function fetchCustomerIds(client: SupabaseClient, pageSize: number): Promise<string[]> {
  const ids = new Set<string>();

  let page = 0;
  while (true) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    const { data, error } = await client
      .from('customer_profiles')
      .select('customer_id')
      .order('customer_id')
      .range(start, end);

    if (error) {
      throw error;
    }

    data?.forEach(row => {
      if (row.customer_id) {
        ids.add(row.customer_id);
      }
    });

    if (!data || data.length < pageSize) {
      break;
    }

    page += 1;
  }

  page = 0;
  while (true) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    const { data, error } = await client
      .from('reports')
      .select('customer_id')
      .not('customer_id', 'is', null)
      .order('customer_id')
      .range(start, end);

    if (error) {
      throw error;
    }

    data?.forEach(row => {
      if (row.customer_id) {
        ids.add(row.customer_id);
      }
    });

    if (!data || data.length < pageSize) {
      break;
    }

    page += 1;
  }

  return Array.from(ids);
}

async function enrichCustomer(
  client: SupabaseClient,
  customerId: string,
  dryRun: boolean,
): Promise<CustomerMetrics> {
  const [tickets, communications] = await Promise.all([
    fetchTickets(client, customerId),
    fetchCommunications(client, customerId),
  ]);

  const metrics = buildAggregatedMetrics(customerId, tickets, communications);
  await upsertMetrics(client, metrics, dryRun);
  return metrics;
}

export interface EnrichmentResult {
  processed: number;
  successful: number;
  failed: number;
  dryRun: boolean;
  failures: Array<{ customerId: string; error: string }>;
}

export async function runCustomerEnrichment(): Promise<EnrichmentResult> {
  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.SUPABASE_PROJECT_URL ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    CUSTOMER_ENRICH_BATCH_SIZE: process.env.CUSTOMER_ENRICH_BATCH_SIZE,
    CUSTOMER_ENRICH_DRY_RUN: process.env.CUSTOMER_ENRICH_DRY_RUN,
  });

  if (!parsed.success) {
    const issue = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration for enrichment job: ${JSON.stringify(issue)}`);
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CUSTOMER_ENRICH_BATCH_SIZE, CUSTOMER_ENRICH_DRY_RUN } = parsed.data;

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'customer-enrichment-job' } },
  });

  const dryRun = CUSTOMER_ENRICH_DRY_RUN ?? false;

  const customerIds = await fetchCustomerIds(client, CUSTOMER_ENRICH_BATCH_SIZE);
  log({ level: 'info', message: 'Starting customer enrichment', context: { customerCount: customerIds.length, dryRun } });

  let successful = 0;
  const failures: Array<{ customerId: string; error: string }> = [];

  for (const customerId of customerIds) {
    try {
      await enrichCustomer(client, customerId, dryRun);
      successful += 1;
    } catch (error) {
      const err = error as Error;
      failures.push({ customerId, error: err.message });
      log({ level: 'error', message: 'Failed to enrich customer', context: { customerId, error: err.message } });
    }
  }

  const result: EnrichmentResult = {
    processed: customerIds.length,
    successful,
    failed: failures.length,
    dryRun,
    failures,
  };

  log({ level: 'info', message: 'Customer enrichment complete', context: { ...result } });
  return result;
}

export default async function handler(_req?: unknown, res?: { status: (statusCode: number) => { json: (body: unknown) => void } }): Promise<void> {
  try {
    const result = await runCustomerEnrichment();
    if (res && typeof res.status === 'function') {
      res.status(200).json(result);
    }
  } catch (error) {
    const err = error as Error;
    log({ level: 'error', message: 'Customer enrichment job failed', context: { error: err.message } });
    if (res && typeof res.status === 'function') {
      res.status(500).json({ error: err.message });
    } else {
      throw err;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCustomerEnrichment().catch(error => {
    const err = error as Error;
    log({ level: 'error', message: 'Unhandled enrichment error', context: { error: err.message } });
    process.exitCode = 1;
  });
}
