import { IntegrationRegistry } from './registry.js';
import { zendeskIntegrationDefinition } from './zendesk/config.js';

const integrationRegistry = new IntegrationRegistry();
integrationRegistry.register(zendeskIntegrationDefinition);

export { integrationRegistry };
export * from './registry.js';
export * from './errors.js';
export * from './zendesk/config.js';
export * from './zendesk/state.js';
