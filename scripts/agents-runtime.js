#!/usr/bin/env node
import process from 'node:process';
import AgentRuntime from '../src/agents/runtime.js';
import { createDashboardConnector } from '../src/agents/connectors/dashboardConnector.js';
import { createAutomationConnector } from '../src/agents/connectors/automationConnector.js';

function parseArgs() {
  const [command = 'status', ...rest] = process.argv.slice(2);
  const options = { command };

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    switch (token) {
      case '--agent':
      case '-a':
        options.agentId = rest[i + 1];
        i += 1;
        break;
      case '--json':
        options.json = true;
        break;
      case '--notes':
        options.notes = rest[i + 1];
        i += 1;
        break;
      case '--trigger':
        options.trigger = rest[i + 1];
        i += 1;
        break;
      default:
        break;
    }
  }

  return options;
}

async function bootstrapRuntime() {
  const connectors = [createDashboardConnector(), createAutomationConnector()];

  return AgentRuntime.create({ connectors });
}

function renderAgents(agents, asJson = false) {
  if (asJson) {
    console.log(JSON.stringify(agents, null, 2));
    return;
  }

  const rows = agents.map((agent) => ({
    id: agent.id,
    codename: agent.codename,
    status: agent.status,
    lastUpdated: agent.lastUpdated,
  }));
  console.table(rows);
}

async function main() {
  const options = parseArgs();
  let runtime;

  try {
    runtime = await bootstrapRuntime();
  } catch (error) {
    console.error(`Unable to start agent runtime: ${error.message}`);
    process.exit(1);
  }

  const { command, agentId } = options;

  try {
    switch (command) {
      case 'activate':
        if (!agentId) {
          throw new Error('Activate requires --agent <agentId>.');
        }
        await runtime.activateAgent(agentId, {
          trigger: options.trigger || 'manual-cli',
          notes: options.notes,
        });
        console.log(`Agent ${agentId} activated.`);
        break;
      case 'deactivate':
        if (!agentId) {
          throw new Error('Deactivate requires --agent <agentId>.');
        }
        await runtime.deactivateAgent(agentId, {
          trigger: options.trigger || 'manual-cli',
          notes: options.notes,
        });
        console.log(`Agent ${agentId} deactivated.`);
        break;
      case 'flag':
        if (!agentId) {
          throw new Error('Flag requires --agent <agentId>.');
        }
        await runtime.flagAgent(agentId, {
          trigger: options.trigger || 'manual-cli',
          notes: options.notes,
        });
        console.log(`Agent ${agentId} flagged for attention.`);
        break;
      case 'status':
      default:
        renderAgents(runtime.listAgents(), options.json);
        if (!options.json) {
          console.log(
            '\nUse `node scripts/agents-runtime.js activate --agent automation-ops` to change status.'
          );
        }
        break;
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
