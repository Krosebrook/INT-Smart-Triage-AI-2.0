import test from 'node:test';
import assert from 'node:assert/strict';

import { deriveSummaryViewModel, sanitizeNoteContent, formatStatusLabel } from '../src/reportDetail.js';

test('deriveSummaryViewModel builds a normalized summary payload', () => {
    const report = {
        reportId: 'R-42',
        createdAt: '2024-01-15T12:00:00Z',
        customerName: 'ACME Corp',
        csrAgent: 'Alex Morgan',
        priority: 'high',
        status: 'in_progress',
        category: 'Billing',
        customerTone: 'frustrated',
        confidenceScore: 82,
        metadata: {
            department: 'Finance',
            channel: 'Voice',
        },
        ticketSubject: 'Unexpected charge on account',
        issueDescription: 'Customer reports an unexpected charge in the latest invoice.',
        responseApproach: 'Investigate billing logs and reconcile charges.',
        assignedTo: 'Jordan',
    };

    const summary = deriveSummaryViewModel(report);

    assert.equal(summary.reportId, 'R-42');
    assert.equal(summary.customerName, 'ACME Corp');
    assert.equal(summary.csrAgent, 'Alex Morgan');
    assert.equal(summary.priorityLabel, 'HIGH');
    assert.equal(summary.statusLabel, 'In Progress');
    assert.equal(summary.department, 'Finance');
    assert.equal(summary.channel, 'Voice');
    assert.equal(summary.ticketSubject, 'Unexpected charge on account');
    assert.equal(summary.assignedTo, 'Jordan');
});

test('sanitizeNoteContent trims whitespace and enforces maximum length', () => {
    const raw = '   Follow up with finance    team by EOD.   ';
    const sanitized = sanitizeNoteContent(raw);

    assert.equal(sanitized, 'Follow up with finance team by EOD.');

    const longNote = 'a'.repeat(1200);
    const truncated = sanitizeNoteContent(longNote);

    assert.equal(truncated.length, 1000);
});

test('sanitizeNoteContent returns null for non-string or empty input', () => {
    assert.equal(sanitizeNoteContent('    \n\t '), null);
    assert.equal(sanitizeNoteContent(null), null);
});

test('formatStatusLabel falls back to New for unknown status', () => {
    assert.equal(formatStatusLabel('unknown'), 'New');
});
