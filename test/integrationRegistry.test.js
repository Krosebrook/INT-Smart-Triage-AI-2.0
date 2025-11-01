import test from 'node:test';
import assert from 'node:assert/strict';
import { IntegrationRegistry } from '../src/integrations/registry.js';
import {
  IntegrationConfigError,
  IntegrationSecretError,
  IntegrationValidationError
} from '../src/integrations/errors.js';
import { zendeskIntegrationDefinition } from '../src/integrations/zendesk/config.js';

test('registers integrations and validates configuration', () => {
  const registry = new IntegrationRegistry();
  registry.register(zendeskIntegrationDefinition);

  assert.ok(registry.has('zendesk'));

  const configResult = registry.validateConfig('zendesk', {
    subdomain: 'example',
    redirectUri: 'https://app.example.com/api/integrations/zendesk/oauth',
    allowedRedirectHosts: ['app.example.com']
  });

  assert.equal(configResult.isValid, true);
  assert.equal(configResult.config.subdomain, 'example');
});

test('rejects duplicate integration registration', () => {
  const registry = new IntegrationRegistry();
  registry.register(zendeskIntegrationDefinition);

  assert.throws(
    () => registry.register(zendeskIntegrationDefinition),
    IntegrationConfigError
  );
});

test('enforces required secrets resolution', () => {
  const registry = new IntegrationRegistry();
  registry.register(zendeskIntegrationDefinition);

  assert.throws(() => registry.resolveSecrets('zendesk', {}), IntegrationSecretError);

  const secrets = registry.resolveSecrets('zendesk', {
    ZENDESK_OAUTH_CLIENT_ID: 'client',
    ZENDESK_OAUTH_CLIENT_SECRET: 'secret',
    ZENDESK_OAUTH_STATE_SECRET: 'state'
  });

  assert.deepEqual(secrets, {
    clientId: 'client',
    clientSecret: 'secret',
    stateSecret: 'state'
  });
});

test('rejects invalid configuration payloads', () => {
  const registry = new IntegrationRegistry();
  registry.register(zendeskIntegrationDefinition);

  assert.throws(
    () =>
      registry.validateConfig('zendesk', {
        subdomain: '',
        redirectUri: 'not-a-url'
      }),
    IntegrationValidationError
  );
});
