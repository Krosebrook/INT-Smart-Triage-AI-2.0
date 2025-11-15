import { z } from 'zod';
import {
  IntegrationConfigError,
  IntegrationValidationError
} from '../errors.js';

const zendeskConfigSchema = z
  .object({
    subdomain: z
      .string()
      .trim()
      .min(1, 'Zendesk subdomain is required')
      .regex(/^[a-z0-9-]+$/i, 'Zendesk subdomain may only contain letters, numbers, and dashes'),
    redirectUri: z.string().trim().url('OAuth redirect URI must be a valid URL'),
    allowedRedirectHosts: z
      .array(z.string().trim().min(1))
      .min(1, 'At least one allowed redirect host must be configured')
      .default(['localhost']),
    defaultLocale: z.string().trim().min(2).max(10).optional()
  })
  .strict();

function parseAllowedHosts(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map(host => host.trim())
    .filter(Boolean);
}

function resolveZendeskEnvironment(env = process.env) {
  const rawConfig = {
    subdomain: env.ZENDESK_SUBDOMAIN,
    redirectUri: env.ZENDESK_OAUTH_REDIRECT_URI,
    allowedRedirectHosts: parseAllowedHosts(env.ZENDESK_ALLOWED_REDIRECT_HOSTS),
    defaultLocale: env.ZENDESK_DEFAULT_LOCALE
  };

  const result = zendeskConfigSchema.safeParse({
    ...rawConfig,
    allowedRedirectHosts:
      rawConfig.allowedRedirectHosts.length > 0
        ? rawConfig.allowedRedirectHosts
        : undefined
  });

  if (!result.success) {
    throw new IntegrationConfigError('Invalid Zendesk configuration', {
      details: result.error.flatten()
    });
  }

  return result.data;
}

function normalizeZendeskRedirect(target, allowedHosts) {
  if (!target) {
    throw new IntegrationValidationError('Missing redirect parameter');
  }

  const url = new URL(target);

  if (!allowedHosts.includes(url.host)) {
    throw new IntegrationValidationError('Redirect host is not allowed', {
      details: { host: url.host }
    });
  }

  return url.toString();
}

const zendeskIntegrationDefinition = {
  key: 'zendesk',
  displayName: 'Zendesk Support',
  description: 'Synchronize Zendesk tickets and events into the Smart Triage platform.',
  category: 'support',
  auth: {
    type: 'oauth2',
    grantType: 'authorization_code',
    scopes: ['read', 'write']
  },
  configSchema: zendeskConfigSchema,
  secrets: [
    {
      name: 'clientId',
      envVar: 'ZENDESK_OAUTH_CLIENT_ID',
      description: 'Zendesk OAuth client identifier',
      required: true
    },
    {
      name: 'clientSecret',
      envVar: 'ZENDESK_OAUTH_CLIENT_SECRET',
      description: 'Zendesk OAuth client secret',
      required: true
    },
    {
      name: 'stateSecret',
      envVar: 'ZENDESK_OAUTH_STATE_SECRET',
      description: 'Secret used to sign OAuth state parameters',
      required: true
    }
  ],
  webhookSecrets: [
    {
      name: 'signingSecret',
      envVar: 'ZENDESK_WEBHOOK_SECRET',
      description: 'Zendesk webhook signing secret',
      required: true
    }
  ],
  environment: {
    resolver: resolveZendeskEnvironment
  }
};

export {
  zendeskIntegrationDefinition,
  zendeskConfigSchema,
  resolveZendeskEnvironment,
  normalizeZendeskRedirect
};
