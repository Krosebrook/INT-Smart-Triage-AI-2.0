#!/usr/bin/env node
import process from 'node:process';
import startAgentOrchestrator from '../src/agents/orchestrator.js';
import { logger } from '../src/logger.js';

async function main() {
  let orchestrator;
  try {
    orchestrator = await startAgentOrchestrator();
  } catch (error) {
    logger.error('Failed to start agent orchestrator.', {
      error: error.message,
    });
    process.exit(1);
  }

  logger.info('Agent orchestrator running. Press Ctrl+C to exit.');

  function shutdown(signal) {
    logger.warn('Received shutdown signal.', { signal });
    orchestrator
      .shutdown()
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Error while shutting down orchestrator.', {
          error: error.message,
        });
        process.exit(1);
      });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Keep process alive for long-running handlers
  setInterval(() => {
    /* noop heartbeat */
  }, 60_000).unref();
}

main();
