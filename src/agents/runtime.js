import { EventEmitter } from 'node:events';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { logger } from '../logger.js';

const REGISTRY_PATH = path.resolve(process.cwd(), 'agents', 'registry.json');
const STATE_PATH = path.resolve(process.cwd(), 'agents', 'runtime-state.json');

async function readJson(filePath, fallback = null) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(filePath, serialized, 'utf8');
}

function mergeState(registry, state = {}) {
  const stateMap = state.agents || {};
  return registry.map((agent) => {
    const stored = stateMap[agent.id] || {};
    return {
      ...agent,
      status: stored.status || agent.status || 'registered',
      lastUpdated: stored.lastUpdated || null,
      context: stored.context || null,
    };
  });
}

export class AgentRuntime extends EventEmitter {
  static async create(options = {}) {
    const registry = await readJson(REGISTRY_PATH, []);
    if (!Array.isArray(registry) || registry.length === 0) {
      throw new Error('Agent registry is empty or not found.');
    }
    const state = await readJson(STATE_PATH, { agents: {} });
    const runtime = new AgentRuntime(registry, state, options);
    await runtime.persist();
    return runtime;
  }

  constructor(registry, state, options) {
    super();
    this.registry = registry;
    this.state = state;
    this.agents = mergeState(registry, state);
    this.connectors = options.connectors || [];
  }

  listAgents() {
    return this.agents.map((agent) => ({ ...agent }));
  }

  getAgent(agentId) {
    return this.agents.find((agent) => agent.id === agentId) || null;
  }

  registerConnector(connector) {
    if (!connector || typeof connector.onAgentStatusChange !== 'function') {
      throw new Error(
        'Connector must implement onAgentStatusChange(agent, context).'
      );
    }
    this.connectors.push(connector);
  }

  async activateAgent(agentId, context = {}) {
    return this.updateAgentStatus(agentId, 'active', context);
  }

  async deactivateAgent(agentId, context = {}) {
    return this.updateAgentStatus(agentId, 'inactive', context);
  }

  async flagAgent(agentId, context = {}) {
    return this.updateAgentStatus(agentId, 'attention', context);
  }

  async updateAgentStatus(agentId, status, context = {}) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const timestamp = new Date().toISOString();
    agent.status = status;
    agent.lastUpdated = timestamp;
    agent.context = context;

    if (!this.state.agents) {
      this.state.agents = {};
    }
    this.state.agents[agentId] = {
      status,
      lastUpdated: timestamp,
      context,
    };

    await this.persist();
    logger.debug('Agent status updated.', {
      agentId: agent.id,
      status,
    });
    await this.notifyConnectors(agent, context);
    this.emit('statusChanged', { agent, context });
    return agent;
  }

  async persist() {
    await writeJson(STATE_PATH, { agents: this.state.agents || {} });
  }

  async notifyConnectors(agent, context) {
    const tasks = this.connectors.map(async (connector) => {
      try {
        await connector.onAgentStatusChange(agent, context);
      } catch (error) {
        const name = connector.name || 'unnamed-connector';
        logger.error('Agent connector failed.', {
          connector: name,
          agentId: agent.id,
          error: error.message,
        });
      }
    });
    await Promise.all(tasks);
  }
}

export default AgentRuntime;
