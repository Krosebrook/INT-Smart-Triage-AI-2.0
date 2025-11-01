import crypto from 'node:crypto';
import { IntegrationAuthError, IntegrationSecretError } from '../errors.js';

const DEFAULT_EXPIRATION_MS = 5 * 60 * 1000;
const STATE_VERSION = '1';

function assertSecret(secret) {
  if (!secret || secret.trim().length === 0) {
    throw new IntegrationSecretError('Missing OAuth state signing secret');
  }
}

function createStateToken(payload, secret, expiresInMs = DEFAULT_EXPIRATION_MS) {
  assertSecret(secret);

  if (!payload || typeof payload !== 'object') {
    throw new IntegrationAuthError('OAuth state payload must be an object');
  }

  const issuedAt = Date.now();
  const stateBody = {
    v: STATE_VERSION,
    iat: issuedAt,
    exp: issuedAt + Math.max(expiresInMs, 1000),
    data: payload
  };

  const serialized = JSON.stringify(stateBody);
  const signature = crypto.createHmac('sha256', secret).update(serialized).digest('base64url');
  const token = Buffer.from(JSON.stringify({ body: serialized, sig: signature })).toString('base64url');

  return {
    token,
    expiresAt: new Date(stateBody.exp).toISOString()
  };
}

function verifyStateToken(token, secret) {
  assertSecret(secret);

  if (!token || typeof token !== 'string') {
    throw new IntegrationAuthError('Missing OAuth state');
  }

  let decoded;

  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    decoded = JSON.parse(json);
  } catch (error) {
    throw new IntegrationAuthError('Invalid OAuth state encoding', { cause: error });
  }

  if (!decoded || typeof decoded !== 'object' || !decoded.body || !decoded.sig) {
    throw new IntegrationAuthError('Malformed OAuth state payload');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(decoded.body)
    .digest('base64url');

  const providedBuffer = Buffer.from(decoded.sig);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    throw new IntegrationAuthError('OAuth state signature mismatch');
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new IntegrationAuthError('OAuth state signature mismatch');
  }

  let body;

  try {
    body = JSON.parse(decoded.body);
  } catch (error) {
    throw new IntegrationAuthError('Invalid OAuth state body', { cause: error });
  }

  if (body.v !== STATE_VERSION) {
    throw new IntegrationAuthError('Unsupported OAuth state version');
  }

  if (Date.now() > body.exp) {
    throw new IntegrationAuthError('OAuth state has expired');
  }

  return body.data;
}

export { createStateToken, verifyStateToken, DEFAULT_EXPIRATION_MS };
