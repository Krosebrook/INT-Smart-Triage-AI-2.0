import { supabase } from '../supabaseClient.js';

export type ReportStatus = 'new' | 'in_progress' | 'resolved';

export interface ReportRow {
    report_id: string;
    created_at: string;
    updated_at?: string | null;
    resolved_at?: string | null;
    ticket_subject?: string | null;
    issue_description?: string | null;
    response_approach?: string | null;
    customer_name?: string | null;
    customer_tone?: string | null;
    category?: string | null;
    priority?: string | null;
    status?: string | null;
    confidence_score?: number | null;
    csr_agent?: string | null;
    assigned_to?: string | null;
    assigned_at?: string | null;
    metadata?: Record<string, unknown> | null;
    talking_points?: unknown;
    knowledge_base_articles?: unknown;
}

export interface Report {
    reportId: string;
    createdAt: string;
    updatedAt: string | null;
    resolvedAt: string | null;
    ticketSubject: string;
    issueDescription: string;
    responseApproach: string;
    customerName: string;
    customerTone: string;
    category: string;
    priority: string;
    status: ReportStatus;
    confidenceScore: number | null;
    csrAgent: string | null;
    assignedTo: string | null;
    assignedAt: string | null;
    metadata: Record<string, unknown>;
    talkingPoints: string[];
    knowledgeBaseArticles: string[];
}

export interface ReportNoteRow {
    id: number;
    report_id: string;
    note_text: string | null;
    csr_agent: string | null;
    created_at: string;
}

export interface ReportNote {
    id: number;
    reportId: string;
    noteText: string;
    csrAgent: string;
    createdAt: string;
}

function ensureSupabaseClient() {
    if (!supabase) {
        throw new Error('Supabase client is not configured.');
    }

    return supabase;
}

function normalizeStatus(status: string | null | undefined): ReportStatus {
    if (status === 'in_progress' || status === 'resolved') {
        return status;
    }

    return 'new';
}

function mapReportRow(row: ReportRow): Report {
    const metadata = (row.metadata && typeof row.metadata === 'object') ? row.metadata : {};
    const talkingPoints = Array.isArray(row.talking_points)
        ? row.talking_points.filter((point): point is string => typeof point === 'string' && point.trim().length > 0)
        : [];
    const knowledgeBaseArticles = Array.isArray(row.knowledge_base_articles)
        ? row.knowledge_base_articles.filter((article): article is string => typeof article === 'string' && article.trim().length > 0)
        : [];

    return {
        reportId: row.report_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? null,
        resolvedAt: row.resolved_at ?? null,
        ticketSubject: row.ticket_subject?.trim() ?? '',
        issueDescription: row.issue_description?.trim() ?? '',
        responseApproach: row.response_approach?.trim() ?? '',
        customerName: row.customer_name?.trim() ?? 'Unknown customer',
        customerTone: row.customer_tone?.trim() ?? 'neutral',
        category: row.category?.trim() ?? 'General',
        priority: row.priority?.trim() ?? 'medium',
        status: normalizeStatus(row.status),
        confidenceScore: typeof row.confidence_score === 'number' ? row.confidence_score : null,
        csrAgent: row.csr_agent?.trim() ?? null,
        assignedTo: row.assigned_to?.trim() ?? null,
        assignedAt: row.assigned_at ?? null,
        metadata,
        talkingPoints,
        knowledgeBaseArticles,
    };
}

function mapNoteRow(row: ReportNoteRow): ReportNote {
    return {
        id: row.id,
        reportId: row.report_id,
        noteText: row.note_text?.trim() ?? '',
        csrAgent: row.csr_agent?.trim() ?? 'Unassigned',
        createdAt: row.created_at,
    };
}

export async function fetchReportDetail(reportId: string): Promise<Report> {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('A report identifier is required.');
    }

    const client = ensureSupabaseClient();
    const { data, error } = await client
        .from('reports')
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

    if (error) {
        throw new Error(`Unable to load report: ${error.message}`);
    }

    if (!data) {
        throw new Error('Report not found.');
    }

    return mapReportRow(data as ReportRow);
}

export async function fetchReportNotes(reportId: string): Promise<ReportNote[]> {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('A report identifier is required to load notes.');
    }

    const client = ensureSupabaseClient();
    const { data, error } = await client
        .from('report_notes')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Unable to load notes: ${error.message}`);
    }

    return (data as ReportNoteRow[]).map(mapNoteRow);
}

export async function createReportNote(reportId: string, noteText: string, csrAgent: string | null): Promise<ReportNote> {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('A report identifier is required to add a note.');
    }

    const sanitized = noteText?.toString().trim();

    if (!sanitized) {
        throw new Error('Note text cannot be empty.');
    }

    const client = ensureSupabaseClient();
    const { data, error } = await client
        .from('report_notes')
        .insert({
            report_id: reportId,
            note_text: sanitized,
            csr_agent: csrAgent?.trim() || null,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Unable to add note: ${error.message}`);
    }

    return mapNoteRow(data as ReportNoteRow);
}

export async function removeReportNote(noteId: number): Promise<void> {
    if (!Number.isFinite(noteId)) {
        throw new Error('A valid note identifier is required.');
    }

    const client = ensureSupabaseClient();
    const { error } = await client
        .from('report_notes')
        .delete()
        .eq('id', noteId);

    if (error) {
        throw new Error(`Unable to delete note: ${error.message}`);
    }
}

export async function setReportStatus(reportId: string, status: ReportStatus): Promise<Report> {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('A report identifier is required to update status.');
    }

    const nextStatus = normalizeStatus(status);
    const updatePayload: Record<string, unknown> = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
    };

    if (nextStatus === 'resolved') {
        updatePayload.resolved_at = new Date().toISOString();
    }

    const client = ensureSupabaseClient();
    const { data, error } = await client
        .from('reports')
        .update(updatePayload)
        .eq('report_id', reportId)
        .select()
        .maybeSingle();

    if (error) {
        throw new Error(`Unable to update status: ${error.message}`);
    }

    if (!data) {
        throw new Error('Report not found while updating status.');
    }

    return mapReportRow(data as ReportRow);
}

export async function assignReportTo(reportId: string, assignee: string | null): Promise<Report> {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('A report identifier is required to update assignment.');
    }

    const client = ensureSupabaseClient();
    const trimmedAssignee = assignee?.trim();
    const updatePayload: Record<string, unknown> = {
        assigned_to: trimmedAssignee || null,
        assigned_at: trimmedAssignee ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
        .from('reports')
        .update(updatePayload)
        .eq('report_id', reportId)
        .select()
        .maybeSingle();

    if (error) {
        throw new Error(`Unable to update assignment: ${error.message}`);
    }

    if (!data) {
        throw new Error('Report not found while updating assignment.');
    }

    return mapReportRow(data as ReportRow);
}

export { mapReportRow }; // exported for potential reuse and testing
