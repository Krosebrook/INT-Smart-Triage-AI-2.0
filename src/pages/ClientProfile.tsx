import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { z } from 'zod';
import '../styles/client-profile.css';
import { supabase } from '../services/supabaseClient.js';

const metricsSchema = z.object({
  customer_id: z.string(),
  total_tickets: z.number(),
  open_tickets: z.number(),
  resolved_tickets: z.number(),
  high_priority_tickets: z.number(),
  escalated_tickets: z.number(),
  avg_resolution_time_minutes: z.number().nullable(),
  avg_first_response_minutes: z.number().nullable(),
  last_ticket_created_at: z.string().nullable(),
  last_contact_at: z.string().nullable(),
  sentiment_score: z.number().nullable(),
  sentiment_bucket: z.enum(['detractor', 'passive', 'promoter']).nullable(),
  escalation_rate: z.number().nullable(),
  csat_score: z.number().nullable(),
  health_score: z.number().nullable(),
  metadata: z
    .object({
      highPriorityRatio: z.number().optional(),
      tones: z.record(z.string(), z.number()).optional(),
      channels: z.record(z.string(), z.number()).optional(),
    })
    .passthrough(),
});

type Metrics = z.infer<typeof metricsSchema>;

type Insight = {
  title: string;
  description: string;
  chip: string;
};


function formatNumber(value: number | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function formatRelativeDate(value: string | null): string {
  if (!value) {
    return 'Not recorded';
  }
  const date = new Date(value);
  return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function healthBadgeClass(score: number | null): string {
  if (score === null) {
    return 'health-badge warning';
  }
  if (score >= 75) {
    return 'health-badge';
  }
  if (score >= 50) {
    return 'health-badge warning';
  }
  return 'health-badge danger';
}

function deriveInsights(metrics: Metrics | null): Insight[] {
  if (!metrics) {
    return [];
  }

  const insights: Insight[] = [];

  if ((metrics.health_score ?? 0) < 60) {
    insights.push({
      title: 'Account at risk',
      description:
        'Escalations and unresolved tickets suggest risk of churn. Prioritize proactive outreach and executive check-in.',
      chip: 'High Priority',
    });
  } else {
    insights.push({
      title: 'Account trending healthy',
      description: 'Balanced workload and solid sentiment. Maintain cadence with success planning and strategic reviews.',
      chip: 'Healthy',
    });
  }

  if ((metrics.escalation_rate ?? 0) > 0.2) {
    insights.push({
      title: 'Escalation trend detected',
      description: 'Escalation rate exceeds 20%. Review root causes and reinforce response playbooks with assigned CSR team.',
      chip: 'Escalations',
    });
  }

  if ((metrics.metadata.highPriorityRatio ?? 0) > 0.3) {
    insights.push({
      title: 'High volume of critical tickets',
      description: 'Critical ticket ratio is elevated. Consider a war-room style sync and ensure senior engineers are looped in.',
      chip: 'Critical',
    });
  }

  if ((metrics.avg_first_response_minutes ?? 0) > 180) {
    insights.push({
      title: 'Slow first response times',
      description: 'Initial responses are averaging more than 3 hours. Audit routing rules and enable faster acknowledgements.',
      chip: 'SLA Risk',
    });
  }

  return insights.slice(0, 4);
}

function parseQueryCustomerId(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('customerId') ?? '';
}

function useCustomerMetrics(initialCustomerId: string) {
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(
    async (id: string) => {
      if (!id) {
        setMetrics(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('customer_profile_metrics')
          .select('*')
          .eq('customer_id', id)
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        if (!data) {
          setMetrics(null);
          setError('No aggregated metrics found for this customer.');
          return;
        }

        const parsed = metricsSchema.parse(data);
        setMetrics(parsed);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    },
    [setMetrics, setLoading, setError],
  );

  useEffect(() => {
    if (customerId) {
      void loadMetrics(customerId);
    }
  }, [customerId, loadMetrics]);

  return {
    customerId,
    setCustomerId,
    metrics,
    loading,
    error,
    refresh: loadMetrics,
  };
}

function ClientProfilePage() {
  const initialId = useMemo(() => parseQueryCustomerId(), []);
  const { customerId, setCustomerId, metrics, loading, error, refresh } = useCustomerMetrics(initialId);
  const [inputValue, setInputValue] = useState(initialId);

  const insights = useMemo(() => deriveInsights(metrics), [metrics]);
  const tones = useMemo(
    () => (Object.entries(metrics?.metadata.tones ?? {}) as Array<[string, number]>).sort((a, b) => b[1] - a[1]),
    [metrics],
  );
  const channels = useMemo(
    () => (Object.entries(metrics?.metadata.channels ?? {}) as Array<[string, number]>).sort((a, b) => b[1] - a[1]),
    [metrics],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) {
        return;
      }
      setCustomerId(trimmed);
      void refresh(trimmed);
      const params = new URLSearchParams(window.location.search);
      params.set('customerId', trimmed);
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', nextUrl);
    },
    [inputValue, setCustomerId, refresh],
  );

  return (
    <div className="client-profile-app">
      <main className="client-profile-shell" aria-live="polite">
        <section className="client-profile-card client-profile-header">
          <div>
            <h1>Client Profile Intelligence</h1>
            <p>Surface health trends, SLA performance, and engagement signals for each customer.</p>
          </div>
          <form className="client-profile-search" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="customerId">
              Customer identifier
            </label>
            <input
              id="customerId"
              name="customerId"
              value={inputValue}
              onChange={event => setInputValue(event.target.value)}
              placeholder="Enter customer ID (e.g., cust_1234)"
              autoComplete="off"
            />
            <button type="submit" disabled={!inputValue.trim() || loading}>
              {loading ? 'Loading…' : 'Load profile'}
            </button>
          </form>
          {loading && <div className="loading-indicator">Crunching aggregated metrics…</div>}
          {error && <div className="error-banner">{error}</div>}
        </section>

        {metrics ? (
          <>
            <section className="client-profile-card">
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Account Summary</h2>
                  <p style={{ margin: '4px 0 0', color: '#4b5563' }}>{metrics.customer_id}</p>
                </div>
                <span className={healthBadgeClass(metrics.health_score ?? null)}>
                  Health Score {formatNumber(metrics.health_score, '—')}
                </span>
              </header>

              <div className="metrics-grid" role="list">
                <article className="metric-card" role="listitem">
                  <h3>Total Tickets</h3>
                  <strong>{metrics.total_tickets}</strong>
                  <p style={{ margin: 0, color: '#6b7280' }}>Resolved: {metrics.resolved_tickets}</p>
                </article>
                <article className="metric-card" role="listitem">
                  <h3>Open Tickets</h3>
                  <strong>{metrics.open_tickets}</strong>
                  <p style={{ margin: 0, color: '#ef4444' }}>Escalated: {metrics.escalated_tickets}</p>
                </article>
                <article className="metric-card" role="listitem">
                  <h3>Average Resolution</h3>
                  <strong>{formatNumber(metrics.avg_resolution_time_minutes)}</strong>
                  <p style={{ margin: 0, color: '#6b7280' }}>minutes</p>
                </article>
                <article className="metric-card" role="listitem">
                  <h3>First Response</h3>
                  <strong>{formatNumber(metrics.avg_first_response_minutes)}</strong>
                  <p style={{ margin: 0, color: '#6b7280' }}>minutes</p>
                </article>
                <article className="metric-card" role="listitem">
                  <h3>Sentiment Score</h3>
                  <strong>{formatNumber(metrics.sentiment_score)}</strong>
                  <p style={{ margin: 0, color: '#6b7280' }}>Bucket: {metrics.sentiment_bucket ?? 'Unknown'}</p>
                </article>
                <article className="metric-card" role="listitem">
                  <h3>CSAT Estimate</h3>
                  <strong>{formatNumber(metrics.csat_score)}</strong>
                  <p style={{ margin: 0, color: '#6b7280' }}>Escalation rate {formatNumber(metrics.escalation_rate)}</p>
                </article>
              </div>
            </section>

            <section className="client-profile-card">
              <h2 style={{ marginTop: 0 }}>Key Insights</h2>
              <div className="insights-grid">
                {insights.length === 0 ? (
                  <div className="empty-state">No alerts detected. Keep monitoring activity signals.</div>
                ) : (
                  insights.map(insight => (
                    <article key={insight.title} className="insight-card">
                      <span className="insight-chip">{insight.chip}</span>
                      <h4>{insight.title}</h4>
                      <p style={{ margin: 0, opacity: 0.9 }}>{insight.description}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="client-profile-card">
              <h2 style={{ margin: '0 0 16px' }}>Engagement Signals</h2>
              <div className="activity-list">
                <div className="activity-item">
                  <strong>Latest ticket activity</strong>
                  <span>{formatRelativeDate(metrics.last_ticket_created_at)}</span>
                </div>
                <div className="activity-item">
                  <strong>Last customer contact</strong>
                  <span>{formatRelativeDate(metrics.last_contact_at)}</span>
                </div>
                <div className="activity-item">
                  <strong>Dominant sentiment</strong>
                  <span>
                    {tones.length > 0
                      ? tones
                          .slice(0, 3)
                          .map(([tone, count]) => `${tone} (${count})`)
                          .join(', ')
                      : 'No sentiment history recorded'}
                  </span>
                </div>
                <div className="activity-item">
                  <strong>Primary support channels</strong>
                  <span>
                    {channels.length > 0
                      ? channels
                          .slice(0, 3)
                          .map(([channel, count]) => `${channel} (${count})`)
                          .join(', ')
                      : 'No communication history recorded'}
                  </span>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="client-profile-card empty-state">
            <p>Enter a customer identifier to explore aggregated health and engagement metrics.</p>
          </section>
        )}
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<ClientProfilePage />);
}
