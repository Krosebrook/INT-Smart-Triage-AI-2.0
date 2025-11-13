import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface BreakdownItem {
  name: string;
  count: number;
}

interface AnalyticsSummary {
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
    category: BreakdownItem[];
  };
  trend: Array<{ date: string; total: number }>;
  metadata: {
    generatedAt: string;
  };
}

interface AnalyticsResponse {
  success: boolean;
  filters: {
    rangeDays: number;
    agent: string | null;
    priority: string | null;
  };
  analytics: AnalyticsSummary;
}

const RANGE_OPTIONS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: '#dc2626',
  medium: '#f97316',
  low: '#22c55e',
  other: '#6b7280',
};

const TONE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed', '#0ea5e9'];

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

const AnalyticsPage = () => {
  const [range, setRange] = useState('30d');
  const [agentFilter, setAgentFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ range });

    if (agentFilter.trim()) {
      params.set('agent', agentFilter.trim());
    }

    if (priorityFilter) {
      params.set('priority', priorityFilter);
    }

    try {
      const response = await fetch(`/api/analytics?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Failed to load analytics data');
      }

      const payload = (await response.json()) as AnalyticsResponse;
      setAnalytics(payload.analytics);
    } catch (fetchError) {
      if ((fetchError as Error).name !== 'AbortError') {
        setError((fetchError as Error).message || 'Unable to fetch analytics data');
      }
    } finally {
      setLoading(false);
    }
  }, [agentFilter, priorityFilter, range]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAnalytics(controller.signal);
    return () => controller.abort();
  }, [fetchAnalytics]);

  const priorityData = useMemo(() => {
    if (!analytics) {
      return [] as Array<{ name: string; value: number }>;
    }
    return Object.entries(analytics.breakdowns.priority).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
    }));
  }, [analytics]);

  const toneData = useMemo(() => {
    if (!analytics) {
      return [] as Array<{ name: string; value: number }>;
    }
    return Object.entries(analytics.breakdowns.tone).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
    }));
  }, [analytics]);

  const categoryData = useMemo(() => analytics?.breakdowns.category ?? [], [analytics]);

  const summaryCards = useMemo(() => {
    if (!analytics) {
      return [] as Array<{ label: string; value: string }>; 
    }

    return [
      {
        label: 'Total Tickets',
        value: analytics.totalReports.toLocaleString(),
      },
      {
        label: 'Average Confidence',
        value: analytics.averages.confidenceScore !== null
          ? `${analytics.averages.confidenceScore.toFixed(1)}%`
          : 'N/A',
      },
      {
        label: 'Reporting Window',
        value: `${analytics.rangeDays} days`,
      },
    ];
  }, [analytics]);

  return (
    <div className="analytics-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Support Analytics Overview</h1>
        <p style={{ color: '#4b5563' }}>
          Monitor ticket trends, workload distribution, and confidence insights aggregated from Supabase reports.
        </p>
      </header>

      <section
        aria-label="Analytics filters"
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          marginBottom: '1.5rem',
          backgroundColor: '#f3f4f6',
          padding: '1rem',
          borderRadius: '0.75rem',
        }}
      >
        <label htmlFor="time-range-select" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
          Time Range
          <select
            id="time-range-select"
            value={range}
            onChange={(event) => setRange(event.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="agent-filter-input" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
          Agent (optional)
          <input
            id="agent-filter-input"
            type="text"
            placeholder="e.g. jsmith"
            value={agentFilter}
            onChange={(event) => setAgentFilter(event.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
          />
        </label>

        <label htmlFor="priority-filter-select" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
          Priority
          <select
            id="priority-filter-select"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
          >
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => fetchAnalytics()}
          style={{
            alignSelf: 'end',
            padding: '0.65rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: '#2563eb',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh Data'}
        </button>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {loading && !analytics && (
        <p style={{ color: '#4b5563' }}>Loading analytics…</p>
      )}

      {analytics && (
        <>
          <section
            aria-label="Analytics summary"
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              marginBottom: '1.5rem',
            }}
          >
            {summaryCards.map((card) => (
              <div
                key={card.label}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: '0 10px 25px -15px rgba(15, 23, 42, 0.45)',
                }}
              >
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.35rem' }}>{card.label}</p>
                <p style={{ fontSize: '1.65rem', fontWeight: 700 }}>{card.value}</p>
              </div>
            ))}
          </section>

          <section
            aria-label="Volume trend"
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 10px 25px -15px rgba(15, 23, 42, 0.25)',
              height: 360,
            }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ticket Volume Trend</h2>
            <ResponsiveContainer>
              <AreaChart data={analytics.trend} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#9ca3af" />
                <YAxis allowDecimals={false} stroke="#9ca3af" />
                <Tooltip
                  labelFormatter={(value) => `Date: ${formatDateLabel(value as string)}`}
                  formatter={(value: number) => [`${value} tickets`, 'Volume']}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#trendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section
            aria-label="Distribution charts"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                boxShadow: '0 10px 25px -15px rgba(15, 23, 42, 0.25)',
                height: 320,
              }}
            >
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Priority Mix</h2>
              <ResponsiveContainer>
                <PieChart>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip formatter={(value: number, name: string) => [`${value} tickets`, name]} />
                  <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name.toLowerCase()] || '#4b5563'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                boxShadow: '0 10px 25px -15px rgba(15, 23, 42, 0.25)',
                height: 320,
              }}
            >
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Customer Tone</h2>
              <ResponsiveContainer>
                <BarChart data={toneData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis allowDecimals={false} stroke="#9ca3af" />
                  <Tooltip formatter={(value: number) => [`${value} tickets`, 'Count']} />
                  <Bar dataKey="value">
                    {toneData.map((entry, index) => (
                      <Cell key={entry.name} fill={TONE_COLORS[index % TONE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section
            aria-label="Top categories"
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              boxShadow: '0 10px 25px -15px rgba(15, 23, 42, 0.25)',
            }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Top Categories</h2>
            {categoryData.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No category data available for the selected range.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                {categoryData.map((category) => (
                  <li key={category.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ textTransform: 'capitalize' }}>{category.name}</span>
                    <span style={{ fontWeight: 600 }}>{category.count.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
