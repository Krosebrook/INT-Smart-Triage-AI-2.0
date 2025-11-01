import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { TicketDashboard } from '../src/components/TicketDashboard.js';
import { CustomerContextPanel } from '../src/components/CustomerContextPanel.js';
import { supabase as defaultSupabase, setSupabaseClient } from '../src/supabaseClient.js';

let dom;
let window;
let document;

const sampleTickets = [
  {
    id: 'ticket-1',
    ticket_number: '1001',
    priority: 'urgent',
    status: 'open',
    subject: 'Network Outage',
    channel: 'email',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    customer: { name: 'Acme Corp', health_score: 82 },
    assigned_user: { name: 'Jordan Smith' }
  }
];

const customerRecord = {
  id: 'cust-1',
  name: 'Acme Corp',
  email: 'success@acme.com',
  company: 'Acme Corp',
  health_score: 82,
  at_risk: false,
  contract_tier: 'Enterprise',
  account_value: 125000,
  contract_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
};

const ticketHistory = [
  {
    id: 'ticket-history-1',
    subject: 'Prior Incident',
    priority: 'high',
    status: 'resolved',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const sentimentRecord = {
  avg_sentiment: 0.35
};

const originalSupabase = defaultSupabase;

function buildResponse(table, builder, single) {
  if (table === 'tickets') {
    if (builder._filter.customer_id) {
      const data = ticketHistory;
      return { data: single ? data[0] : data, error: null };
    }
    return { data: single ? sampleTickets[0] : sampleTickets, error: null };
  }

  if (table === 'customers') {
    return { data: customerRecord, error: null };
  }

  if (table === 'sentiment_analytics') {
    return { data: single ? sentimentRecord : [sentimentRecord], error: null };
  }

  return { data: single ? null : [], error: null };
}

function createSupabaseStub() {
  return {
    from(table) {
      const builder = {
        _table: table,
        _filter: {},
        select() {
          return builder;
        },
        order() {
          return builder;
        },
        limit() {
          builder._limit = true;
          return builder;
        },
        eq(column, value) {
          builder._filter[column] = value;
          return builder;
        },
        maybeSingle() {
          return Promise.resolve(buildResponse(table, builder, true));
        },
        single() {
          return Promise.resolve(buildResponse(table, builder, true));
        },
        then(onFulfilled, onRejected) {
          return Promise.resolve(buildResponse(table, builder, false)).then(onFulfilled, onRejected);
        }
      };
      return builder;
    },
    channel() {
      return {
        on() {
          return this;
        },
        subscribe() {
          return {
            unsubscribe() {}
          };
        }
      };
    }
  };
}

beforeEach(() => {
  dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div id="ticketDashboard"></div>
      <div id="customerContext"></div>
    </body>
  `, { url: 'http://localhost' });
  window = dom.window;
  document = window.document;
  global.window = window;
  global.document = document;
});

afterEach(() => {
  dom.window.close();
  delete global.window;
  delete global.document;
  setSupabaseClient(originalSupabase);
});

test('TicketDashboard renders mocked ticket data', async () => {
  setSupabaseClient(createSupabaseStub());

  const dashboard = new TicketDashboard('ticketDashboard');
  window.ticketDashboard = dashboard;

  await dashboard.init();

  const html = document.getElementById('ticketDashboard').innerHTML;
  assert.match(html, /Live Ticket Dashboard/);
  assert.match(html, /Network Outage/);
  assert.match(html, /Jordan Smith/);
});

test('CustomerContextPanel renders customer profile and sentiment data', async () => {
  setSupabaseClient(createSupabaseStub());

  const panel = new CustomerContextPanel('customerContext');
  window.customerContextPanel = panel;

  await panel.loadCustomerData('cust-1');

  const html = document.getElementById('customerContext').innerHTML;
  assert.match(html, /Customer Context/);
  assert.match(html, /Acme Corp/);
  assert.match(html, /Account Health/);
  assert.match(html, /Sentiment Trend/);
});
