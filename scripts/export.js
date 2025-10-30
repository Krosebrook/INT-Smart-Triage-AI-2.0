const DEFAULT_FILENAME = 'history-export.csv';

export const HISTORY_EXPORT_HEADERS = Object.freeze([
  'Report ID',
  'Customer',
  'Subject',
  'Status',
  'Priority',
  'Updated At',
]);

function escapeCsvValue(value) {
  const stringValue = value == null ? '' : String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function maybeDownload(csv, filename) {
  if (typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}

export function exportHistoryToCSV(reports, options = {}) {
  const { filename = DEFAULT_FILENAME, download = typeof document !== 'undefined' } = options;

  const rows = reports.map((report) =>
    [
      escapeCsvValue(report.id),
      escapeCsvValue(report.customer),
      escapeCsvValue(report.subject),
      escapeCsvValue(report.status),
      escapeCsvValue(report.priority),
      escapeCsvValue(report.updatedAt ?? report.updated_at),
    ].join(','),
  );

  const csv = [HISTORY_EXPORT_HEADERS.join(','), ...rows].join('\n');

  if (download) {
    maybeDownload(csv, filename);
  }

  return csv;
}

export default exportHistoryToCSV;
