import { createAutomationOpsHandler } from './automationOpsHandler.js';
import { createIntakePlannerHandler } from './intakePlannerHandler.js';
import { createDepartmentRouterHandler } from './departmentRouterHandler.js';
import { createDefaultHandler } from './defaultHandler.js';

const FACTORIES = {
  'automation-ops': createAutomationOpsHandler,
  'intake-triage-planner': createIntakePlannerHandler,
  'department-router': createDepartmentRouterHandler,
};

export function createHandlerRegistry(options = {}) {
  const cache = new Map();

  function get(agentId) {
    if (!FACTORIES[agentId]) {
      if (!cache.has(agentId)) {
        cache.set(agentId, createDefaultHandler(agentId));
      }
      return cache.get(agentId);
    }

    if (!cache.has(agentId)) {
      const handlerFactory = FACTORIES[agentId];
      cache.set(agentId, handlerFactory(options));
    }

    return cache.get(agentId);
  }

  return {
    get,
  };
}

export default createHandlerRegistry;
