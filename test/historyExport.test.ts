import assert from 'node:assert/strict';
import test from 'node:test';
import {
  exportSelectedReports,
  toggleSelection,
  type HistoryReport,
} from '../src/pages/historySelection.ts';

const sampleReports: HistoryReport[] = [
  {
    id: '1',
    customer: 'Acme Co.',
    subject: 'Outage investigation',
    status: 'open',
    priority: 'high',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    customer: 'Globex',
    subject: 'Feature request follow-up',
    status: 'closed',
    priority: 'medium',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

test('toggleSelection does not mutate the original set', () => {
  const original = new Set<string>();
  const afterFirstToggle = toggleSelection('1', original);
  assert.equal(original.size, 0);
  assert.equal(afterFirstToggle.has('1'), true);

  const afterSecondToggle = toggleSelection('1', afterFirstToggle);
  assert.equal(afterSecondToggle.has('1'), false);
});

test('exportSelectedReports delegates to exporter when selection is not empty', () => {
  const selected = new Set<string>(['1']);
  const exported: HistoryReport[][] = [];
  const csv = exportSelectedReports(sampleReports, selected, (reports) => {
    exported.push(reports);
    return 'mock-csv';
  });

  assert.equal(csv, 'mock-csv');
  assert.deepEqual(exported[0], [sampleReports[0]]);
});

test('exportSelectedReports throws for empty selections', () => {
  const selected = new Set<string>();
  assert.throws(() => exportSelectedReports(sampleReports, selected, () => ''), {
    message: 'Select at least one report before exporting.',
  });
});
