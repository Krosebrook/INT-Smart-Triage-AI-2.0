import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildHistoryFilters,
    formatSlaDue,
    getSlaBadgeState,
    REPORT_STATUS_OPTIONS
} from '../scripts/history.js';

test('buildHistoryFilters parses full filter set with overdue SLA', () => {
    const formData = new FormData();
    formData.set('searchQuery', '  Network outage  ');
    formData.set('priority', 'high');
    formData.set('status', 'blocked');
    formData.set('tone', 'angry');
    formData.set('assignee', '  Alice ');
    formData.set('sla', 'overdue');

    const now = new Date('2024-01-02T12:00:00Z');
    const { query, filters } = buildHistoryFilters(formData, now);

    assert.equal(query, 'Network outage');
    assert.equal(filters.priority, 'high');
    assert.equal(filters.status, 'blocked');
    assert.equal(filters.customerTone, 'angry');
    assert.equal(filters.assignee, 'Alice');
    assert.equal(filters.slaDueBefore, now.toISOString());
    assert.equal(filters.excludeResolved, true);
});

test('buildHistoryFilters handles SLA none option and ignores invalid status', () => {
    const formData = new FormData();
    formData.set('searchQuery', '');
    formData.set('status', 'not_a_status');
    formData.set('sla', 'none');

    const { query, filters } = buildHistoryFilters(formData, new Date('2024-01-02T12:00:00Z'));

    assert.equal(query, '');
    assert.ok(!('status' in filters));
    assert.equal(filters.slaDueIsNull, true);
    assert.ok(!('slaDueBefore' in filters));
    assert.ok(!('slaDueAfter' in filters));
});

test('getSlaBadgeState flags overdue and resolved correctly', () => {
    const now = new Date('2024-01-02T12:00:00Z');
    const overdue = getSlaBadgeState({ sla_due: '2024-01-01T00:00:00Z', status: 'in_progress' }, now);
    assert.match(overdue.className, /overdue/);
    assert.match(overdue.label, /Overdue/);

    const resolved = getSlaBadgeState({ sla_due: '2024-01-01T00:00:00Z', status: 'resolved' }, now);
    assert.equal(resolved.className, 'sla-badge');
    assert.match(resolved.label, /Jan/);
});

test('formatSlaDue handles invalid and valid inputs', () => {
    assert.equal(formatSlaDue('not-a-date'), 'Invalid SLA');
    const formatted = formatSlaDue('2024-01-02T12:00:00Z');
    assert.match(formatted, /Jan/);
    assert.match(formatted, /2024/);
});

test('status options include lifecycle states', () => {
    ['new', 'in_progress', 'blocked', 'escalated', 'resolved'].forEach(status => {
        assert.ok(REPORT_STATUS_OPTIONS.includes(status));
    });
});
