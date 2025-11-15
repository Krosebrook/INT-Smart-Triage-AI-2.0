import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSamlProviderConfig,
  buildSamlOptions,
  mapSamlAttributesToProfile,
  resolveRelayState,
} from '../src/utils/saml.js';

const originalEnv = { ...process.env };

describe('SAML utils', () => {
  beforeEach(() => {
    process.env.SAML_ISSUER = 'https://triage.example.com/saml';
    process.env.SAML_AUDIENCE = 'https://triage.example.com/saml/audience';
    process.env.SAML_CALLBACK_URL = 'https://triage.example.com/api/auth/saml';
    process.env.SAML_AUTH0_ENTRYPOINT = 'https://int-auth0.example.com/saml';
    process.env.SAML_AUTH0_CERT = '-----BEGIN CERTIFICATE-----\nMIID\n-----END CERTIFICATE-----';
    process.env.SAML_OKTA_ENTRYPOINT = 'https://int-okta.example.com/app/idp';
    process.env.SAML_OKTA_CERT = '-----BEGIN CERTIFICATE-----\nMIIDOKTA\n-----END CERTIFICATE-----';
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  it('builds provider config for Auth0', () => {
    const config = buildSamlProviderConfig('auth0');
    assert.equal(config.issuer, process.env.SAML_ISSUER);
    assert.equal(config.entryPoint, process.env.SAML_AUTH0_ENTRYPOINT);
    assert.ok(config.idpCert.includes('BEGIN CERTIFICATE'));
  });

  it('builds SAML options with defaults', () => {
    const options = buildSamlOptions('auth0');
    assert.equal(options.issuer, process.env.SAML_ISSUER);
    assert.equal(options.callbackUrl, process.env.SAML_CALLBACK_URL);
    assert.equal(options.entryPoint, process.env.SAML_AUTH0_ENTRYPOINT);
    assert.deepEqual(options.authnContext.includes('urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport'), true);
  });

  it('maps SAML profile attributes', () => {
    const profile = mapSamlAttributesToProfile({
      nameID: 'user@example.com',
      email: 'user@example.com',
      givenName: 'Sample',
      sn: 'User',
      groups: ['ops'],
    });

    assert.equal(profile.userName, 'user@example.com');
    assert.equal(profile.email, 'user@example.com');
    assert.equal(profile.firstName, 'Sample');
    assert.equal(profile.lastName, 'User');
  });

  it('rejects missing identifiers', () => {
    assert.throws(() => mapSamlAttributesToProfile({}), /missing required identifiers/i);
  });

  it('parses relay state JSON payload', () => {
    const relayState = Buffer.from(JSON.stringify({ redirectTo: '/home' }), 'utf8').toString('base64');
    const parsed = resolveRelayState(relayState);
    assert.deepEqual(parsed, { redirectTo: '/home' });
  });
});

