export type ReportStatus = 'new' | 'in_progress' | 'resolved' | 'blocked' | 'escalated';

export const REPORT_STATUS_ORDER: ReadonlyArray<ReportStatus> = [
  'new',
  'in_progress',
  'blocked',
  'escalated',
  'resolved'
];

export interface ReportRecord {
  id: number;
  report_id: string;
  customer_name: string;
  ticket_subject: string;
  issue_description: string;
  customer_tone: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  confidence_score: number | null;
  response_approach: string | null;
  talking_points: unknown;
  knowledge_base_articles: unknown;
  metadata: Record<string, unknown> | null;
  csr_agent: string;
  status: ReportStatus;
  assignee: string | null;
  sla_due: string | null;
  created_at: string;
  processed_at: string | null;
  updated_at: string | null;
  resolved_at?: string | null;
}

export interface ReportFilters {
  query?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  customerTone?: string;
  assignee?: string;
  status?: ReportStatus;
  slaDueBefore?: string;
  slaDueAfter?: string;
  slaDueIsNull?: boolean;
  excludeResolved?: boolean;
}

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === 'string' && (REPORT_STATUS_ORDER as ReadonlyArray<string>).includes(value);
}

export function normalizeReportStatus(value: unknown): ReportStatus {
  if (isReportStatus(value)) {
    return value;
  }
  return 'new';
}

export function sanitizeFilters(filters: ReportFilters = {}): ReportFilters {
  const sanitized: ReportFilters = {};

  if (filters.query) {
    sanitized.query = filters.query.trim();
  }

  if (filters.priority && ['low', 'medium', 'high'].includes(filters.priority)) {
    sanitized.priority = filters.priority;
  }

  if (filters.category) {
    sanitized.category = filters.category.trim();
  }

  if (filters.customerTone) {
    sanitized.customerTone = filters.customerTone.trim();
  }

  if (filters.assignee) {
    sanitized.assignee = filters.assignee.trim();
  }

  if (filters.status && isReportStatus(filters.status)) {
    sanitized.status = filters.status;
  }

  if (filters.slaDueBefore) {
    sanitized.slaDueBefore = filters.slaDueBefore;
  }

  if (filters.slaDueAfter) {
    sanitized.slaDueAfter = filters.slaDueAfter;
  }

  if (typeof filters.slaDueIsNull === 'boolean') {
    sanitized.slaDueIsNull = filters.slaDueIsNull;
  }

  if (typeof filters.excludeResolved === 'boolean') {
    sanitized.excludeResolved = filters.excludeResolved;
  }

  return sanitized;
}

export function isSlaOverdue(report: Pick<ReportRecord, 'sla_due' | 'status'>, now = new Date()): boolean {
  if (!report.sla_due) {
    return false;
  }

  const slaDueDate = new Date(report.sla_due);
  if (Number.isNaN(slaDueDate.getTime())) {
    return false;
  }

  return slaDueDate.getTime() < now.getTime() && report.status !== 'resolved';
}

export function isSlaDueSoon(
  report: Pick<ReportRecord, 'sla_due' | 'status'>,
  now = new Date(),
  thresholdMinutes = 60 * 6
): boolean {
  if (!report.sla_due) {
    return false;
  }

  const slaDueDate = new Date(report.sla_due);
  if (Number.isNaN(slaDueDate.getTime())) {
    return false;
  }

  const timeUntilDue = slaDueDate.getTime() - now.getTime();
  if (timeUntilDue < 0) {
    return false;
  }

  return timeUntilDue <= thresholdMinutes * 60 * 1000 && report.status !== 'resolved';
}
