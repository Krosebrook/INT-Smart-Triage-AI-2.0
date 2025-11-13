import { useEffect, useMemo, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { z } from 'zod';
import { supabase } from '../services/supabaseClient.js';

const auditLogBaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  organization_id: z.string().uuid().nullable(),
  action: z.string().min(1),
  entity_type: z.string().nullable(),
  entity_id: z.string().nullable(),
  old_value: z.record(z.any()).nullable(),
  new_value: z.record(z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string().datetime()
});

type AuditLogRow = z.infer<typeof auditLogBaseSchema>;

type AuditLogEntry = AuditLogRow & {
  actor?: {
    full_name: string | null;
    role: string | null;
  };
};

type FilterState = {
  query: string;
  action: string;
  startDate?: string;
  endDate?: string;
};

const defaultFilters: FilterState = {
  query: '',
  action: 'all',
  startDate: undefined,
  endDate: undefined
};

const pageSize = 50;

async function fetchAuditLogs(): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(
      'id, user_id, organization_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (error) {
    throw new Error(`Failed to load audit logs: ${error.message}`);
  }

  const parseResult = z.array(auditLogBaseSchema).safeParse(data ?? []);
  if (!parseResult.success) {
    console.error('Invalid audit log payload received', parseResult.error);
    throw new Error('Received malformed audit log data.');
  }

  return parseResult.data;
}

async function hydrateActors(rows: AuditLogRow[]): Promise<AuditLogEntry[]> {
  const actorIds = Array.from(new Set(rows.map((row) => row.user_id).filter((value): value is string => Boolean(value))));

  if (!actorIds.length) {
    return rows.map((row) => ({ ...row, actor: undefined }));
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, role')
    .in('id', actorIds);

  if (error) {
    throw new Error(`Failed to load actor profiles: ${error.message}`);
  }

  const profileSchema = z
    .object({
      id: z.string().uuid(),
      full_name: z.string().nullable(),
      role: z.string().nullable()
    })
    .array();

  const parsedProfiles = profileSchema.safeParse(data ?? []);
  if (!parsedProfiles.success) {
    console.error('Invalid actor profile payload received', parsedProfiles.error);
    throw new Error('Received malformed actor profile data.');
  }

  const actors = new Map(parsedProfiles.data.map((profile) => [profile.id, profile]));

  return rows.map((row) => ({
    ...row,
    actor: row.user_id ? actors.get(row.user_id) ?? { full_name: null, role: null } : undefined
  }));
}

async function attachActorsSafely(rows: AuditLogRow[]): Promise<AuditLogEntry[]> {
  try {
    return await hydrateActors(rows);
  } catch (error) {
    console.error('Actor hydration failed', error);
    return rows.map((row) => ({ ...row, actor: undefined }));
  }
}

function matchesFilters(entry: AuditLogEntry, filters: FilterState): boolean {
  const haystack = [
    entry.action,
    entry.entity_type ?? '',
    entry.entity_id ?? '',
    entry.actor?.full_name ?? ''
  ]
    .join(' ')
    .toLowerCase();

  if (filters.query && !haystack.includes(filters.query.trim().toLowerCase())) {
    return false;
  }

  if (filters.action !== 'all' && entry.action !== filters.action) {
    return false;
  }

  if (filters.startDate && new Date(entry.created_at) < new Date(filters.startDate)) {
    return false;
  }

  if (filters.endDate && new Date(entry.created_at) > new Date(filters.endDate)) {
    return false;
  }

  return true;
}

export default function AuditLogs(): JSX.Element {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchAuditLogs()
      .then((rows) => attachActorsSafely(rows))
      .then((result) => {
        if (isMounted) {
          setLogs(result);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('audit-logs-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        async () => {
          try {
            const refreshed = await fetchAuditLogs();
            const hydrated = await attachActorsSafely(refreshed);
            setLogs(hydrated);
          } catch (err) {
            console.error('Realtime refresh failed', err);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('Subscribed to audit log changes');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLogs = useMemo(
    () => logs.filter((entry) => matchesFilters(entry, filters)),
    [logs, filters]
  );

  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleDownload = () => {
    const payload = filteredLogs.map((log) => ({
      ...log,
      old_value: log.old_value ?? undefined,
      new_value: log.new_value ?? undefined
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `audit-logs-${new Date().toISOString()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="audit-logs">
      <header>
        <h1>Audit Log Viewer</h1>
        <p>Monitor privileged actions and sensitive configuration changes in real time.</p>
      </header>

      <div className="filters" role="search">
        <label>
          Search
          <input
            type="search"
            value={filters.query}
            onChange={(event) => handleFilterChange({ query: event.target.value })}
            placeholder="Search by action, entity, or actor"
          />
        </label>
        <label>
          Action
          <select
            value={filters.action}
            onChange={(event) => handleFilterChange({ action: event.target.value })}
          >
            <option value="all">All actions</option>
            {Array.from(new Set(logs.map((log) => log.action))).map((actionKey) => (
              <option key={actionKey} value={actionKey}>
                {actionKey}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={filters.startDate ?? ''}
            onChange={(event) => handleFilterChange({ startDate: event.target.value || undefined })}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={filters.endDate ?? ''}
            onChange={(event) => handleFilterChange({ endDate: event.target.value || undefined })}
          />
        </label>
        <button type="button" onClick={handleResetFilters}>
          Reset filters
        </button>
        <button type="button" onClick={handleDownload} disabled={!filteredLogs.length}>
          Download JSON
        </button>
      </div>

      {loading && <p role="status">Loading audit logs…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper" role="region" aria-live="polite">
          <table>
            <thead>
              <tr>
                <th scope="col">Timestamp</th>
                <th scope="col">Action</th>
                <th scope="col">Entity</th>
                <th scope="col">Actor</th>
                <th scope="col">IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5}>No audit logs match the current filters.</td>
                </tr>
              )}
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>
                    <strong>{log.action}</strong>
                    <div className="metadata">
                      {log.entity_type ?? 'unknown'}
                      {log.entity_id ? `#${log.entity_id}` : ''}
                    </div>
                  </td>
                  <td>
                    <details>
                      <summary>Changes</summary>
                      <pre>{JSON.stringify({ before: log.old_value, after: log.new_value }, null, 2)}</pre>
                    </details>
                  </td>
                  <td>
                    <span>{log.actor?.full_name ?? 'System'}</span>
                    <div className="metadata">{log.actor?.role ?? 'n/a'}</div>
                  </td>
                  <td>{log.ip_address ?? 'n/a'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
