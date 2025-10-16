import AgentRuntime from './runtime.js';
import { createDashboardConnector } from './connectors/dashboardConnector.js';
import { createAutomationConnector } from './connectors/automationConnector.js';
import { logger } from '../logger.js';
import { createHandlerRegistry } from './handlers/index.js';

function defaultConnectors() {
  return [createDashboardConnector(), createAutomationConnector()];
}

export async function startAgentOrchestrator(options = {}) {
  const connectors = options.connectors || defaultConnectors();
  const runtime = await AgentRuntime.create({ connectors });
  const handlers = createHandlerRegistry(options.handlers || {});
  const activeControllers = new Map();

  async function stopAgent(agentId, context) {
    const entry = activeControllers.get(agentId);
    if (!entry) {
      return;
    }

    const { handler, controller } = entry;
    try {
      await handler.stop(controller, context);
    } catch (error) {
      logger.error('Failed to stop agent handler.', {
        agentId,
        error: error.message,
      });
    } finally {
      activeControllers.delete(agentId);
    }
  }

  async function startAgent(agent, context) {
    const handler = handlers.get(agent.id);
    if (!handler || typeof handler.start !== 'function') {
      logger.warn('No handler available for agent.', {
        agentId: agent.id,
      });
      return;
    }

    await stopAgent(agent.id, context);

    try {
      const controller = await handler.start({ agent, context, runtime });
      activeControllers.set(agent.id, { handler, controller });
    } catch (error) {
      logger.error('Failed to start agent handler.', {
        agentId: agent.id,
        error: error.message,
      });
    }
  }

  runtime.on('statusChanged', async ({ agent, context }) => {
    if (agent.status === 'active') {
      await startAgent(agent, context);
    } else {
      await stopAgent(agent.id, context);
    }
  });

  // Bootstrap existing active agents on startup
  await Promise.all(
    runtime
      .listAgents()
      .filter((agent) => agent.status === 'active')
      .map((agent) => startAgent(agent, { trigger: 'bootstrap' }))
  );

  logger.info('Agent orchestrator initialized.', {
    activeAgents: Array.from(activeControllers.keys()),
  });

  async function shutdown() {
    runtime.removeAllListeners('statusChanged');
    await Promise.all(
      Array.from(activeControllers.keys()).map((agentId) =>
        stopAgent(agentId, { trigger: 'shutdown' })
      )
    );
    logger.info('Agent orchestrator shut down.');
  }

  return {
    runtime,
    shutdown,
  };
}

export default startAgentOrchestrator;
