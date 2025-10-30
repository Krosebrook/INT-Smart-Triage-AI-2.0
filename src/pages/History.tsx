import React, { useState } from 'react';
import {
  exportSelectedReports,
  toggleSelection,
  type HistoryReport,
} from './historySelection';

export interface HistoryProps {
  reports: HistoryReport[];
}

const History: React.FC<HistoryProps> = ({ reports }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => toggleSelection(id, prev));
    setError(null);
  };

  const handleExport = () => {
    try {
      const csv = exportSelectedReports(reports, selectedIds);
      setLastExport(csv);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === reports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reports.map((report) => report.id)));
    }
    setError(null);
  };

  return (
    <section className="history-page">
      <header className="history-header">
        <h1>Report History</h1>
        <div className="history-actions">
          <button type="button" onClick={handleSelectAll}>
            {selectedIds.size === reports.length ? 'Deselect All' : 'Select All'}
          </button>
          <button type="button" onClick={handleExport} disabled={selectedIds.size === 0}>
            Export Selected
          </button>
        </div>
      </header>
      {error && (
        <div role="alert" className="history-error">
          {error}
        </div>
      )}
      <ul className="history-list">
        {reports.map((report) => (
          <li key={report.id} className="history-list__item">
            <label>
              <input
                type="checkbox"
                checked={selectedIds.has(report.id)}
                onChange={() => handleToggle(report.id)}
              />
              <span className="history-list__subject">{report.subject}</span>
            </label>
            <div className="history-list__meta">
              <span>{report.customer}</span>
              <span>{report.status}</span>
              <span>{report.priority}</span>
              <time dateTime={report.updatedAt}>{new Date(report.updatedAt).toLocaleString()}</time>
            </div>
          </li>
        ))}
      </ul>
      {lastExport && (
        <details className="history-export-preview">
          <summary>Preview last export</summary>
          <pre>{lastExport}</pre>
        </details>
      )}
    </section>
  );
};

export default History;
export { exportSelectedReports, toggleSelection } from './historySelection';
export type { HistoryReport } from './historySelection';
