import test from 'node:test';
import assert from 'node:assert/strict';

import { redactTranscriptRecord, redactText } from '../src/middleware/redaction.js';

test('redactText masks common PII patterns', () => {
  const input = 'Contact me at jane.doe@example.com or 555-123-4567 with SSN 123-45-6789 and card 4111-1111-1111-1111';
  const output = redactText(input);

  assert.ok(!output.includes('jane.doe@example.com'));
  assert.ok(!output.includes('555-123-4567'));
  assert.ok(!output.includes('123-45-6789'));
  assert.ok(!output.includes('4111-1111-1111-1111'));
  assert.match(output, /\[REDACTED_EMAIL\]/);
  assert.match(output, /\[REDACTED_PHONE\]/);
  assert.match(output, /\[REDACTED_SSN\]/);
  assert.match(output, /\[REDACTED_CARD\]/);
});

test('redactTranscriptRecord scrubs nested metadata and messages', () => {
  const record = {
    subject: 'Conversation with john.doe@example.com',
    summary: 'User provided credit card 4111111111111111',
    key_issues: ['Payment failed for 4111111111111111'],
    metadata: {
      customerEmail: 'john.doe@example.com',
      nested: {
        phone: '+1 (212) 555-7890'
      }
    },
    messages: [
      {
        text: 'Hi, my SSN is 123-45-6789',
        metadata: {
          sensitive: 'Call me at 212-555-7890'
        }
      }
    ]
  };

  const redacted = redactTranscriptRecord(record);

  assert.match(redacted.subject, /\[REDACTED_EMAIL\]/);
  assert.match(redacted.summary, /\[REDACTED_CARD\]/);
  assert.match(redacted.key_issues[0], /\[REDACTED_CARD\]/);
  assert.match(redacted.metadata.customerEmail, /\[REDACTED_EMAIL\]/);
  assert.match(redacted.metadata.nested.phone, /\[REDACTED_PHONE\]/);
  assert.match(redacted.messages[0].text, /\[REDACTED_SSN\]/);
  assert.match(redacted.messages[0].metadata.sensitive, /\[REDACTED_PHONE\]/);
});

