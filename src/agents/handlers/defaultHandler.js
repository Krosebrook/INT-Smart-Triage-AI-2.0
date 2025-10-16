import { logger } from '../../logger.js';

export function createDefaultHandler(agentId) {
  return {
    name: `default-${agentId}`,
    async start({ agent }) {
      logger.info('Agent handler activated (default stub).', {
        agentId: agent.id,
      });
      return {
        stop() {
          logger.info('Agent handler stopped (default stub).', {
            agentId: agent.id,
          });
        },
      };
    },
    async stop(controller) {
      if (controller && typeof controller.stop === 'function') {
        controller.stop();
      }
    },
  };
}

export default createDefaultHandler;
