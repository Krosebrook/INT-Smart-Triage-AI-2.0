import React, { useEffect, useState } from 'react';

export interface ReportSummary {
  id: string;
  subject: string;
  status: string;
  priority: string;
  updatedAt: string;
}

export type FetchRecentReports = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

async function parseReportsResponse(response: Response): Promise<ReportSummary[]> {
  if (!response.ok) {
    throw new Error(`Failed to load reports: ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error('Malformed reports response');
  }

  return payload.data.map((entry: Record<string, unknown>) => ({
    id: String(entry.id ?? ''),
    subject: String(entry.subject ?? ''),
    status: String(entry.status ?? ''),
    priority: String(entry.priority ?? ''),
    updatedAt: String(entry.updated_at ?? entry.updatedAt ?? ''),
  }));
}

export async function fetchRecentReports(
  fetchImpl: FetchRecentReports = fetch,
  signal?: AbortSignal,
): Promise<ReportSummary[]> {
  const response = await fetchImpl('/api/reports?limit=5', { signal });
  return parseReportsResponse(response);
}

export const RecentReportsWidget: React.FC = () => {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    fetchRecentReports(fetch, abortController.signal)
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
        setError((err as Error)?.message ?? 'Unknown error');
        setLoading(false);
      });

    return () => abortController.abort();
  }, []);

  if (loading) {
    return (
      <section aria-live="polite" className="reports-widget">
        <header>
          <h2>Recent Reports</h2>
        </header>
        <p>Loading latest reports…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-live="polite" className="reports-widget">
        <header>
          <h2>Recent Reports</h2>
        </header>
        <p role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section aria-label="Recent reports" className="reports-widget">
      <header>
        <h2>Recent Reports</h2>
        <span className="reports-count">{reports.length}</span>
      </header>
      <ul>
        {reports.map((report) => (
          <li key={report.id} className="reports-widget__item">
            <div>
              <p className="reports-widget__subject">{report.subject || 'No subject'}</p>
              <p className="reports-widget__meta">
                <span className={`status status--${report.status.toLowerCase()}`}>{report.status}</span>
                <span className={`priority priority--${report.priority.toLowerCase()}`}>{report.priority}</span>
              </p>
            </div>
            <time dateTime={report.updatedAt}>{new Date(report.updatedAt).toLocaleString()}</time>
          </li>
        ))}
      </ul>
    </section>
  );
};

const Home: React.FC = () => (
  <main>
    <h1>Client Success Overview</h1>
    <RecentReportsWidget />
  </main>
);

export default Home;
