const STATUS_LABELS = {
    new: 'New',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    escalated: 'Escalated',
    resolved: 'Resolved'
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function endOfDay(date) {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
}

function endOfWeek(date) {
    const copy = endOfDay(date);
    const day = copy.getDay();
    const diff = 6 - day; // 0 = Sunday, 6 = Saturday
    copy.setDate(copy.getDate() + diff);
    return copy;
}

export function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
}

export function buildHistoryFilters(formData, now = new Date()) {
    const filters = {};
    const result = { query: '', filters };

    const query = formData.get('searchQuery');
    if (typeof query === 'string' && query.trim()) {
        result.query = query.trim();
    }

    const priority = formData.get('priority');
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
        filters.priority = priority;
    }

    const status = formData.get('status');
    if (status && STATUS_OPTIONS.includes(status)) {
        filters.status = status;
    }

    const tone = formData.get('tone');
    if (tone && tone.trim()) {
        filters.customerTone = tone.trim();
    }

    const assignee = formData.get('assignee');
    if (assignee && assignee.trim()) {
        filters.assignee = assignee.trim();
    }

    const sla = formData.get('sla') || 'all';
    const reference = new Date(now);
    switch (sla) {
        case 'overdue':
            filters.slaDueBefore = reference.toISOString();
            filters.excludeResolved = true;
            break;
        case 'today':
            filters.slaDueAfter = startOfDay(reference).toISOString();
            filters.slaDueBefore = endOfDay(reference).toISOString();
            break;
        case 'week':
            filters.slaDueAfter = startOfDay(reference).toISOString();
            filters.slaDueBefore = endOfWeek(reference).toISOString();
            break;
        case 'none':
            filters.slaDueIsNull = true;
            break;
        default:
            break;
    }

    return result;
}

export function getSlaBadgeState(report, now = new Date()) {
    if (!report?.sla_due) {
        return { className: 'sla-badge', label: 'No SLA Set' };
    }

    const slaDate = new Date(report.sla_due);
    if (Number.isNaN(slaDate.getTime())) {
        return { className: 'sla-badge', label: 'Invalid SLA' };
    }

    const formatted = formatSlaDue(report.sla_due);

    if (report.status === 'resolved') {
        return { className: 'sla-badge', label: formatted };
    }

    if (slaDate.getTime() < now.getTime()) {
        return { className: 'sla-badge overdue', label: `${formatted} (Overdue)` };
    }

    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    if (slaDate.getTime() <= sixHoursFromNow.getTime()) {
        return { className: 'sla-badge soon', label: `${formatted} (Due Soon)` };
    }

    return { className: 'sla-badge', label: formatted };
}

export function formatSlaDue(value) {
    if (!value) {
        return 'No SLA Set';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Invalid SLA';
    }

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatStatus(status) {
    return getStatusLabel(status);
}

export { STATUS_OPTIONS as REPORT_STATUS_OPTIONS };
