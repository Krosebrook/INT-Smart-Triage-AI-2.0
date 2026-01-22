const STATUS_LABELS = {
    new: 'New',
    in_progress: 'In Progress',
    resolved: 'Resolved',
};

const MAX_NOTE_LENGTH = 1000;

const state = {
    reportId: null,
    report: null,
    notes: [],
};

let reportServicePromise = null;
let themeModulePromise = null;

function ensureReportService() {
    if (!reportServicePromise) {
        reportServicePromise = import('./services/reports.ts');
    }

    return reportServicePromise;
}


function ensureThemeModule() {
    if (!themeModulePromise) {
        themeModulePromise = import('/public/theme.js').catch(error => {
            console.error('Failed to load theme module', error);
            return { initTheme: () => {}, toggleTheme: () => {} };
        });
    }

    return themeModulePromise;
}

function formatStatusLabel(status) {
    return STATUS_LABELS[status] ?? STATUS_LABELS.new;
}

function formatDateTime(value) {
    if (!value) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(value));
    } catch (error) {
        console.error('Error formatting date', error);
        return value;
    }
}

function setElementText(id, value) {
    const element = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (element) {
        element.textContent = value ?? '—';
    }
}

function updatePriorityBadge(priorityLabel) {
    const badge = typeof document !== 'undefined' ? document.getElementById('priorityBadge') : null;
    if (!badge) {
        return;
    }

    const label = priorityLabel ? `${priorityLabel} Priority` : 'Priority';
    badge.textContent = label;
}

function updateStatusChip(status) {
    const chip = typeof document !== 'undefined' ? document.getElementById('statusChip') : null;
    if (!chip) {
        return;
    }

    chip.textContent = formatStatusLabel(status);
    chip.className = `chip chip-status-${status}`;
}

function renderTalkingPoints(talkingPoints) {
    if (typeof document === 'undefined') {
        return;
    }

    const block = document.getElementById('talkingPointsBlock');
    const list = document.getElementById('talkingPoints');

    if (!block || !list) {
        return;
    }

    list.innerHTML = '';

    if (!Array.isArray(talkingPoints) || talkingPoints.length === 0) {
        block.hidden = true;
        return;
    }

    talkingPoints.forEach(point => {
        const item = document.createElement('li');
        item.textContent = point;
        list.appendChild(item);
    });

    block.hidden = false;
}

function updateActionFooter(message) {
    if (typeof document === 'undefined') {
        return;
    }

    const footer = document.getElementById('actionFooter');
    if (footer) {
        footer.textContent = message;
    }
}

function setLoadingState(isLoading) {
    if (typeof document === 'undefined') {
        return;
    }

    const loading = document.getElementById('loadingState');
    const error = document.getElementById('errorState');
    const shell = document.getElementById('reportShell');

    if (loading) {
        loading.hidden = !isLoading;
    }

    if (error) {
        error.hidden = true;
    }

    if (shell) {
        shell.hidden = true;
    }
}

function showError(message) {
    if (typeof document === 'undefined') {
        return;
    }

    const loading = document.getElementById('loadingState');
    const error = document.getElementById('errorState');
    const shell = document.getElementById('reportShell');

    if (loading) {
        loading.hidden = true;
    }

    if (shell) {
        shell.hidden = true;
    }

    if (error) {
        error.textContent = message;
        error.hidden = false;
    }
}

function showShell() {
    if (typeof document === 'undefined') {
        return;
    }

    const loading = document.getElementById('loadingState');
    const error = document.getElementById('errorState');
    const shell = document.getElementById('reportShell');

    if (loading) {
        loading.hidden = true;
    }

    if (error) {
        error.hidden = true;
    }

    if (shell) {
        shell.hidden = false;
    }
}

function renderSummary(report) {
    const summary = deriveSummaryViewModel(report);

    setElementText('summaryTitle', summary.ticketSubject || 'Report');
    setElementText('summarySubject', summary.issueDescription);
    setElementText('summaryReportId', summary.reportId);
    setElementText('summaryCreatedAt', formatDateTime(summary.createdAt));
    setElementText('summaryCustomer', summary.customerName);
    setElementText('summaryAgent', summary.csrAgent);
    setElementText('summaryDepartment', summary.department);
    setElementText('summaryTone', summary.tone);
    setElementText('summaryCategory', summary.category);
    setElementText('summaryConfidence', summary.confidence);
    setElementText('summaryChannel', summary.channel);
    setElementText('issueDescription', summary.issueDescription || '—');
    setElementText('responseApproach', summary.responseApproach || '—');

    if (typeof document !== 'undefined') {
        const metaElement = document.getElementById('summaryMeta');
        if (metaElement) {
            metaElement.textContent = `${formatStatusLabel(report.status)} • ${formatDateTime(report.createdAt)}`;
        }
    }

    updatePriorityBadge(summary.priorityLabel);
    updateStatusChip(report.status);
    renderTalkingPoints(report.talkingPoints);
}

function renderNotes(notes) {
    if (typeof document === 'undefined') {
        return;
    }

    const list = document.getElementById('notesList');
    const emptyState = document.getElementById('notesEmpty');

    if (!list || !emptyState) {
        return;
    }

    list.innerHTML = '';

    if (!notes.length) {
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    notes.forEach(note => {
        const card = document.createElement('article');
        card.className = 'note-card';

        const header = document.createElement('header');
        const meta = document.createElement('div');
        meta.className = 'note-meta';
        meta.textContent = `${note.csrAgent} • ${formatDateTime(note.createdAt)}`;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'note-delete';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => handleDeleteNote(note.id));

        header.append(meta, deleteButton);

        const text = document.createElement('p');
        text.className = 'note-text';
        text.textContent = note.noteText;

        card.append(header, text);
        list.appendChild(card);
    });
}

function renderActions(report) {
    if (typeof document === 'undefined') {
        return;
    }

    const statusSelect = document.getElementById('statusSelect');
    const assignmentInput = document.getElementById('assignmentInput');
    const viewCustomer = document.getElementById('viewCustomer');

    if (statusSelect) {
        statusSelect.value = report.status;
    }

    if (assignmentInput) {
        assignmentInput.value = report.assignedTo ?? '';
    }

    if (viewCustomer) {
        viewCustomer.disabled = !report.customerName;
    }

    updateActionFooter(`Last updated ${formatDateTime(report.updatedAt || report.createdAt)}`);
}

async function loadReport() {
    if (!state.reportId) {
        showError('No report ID provided.');
        return;
    }

    setLoadingState(true);

    try {
        const { fetchReportDetail } = await ensureReportService();
        const report = await fetchReportDetail(state.reportId);
        state.report = report;
        renderSummary(report);
        renderActions(report);
        await refreshNotes();
        showShell();
    } catch (error) {
        console.error('Error loading report detail', error);
        showError(error.message || 'Unable to load report.');
    }
}

async function refreshNotes() {
    if (!state.reportId) {
        return;
    }

    try {
        const { fetchReportNotes } = await ensureReportService();
        state.notes = await fetchReportNotes(state.reportId);
        renderNotes(state.notes);
    } catch (error) {
        console.error('Error loading notes', error);
        updateActionFooter(error.message || 'Unable to load notes.');
    }
}

async function handleNoteSubmit(event) {
    event.preventDefault();

    if (!state.reportId || !state.report) {
        showError('Report context missing.');
        return;
    }

    const textarea = typeof document !== 'undefined' ? document.getElementById('noteText') : null;
    if (!textarea) {
        return;
    }

    const sanitized = sanitizeNoteContent(textarea.value);
    if (!sanitized) {
        textarea.focus();
        updateActionFooter('Enter a note before submitting.');
        return;
    }

    textarea.disabled = true;
    const submitButton = event.submitter;
    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const { createReportNote } = await ensureReportService();
        const note = await createReportNote(state.reportId, sanitized, state.report.csrAgent);
        state.notes = [note, ...state.notes];
        renderNotes(state.notes);
        textarea.value = '';
        updateActionFooter('Note added successfully.');
    } catch (error) {
        console.error('Error adding note', error);
        updateActionFooter(error.message || 'Unable to add note.');
    } finally {
        textarea.disabled = false;
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

async function handleDeleteNote(noteId) {
    try {
        const { removeReportNote } = await ensureReportService();
        await removeReportNote(noteId);
        state.notes = state.notes.filter(note => note.id !== noteId);
        renderNotes(state.notes);
        updateActionFooter('Note removed.');
    } catch (error) {
        console.error('Error deleting note', error);
        updateActionFooter(error.message || 'Unable to delete note.');
    }
}

async function handleStatusSubmit(event) {
    event.preventDefault();

    if (!state.reportId || !state.report) {
        showError('Report context missing.');
        return;
    }

    const statusSelect = typeof document !== 'undefined' ? document.getElementById('statusSelect') : null;
    if (!statusSelect) {
        return;
    }

    const submitButton = event.submitter;
    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const { setReportStatus } = await ensureReportService();
        const updated = await setReportStatus(state.reportId, statusSelect.value);
        state.report = updated;
        renderSummary(updated);
        renderActions(updated);
        updateActionFooter('Status updated successfully.');
    } catch (error) {
        console.error('Error updating status', error);
        updateActionFooter(error.message || 'Unable to update status.');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

async function handleAssignmentSubmit(event) {
    event.preventDefault();

    if (!state.reportId || !state.report) {
        showError('Report context missing.');
        return;
    }

    const assignmentInput = typeof document !== 'undefined' ? document.getElementById('assignmentInput') : null;
    if (!assignmentInput) {
        return;
    }

    const submitButton = event.submitter;
    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const { assignReportTo } = await ensureReportService();
        const updated = await assignReportTo(state.reportId, assignmentInput.value);
        state.report = updated;
        renderActions(updated);
        updateActionFooter(updated.assignedTo ? `Assigned to ${updated.assignedTo}.` : 'Assignment cleared.');
    } catch (error) {
        console.error('Error updating assignment', error);
        updateActionFooter(error.message || 'Unable to update assignment.');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

async function handleAssignmentClear() {
    if (!state.reportId || !state.report) {
        showError('Report context missing.');
        return;
    }

    try {
        const { assignReportTo } = await ensureReportService();
        const updated = await assignReportTo(state.reportId, null);
        state.report = updated;
        renderActions(updated);
        updateActionFooter('Assignment cleared.');
    } catch (error) {
        console.error('Error clearing assignment', error);
        updateActionFooter(error.message || 'Unable to clear assignment.');
    }
}

function handleViewCustomer() {
    if (!state.report || !state.report.customerName) {
        return;
    }

    const encodedName = encodeURIComponent(state.report.customerName);
    window.location.href = `/client-history.html?customer=${encodedName}`;
}

function setupEventListeners() {
    if (typeof document === 'undefined') {
        return;
    }

    const noteForm = document.getElementById('noteForm');
    const statusForm = document.getElementById('statusForm');
    const assignmentForm = document.getElementById('assignmentForm');
    const clearAssignment = document.getElementById('clearAssignment');
    const viewCustomer = document.getElementById('viewCustomer');
    const refreshReport = document.getElementById('refreshReport');

    if (noteForm) {
        noteForm.addEventListener('submit', handleNoteSubmit);
    }

    if (statusForm) {
        statusForm.addEventListener('submit', handleStatusSubmit);
    }

    if (assignmentForm) {
        assignmentForm.addEventListener('submit', handleAssignmentSubmit);
    }

    if (clearAssignment) {
        clearAssignment.addEventListener('click', handleAssignmentClear);
    }

    if (viewCustomer) {
        viewCustomer.addEventListener('click', handleViewCustomer);
    }

    if (refreshReport) {
        refreshReport.addEventListener('click', loadReport);
    }
}

async function bootstrap() {
    const { initTheme, toggleTheme } = await ensureThemeModule();
    initTheme();
    if (typeof window !== 'undefined') {
        window.toggleTheme = toggleTheme;
    }

    const params = new URLSearchParams(window.location.search);
    state.reportId = params.get('id');

    if (!state.reportId) {
        showError('No report ID provided.');
        return;
    }

    setupEventListeners();
    loadReport();
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        bootstrap().catch(error => {
            console.error('Failed to initialize report detail view', error);
            showError(error.message || 'Unable to load report.');
        });
    });
}

export function deriveSummaryViewModel(report) {
    if (!report || typeof report !== 'object') {
        throw new Error('Report data is required.');
    }

    const department = typeof report.metadata?.department === 'string'
        ? report.metadata.department
        : 'General';
    const channel = typeof report.metadata?.channel === 'string'
        ? report.metadata.channel
        : 'Email';

    return {
        reportId: report.reportId,
        createdAt: report.createdAt,
        customerName: report.customerName || 'Unknown customer',
        csrAgent: report.csrAgent || 'Unassigned',
        priorityLabel: (report.priority || 'medium').toUpperCase(),
        statusLabel: formatStatusLabel(report.status),
        category: report.category || 'General',
        tone: report.customerTone || 'neutral',
        confidence: typeof report.confidenceScore === 'number' ? `${report.confidenceScore}%` : 'N/A',
        department,
        channel,
        ticketSubject: report.ticketSubject || 'Report',
        issueDescription: report.issueDescription || '',
        responseApproach: report.responseApproach || '',
        assignedTo: report.assignedTo ?? null,
    };
}

export function sanitizeNoteContent(rawValue) {
    if (typeof rawValue !== 'string') {
        return null;
    }

    const cleaned = rawValue.replace(/\s+/g, ' ').trim();

    if (!cleaned) {
        return null;
    }

    return cleaned.slice(0, MAX_NOTE_LENGTH);
}

export { formatStatusLabel };
