#!/usr/bin/env node
import { readFile } from 'fs/promises';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

async function loadRegistry() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const registryPath = path.resolve(__dirname, '..', 'agents', 'registry.json');
  const raw = await readFile(registryPath, 'utf8');
  return JSON.parse(raw);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const current = args[i];
    if (current === '--agent' || current === '-a') {
      options.agentId = args[i + 1];
      i += 1;
    }
    if (current === '--json') {
      options.json = true;
    }
  }
  return options;
}

function formatAgent(agent) {
  return {
    id: agent.id,
    codename: agent.codename,
    status: agent.status,
    mission: agent.mission,
    owners: agent.owners.join(', '),
    activation_notes: agent.activation_notes,
  };
}

async function main() {
  try {
    const registry = await loadRegistry();
    const options = parseArgs();

    let selected = registry;
    if (options.agentId) {
      selected = registry.filter((agent) => agent.id === options.agentId);
      if (selected.length === 0) {
        console.error(`Agent not found: ${options.agentId}`);
        process.exit(1);
      }
    }

    if (options.json) {
      console.log(JSON.stringify(selected, null, 2));
      return;
    }

    const rows = selected.map(formatAgent);
    console.table(rows);
    if (!options.agentId) {
      console.log(
        '\nTip: inspect a specific agent with `node scripts/agents-status.js --agent automation-ops`.'
      );
    }
  } catch (error) {
    console.error('Unable to load agent registry:', error.message);
    process.exit(1);
  }
}

main();
