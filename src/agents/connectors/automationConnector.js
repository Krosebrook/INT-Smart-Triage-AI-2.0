import { fetch } from 'undici';
import { logger } from '../../logger.js';

export function createAutomationConnector(options = {}) {
  const endpoint = options.endpoint || process.env.AUTOMATION_API_URL;
  const token = options.token || process.env.AUTOMATION_API_TOKEN;

  if (!endpoint) {
    return {
      name: 'automation-connector-disabled',
      async onAgentStatusChange(agent) {
        logger.info('Automation connector disabled; skipping dispatch.', {
          agentId: agent.id,
        });
      },
    };
  }

  return {
    name: 'automation-connector',
    async onAgentStatusChange(agent, context = {}) {
      const payload = {
        agentId: agent.id,
        status: agent.status,
        metadata: {
          codename: agent.codename,
          owners: agent.owners,
          mission: agent.mission,
          trigger: context.trigger || 'manual',
          notes: context.notes || null,
        },
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
          `Automation API returned ${response.status} ${response.statusText}: ${body}`
        );
      }

      logger.info('Dispatched automation event.', {
        agentId: agent.id,
        status: agent.status,
      });
    },
  };
}

export default createAutomationConnector;
