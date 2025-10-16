import { fetch } from 'undici';
import { logger } from '../../logger.js';

export function createDashboardConnector(options = {}) {
  const endpoint = options.endpoint || process.env.AGENT_DASH_WEBHOOK;
  const token = options.token || process.env.AGENT_DASH_TOKEN;

  if (!endpoint) {
    return {
      name: 'dashboard-connector-disabled',
      async onAgentStatusChange(agent) {
        logger.warn('Dashboard connector disabled; skipping update.', {
          agentId: agent.id,
        });
      },
    };
  }

  return {
    name: 'dashboard-connector',
    async onAgentStatusChange(agent) {
      const payload = {
        agentId: agent.id,
        codename: agent.codename,
        status: agent.status,
        lastUpdated: agent.lastUpdated,
        context: agent.context || {},
      };

      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Dashboard webhook returned ${response.status} ${response.statusText}: ${body}`
        );
      }

      logger.debug('Sent dashboard update.', {
        agentId: agent.id,
        status: agent.status,
      });
    },
  };
}

export default createDashboardConnector;
