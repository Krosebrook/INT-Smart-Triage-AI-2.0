import { AssignmentEngine } from '../../assignmentEngine.js';
import { logger } from '../../logger.js';

export function createDepartmentRouterHandler(options = {}) {
  const engine = options.assignmentEngine || new AssignmentEngine();
  const onAssign = options.onAssign;

  return {
    name: 'departmentRouterHandler',
    async start({ agent }) {
      logger.info('Department router activated.', {
        agentId: agent.id,
      });

      return {
        async route(reportData) {
          const result = await engine.autoAssign(reportData);
          logger.debug('Department router processed report.', {
            agentId: agent.id,
            reportId: reportData.reportId,
            success: result.success,
            assignedTo: result.assignedTo,
          });
          if (typeof onAssign === 'function') {
            await onAssign(result, reportData);
          }
          return result;
        },
        stop() {
          logger.info('Department router stopped.', {
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

export default createDepartmentRouterHandler;
