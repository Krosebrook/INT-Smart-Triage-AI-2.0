export interface HistoryExportRecord {
  id: string;
  customer: string;
  subject: string;
  status: string;
  priority: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface ExportHistoryOptions {
  filename?: string;
  download?: boolean;
}

export declare const HISTORY_EXPORT_HEADERS: readonly string[];
export declare function exportHistoryToCSV(
  reports: ReadonlyArray<HistoryExportRecord>,
  options?: ExportHistoryOptions,
): string;
export default exportHistoryToCSV;
