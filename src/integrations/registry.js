import { z } from 'zod';
import {
  IntegrationConfigError,
  IntegrationNotFoundError,
  IntegrationSecretError,
  IntegrationValidationError
} from './errors.js';

const zodSchemaType = z.custom(value => value && typeof value.parse === 'function', {
  message: 'configSchema must be a Zod schema'
});

const zodFunctionType = z.custom(value => !value || typeof value === 'function', {
  message: 'resolver must be a function if provided'
});

const integrationDefinitionSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, 'Integration key is required')
      .regex(/^[a-z0-9-]+$/, 'Integration key must be lowercase alphanumeric or dashes'),
    displayName: z.string().trim().min(1, 'Display name is required'),
    description: z.string().trim().min(1, 'Description is required'),
    category: z.string().trim().min(1).optional(),
    auth: z
      .object({
        type: z.enum(['oauth2', 'apiKey', 'custom']),
        grantType: z.string().optional(),
        scopes: z.array(z.string().trim().min(1)).default([])
      })
      .optional(),
    configSchema: zodSchemaType.optional(),
    secrets: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          envVar: z
            .string()
            .trim()
            .regex(/^[A-Z0-9_]+$/, 'Environment variable names must be uppercase with underscores'),
          description: z.string().trim().optional(),
          required: z.boolean().default(true)
        })
      )
      .default([]),
    webhookSecrets: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          envVar: z
            .string()
            .trim()
            .regex(/^[A-Z0-9_]+$/),
          description: z.string().trim().optional(),
          required: z.boolean().default(true)
        })
      )
      .default([]),
    environment: z
      .object({
        resolver: zodFunctionType.optional()
      })
      .default({})
  })
  .strict();

class IntegrationRegistry {
  constructor() {
    this.integrations = new Map();
  }

  register(definition) {
    const parsed = integrationDefinitionSchema.parse(definition);

    if (this.integrations.has(parsed.key)) {
      throw new IntegrationConfigError(`Integration with key "${parsed.key}" already registered`, {
        details: { key: parsed.key }
      });
    }

    this.integrations.set(parsed.key, parsed);
    return parsed;
  }

  has(key) {
    return this.integrations.has(key);
  }

  get(key) {
    const definition = this.integrations.get(key);

    if (!definition) {
      throw new IntegrationNotFoundError(`Integration "${key}" is not registered`, {
        details: { key }
      });
    }

    return definition;
  }

  list() {
    return Array.from(this.integrations.values());
  }

  validateConfig(key, config) {
    const definition = this.get(key);

    if (!definition.configSchema) {
      if (config && Object.keys(config).length > 0) {
        throw new IntegrationValidationError(`Integration "${key}" does not accept configuration`, {
          details: { providedKeys: Object.keys(config) }
        });
      }

      return { isValid: true, config: {} };
    }

    const result = definition.configSchema.safeParse(config ?? {});

    if (!result.success) {
      throw new IntegrationValidationError(`Invalid configuration for integration "${key}"`, {
        details: result.error.flatten()
      });
    }

    return { isValid: true, config: result.data };
  }

  resolveSecrets(key, env = process.env) {
    const definition = this.get(key);
    const resolved = {};
    const missing = [];

    for (const secret of definition.secrets) {
      const value = env[secret.envVar];

      if (!value || value.trim().length === 0) {
        if (secret.required) {
          missing.push(secret.envVar);
        }
      } else {
        resolved[secret.name] = value;
      }
    }

    if (missing.length > 0) {
      throw new IntegrationSecretError(`Missing required secrets for integration "${key}"`, {
        details: { missing }
      });
    }

    return resolved;
  }

  resolveWebhookSecrets(key, env = process.env) {
    const definition = this.get(key);
    const resolved = {};
    const missing = [];

    for (const secret of definition.webhookSecrets) {
      const value = env[secret.envVar];

      if (!value || value.trim().length === 0) {
        if (secret.required) {
          missing.push(secret.envVar);
        }
      } else {
        resolved[secret.name] = value;
      }
    }

    if (missing.length > 0) {
      throw new IntegrationSecretError(`Missing required webhook secrets for integration "${key}"`, {
        details: { missing }
      });
    }

    return resolved;
  }

  resolveEnvironment(key, env = process.env) {
    const definition = this.get(key);

    if (definition.environment?.resolver) {
      return definition.environment.resolver(env);
    }

    return {};
  }
}

export { IntegrationRegistry, integrationDefinitionSchema };
