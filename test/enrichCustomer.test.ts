import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAggregatedMetrics, CommunicationRecord, TicketRecord } from '../scripts/jobs/enrichCustomer.ts';

describe('buildAggregatedMetrics', () => {
  const baseTicket: TicketRecord = {
    report_id: 'r-1',
    created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    resolved_at: new Date('2024-01-01T12:00:00Z').toISOString(),
    status: 'resolved',
    priority: 'high',
    customer_tone: 'frustrated',
    escalated_at: null,
    metadata: { escalated: false },
  };

  const communication: CommunicationRecord = {
    report_id: 'r-1',
    sent_at: new Date('2024-01-01T10:30:00Z').toISOString(),
    channel: 'email',
    status: 'sent',
  };

  it('computes aggregates for resolved ticket with communications', () => {
    const metrics = buildAggregatedMetrics('cust-1', [baseTicket], [communication]);

    assert.equal(metrics.customer_id, 'cust-1');
    assert.equal(metrics.total_tickets, 1);
    assert.equal(metrics.resolved_tickets, 1);
    assert.equal(metrics.open_tickets, 0);
    assert.equal(metrics.high_priority_tickets, 1);
    assert.equal(metrics.avg_resolution_time_minutes, 120);
    assert.equal(metrics.avg_first_response_minutes, 30);
    assert.ok(metrics.sentiment_score !== null);
    const channels = metrics.metadata.channels as Record<string, number> | undefined;
    const tones = metrics.metadata.tones as Record<string, number> | undefined;
    assert.equal(channels?.email, 1);
    assert.equal(tones?.frustrated, 1);
    assert.equal(metrics.last_contact_at, communication.sent_at);
    assert.equal(metrics.last_ticket_created_at, baseTicket.created_at);
  });

  it('handles missing data and prevents negative durations', () => {
    const ticket: TicketRecord = {
      ...baseTicket,
      report_id: 'r-2',
      status: 'in_progress',
      resolved_at: null,
      priority: 'medium',
      customer_tone: null,
      metadata: {},
    };

    const metrics = buildAggregatedMetrics('cust-2', [ticket], []);

    assert.equal(metrics.total_tickets, 1);
    assert.equal(metrics.resolved_tickets, 0);
    assert.equal(metrics.avg_resolution_time_minutes, null);
    assert.equal(metrics.avg_first_response_minutes, null);
    assert.equal(metrics.sentiment_score, null);
    assert.equal(metrics.escalation_rate, 0);
  });
});
