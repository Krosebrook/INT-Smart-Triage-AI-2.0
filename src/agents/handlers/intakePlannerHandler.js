import { AssignmentEngine } from '../../assignmentEngine.js';
import { logger } from '../../logger.js';

function buildPlannerResult(ticket, engine) {
  const description = ticket.issueDescription || ticket.description || '';
  const department = engine.determineDepartment(description);
  const priority = ticket.priority || 'medium';

  return {
    ticketId: ticket.reportId || ticket.id || null,
    department,
    priority,
    plannerNotes: ticket.plannerNotes || null,
  };
}

export function createIntakePlannerHandler(options = {}) {
  const engine = options.assignmentEngine || new AssignmentEngine();
  const onPlan = options.onPlan;

  return {
    name: 'intakePlannerHandler',
    async start({ agent }) {
      logger.info('Intake triage planner activated.', {
        agentId: agent.id,
      });

      return {
        async planTicket(ticket) {
          const plan = buildPlannerResult(ticket, engine);
          logger.debug('Planner generated draft.', {
            agentId: agent.id,
            ticketId: plan.ticketId,
            department: plan.department,
          });
          if (typeof onPlan === 'function') {
            await onPlan(plan, ticket);
          }
          return plan;
        },
        stop() {
          logger.info('Intake triage planner stopped.', {
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

export default createIntakePlannerHandler;
