import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeEmailTranscript,
  normalizeChatTranscript,
  buildAnalysisPrompt,
  createStoragePayload
} from '../src/ingest/normalizer.js';

test('normalizeEmailTranscript splits thread into speaker messages', () => {
  const payload = {
    id: 'email-1',
    subject: 'Need help with billing',
    from: 'customer@example.com',
    to: 'agent@example.com',
    body: 'Hello team,\n\nI need help with my invoice.\n> On yesterday support wrote:\n> Please provide details.',
    receivedAt: '2024-06-01T12:00:00Z'
  };

  const result = normalizeEmailTranscript(payload);
  assert.equal(result.source, 'email');
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].speaker, 'customer');
  assert.equal(result.messages[1].speaker, 'agent');
});

test('normalizeChatTranscript maps roles and timestamps', () => {
  const payload = {
    sessionId: 'chat-1',
    messages: [
      { role: 'user', content: 'Hi there', timestamp: '2024-06-02T10:00:00Z' },
      { role: 'assistant', content: 'Hello, how can I help?', timestamp: '2024-06-02T10:00:05Z' }
    ]
  };

  const result = normalizeChatTranscript(payload);
  assert.equal(result.source, 'chatgpt');
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].speaker, 'customer');
  assert.equal(result.messages[1].speaker, 'agent');
});

test('buildAnalysisPrompt generates structured text', () => {
  const normalized = {
    source: 'email',
    subject: 'Test',
    originalId: 'abc',
    createdAt: '2024-06-01T00:00:00Z',
    messages: [
      { speaker: 'customer', text: 'Need support', timestamp: '2024-06-01T00:00:00Z' }
    ],
    tags: ['billing']
  };

  const prompt = buildAnalysisPrompt(normalized);
  assert.match(prompt, /Source: EMAIL/);
  assert.match(prompt, /CUSTOMER: Need support/);
  assert.match(prompt, /Tags: billing/);
});

test('createStoragePayload merges normalized transcript with analysis', () => {
  const normalized = {
    source: 'chatgpt',
    subject: 'Chat session',
    originalId: 'chat-1',
    createdAt: '2024-06-03T00:00:00Z',
    messages: [
      { speaker: 'agent', text: 'How can I help?', timestamp: '2024-06-03T00:00:05Z' }
    ],
    tags: []
  };

  const analysis = {
    summary: 'Assisted customer with billing question',
    sentiment: 'neutral',
    keyIssues: ['billing'],
    aiNotes: null
  };

  const storagePayload = createStoragePayload(normalized, analysis);
  assert.equal(storagePayload.transcript_id, 'chat-1');
  assert.equal(storagePayload.summary, analysis.summary);
  assert.deepEqual(storagePayload.key_issues, analysis.keyIssues);
});
