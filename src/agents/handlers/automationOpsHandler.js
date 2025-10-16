import { spawn } from 'node:child_process';
import { logger } from '../../logger.js';

function parseInterval(value) {
  if (!value) return null;
  const ms = Number(value);
  if (Number.isNaN(ms) || ms <= 0) {
    return null;
  }
  return ms;
}

function runShellCommand(command, context) {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', ['-lc', command], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        logger.info('Automation command completed.', {
          command,
          trigger: context.trigger,
        });
        resolve();
      } else {
        const error = new Error(`Command failed with exit code ${code}`);
        error.code = code;
        logger.error('Automation command failed.', {
          command,
          exitCode: code,
          trigger: context.trigger,
        });
        reject(error);
      }
    });

    child.on('error', (error) => {
      logger.error('Automation command spawn error.', {
        command,
        trigger: context.trigger,
        error: error.message,
      });
      reject(error);
    });
  });
}

export function createAutomationOpsHandler(options = {}) {
  const command =
    options.validateCommand || process.env.AUTOMATION_VALIDATE_COMMAND;
  const intervalMs =
    options.validateIntervalMs ||
    parseInterval(process.env.AUTOMATION_VALIDATE_INTERVAL_MS);

  async function execute(trigger) {
    if (!command) {
      logger.warn('Automation command not configured; skipping execution.', {
        trigger,
      });
      return;
    }

    try {
      await runShellCommand(command, { trigger });
    } catch (error) {
      logger.error('Automation command execution error.', {
        command,
        trigger,
        error: error.message,
      });
    }
  }

  return {
    name: 'automationOpsHandler',
    async start({ agent, context }) {
      logger.info('Starting automation operations agent.', {
        agentId: agent.id,
        command: command || 'not configured',
        intervalMs: intervalMs || 'not scheduled',
      });

      let timer = null;
      if (intervalMs) {
        timer = setInterval(() => {
          execute('scheduler');
        }, intervalMs);
        if (typeof timer.unref === 'function') {
          timer.unref();
        }
      }

      const shouldRunImmediately = context?.executeImmediately !== false;
      if (shouldRunImmediately) {
        await execute(context?.trigger || 'activation');
      }

      return {
        stop: () => {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          logger.info('Automation operations agent stopped.', {
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

export default createAutomationOpsHandler;
