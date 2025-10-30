import { exportHistoryToCSV } from '../../scripts/export.js';

export interface HistoryReport {
  id: string;
  customer: string;
  subject: string;
  status: string;
  priority: string;
  updatedAt: string;
}

export type HistoryExporter = (reports: HistoryReport[]) => string;

export function toggleSelection(id: string, selected: ReadonlySet<string>): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export function exportSelectedReports(
  reports: HistoryReport[],
  selectedIds: ReadonlySet<string>,
  exporter: HistoryExporter = exportHistoryToCSV,
): string {
  if (selectedIds.size === 0) {
    throw new Error('Select at least one report before exporting.');
  }

  const selectedReports = reports.filter((report) => selectedIds.has(report.id));
  if (selectedReports.length === 0) {
    throw new Error('No matching reports for the selected identifiers.');
  }

  return exporter(selectedReports);
}
