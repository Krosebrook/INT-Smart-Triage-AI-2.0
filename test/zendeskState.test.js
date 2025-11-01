import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStateToken,
  verifyStateToken
} from '../src/integrations/zendesk/state.js';
import { IntegrationAuthError } from '../src/integrations/errors.js';

test('creates and verifies OAuth state tokens', () => {
  const { token, expiresAt } = createStateToken({ redirect: 'https://app.example.com' }, 'secret');
  const payload = verifyStateToken(token, 'secret');

  assert.equal(payload.redirect, 'https://app.example.com');
  assert.ok(Date.parse(expiresAt));
});

test('rejects tampered OAuth state tokens', () => {
  const { token } = createStateToken({ redirect: 'https://app.example.com' }, 'secret');
  const tampered = `${token.slice(0, -1)}${token.slice(-1) === 'A' ? 'B' : 'A'}`;

  assert.throws(() => verifyStateToken(tampered, 'secret'), IntegrationAuthError);
});
