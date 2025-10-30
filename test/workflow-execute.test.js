import test from 'node:test';
import assert from 'node:assert/strict';

const loadModule = async () => import('../build-ts/api/workflows/execute.js');

const baseMetadata = {
  name: 'Escalation Workflow',
  description: 'Auto escalate based on priority.',
  status: 'draft',
  organizationId: '123e4567-e89b-12d3-a456-426614174000',
  revision: 1
};

test('executes workflow and routes through success branch', async () => {
  const { runWorkflow } = await loadModule();

  const triggerNode = {
    id: 'trigger-1',
    key: 'trigger-1',
    type: 'trigger',
    variant: 'ticket_created',
    name: 'Ticket Created',
    description: '',
    config: {
      resource: 'tickets',
      event: 'created',
      filters: [
        { field: 'priority', operator: 'greater_than', value: '0' }
      ]
    }
  };

  const conditionNode = {
    id: 'condition-1',
    key: 'condition-1',
    type: 'condition',
    variant: 'priority_check',
    name: 'Priority Check',
    description: '',
    config: {
      logic: 'AND',
      defaultOutcome: 'failure',
      rules: [
        { source: 'input', field: 'priority', operator: 'greater_than', value: '3' }
      ]
    }
  };

  const notifyNode = {
    id: 'action-1',
    key: 'action-1',
    type: 'action',
    variant: 'send_email',
    name: 'Notify Leadership',
    description: '',
    config: {
      actionType: 'notify',
      channel: 'email',
      template: 'Ticket {{ticketId}} triggered escalation',
      recipients: ['exec@example.com']
    }
  };

  const fallbackNode = {
    id: 'action-2',
    key: 'action-2',
    type: 'action',
    variant: 'assign_owner',
    name: 'Assign Queue',
    description: '',
    config: {
      actionType: 'assign',
      queue: 'standard',
      owner: ''
    }
  };

  const definition = {
    metadata: baseMetadata,
    nodes: [triggerNode, conditionNode, notifyNode, fallbackNode],
    edges: [
      { id: 'edge-1', sourceId: 'trigger-1', targetId: 'condition-1', guard: { type: 'always' } },
      { id: 'edge-2', sourceId: 'condition-1', targetId: 'action-1', guard: { type: 'status', status: 'success' } },
      { id: 'edge-3', sourceId: 'condition-1', targetId: 'action-2', guard: { type: 'status', status: 'failure' } }
    ]
  };

  const payload = {
    organizationId: baseMetadata.organizationId,
    definition,
    input: { priority: '5', ticketId: 'T-1000' },
    options: { orchestration: 'inline', maxExecutionMs: 1000 }
  };

  const result = await runWorkflow(payload);

  assert.equal(result.status, 'succeeded');
  assert.equal(result.orchestration.selectedBackend, 'inline');
  assert.equal(result.nodeResults['trigger-1'].status, 'success');
  assert.equal(result.nodeResults['condition-1'].status, 'success');
  assert.equal(result.nodeResults['action-1'].status, 'success');
  assert.equal(result.nodeResults['action-2'].status, 'skipped');
  assert.ok(result.logs.length >= 1);
  assert.deepEqual(result.output.executedNodes, ['trigger-1', 'condition-1', 'action-1']);
});

test('fails validation for cyclic workflow definition', async () => {
  const { runWorkflow } = await loadModule();

  const nodeA = {
    id: 'node-a',
    key: 'node-a',
    type: 'trigger',
    variant: 'ticket_created',
    name: 'A',
    description: '',
    config: {
      resource: 'tickets',
      event: 'created',
      filters: [
        { field: 'priority', operator: 'greater_than', value: '0' }
      ]
    }
  };

  const nodeB = {
    id: 'node-b',
    key: 'node-b',
    type: 'action',
    variant: 'send_email',
    name: 'B',
    description: '',
    config: {
      actionType: 'notify',
      channel: 'email',
      template: 'Test',
      recipients: ['ops@example.com']
    }
  };

  const definition = {
    metadata: baseMetadata,
    nodes: [nodeA, nodeB],
    edges: [
      { id: 'edge-a', sourceId: 'node-a', targetId: 'node-b', guard: { type: 'always' } },
      { id: 'edge-b', sourceId: 'node-b', targetId: 'node-a', guard: { type: 'always' } }
    ]
  };

  const payload = {
    organizationId: baseMetadata.organizationId,
    definition,
    input: { priority: '1' },
    options: { orchestration: 'inline', maxExecutionMs: 1000 }
  };

  await assert.rejects(async () => runWorkflow(payload), (error) => {
    assert.equal(error.name, 'WorkflowValidationError');
    assert.match(error.message, /cycle/i);
    return true;
  });
});
