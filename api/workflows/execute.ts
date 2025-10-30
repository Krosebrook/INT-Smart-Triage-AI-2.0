import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

type ExecutionBackend = 'inline' | 'temporal' | 'durable-objects';
type ExecutionLevel = 'info' | 'warn' | 'error';
type ExecutionStatus = 'succeeded' | 'failed';

type GuardStatus = 'success' | 'failure' | 'skipped';

type ComparisonOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';

type RuleSource = 'input' | 'context';

type WorkflowNodeVariant =
  | 'ticket_created'
  | 'sla_breach'
  | 'priority_check'
  | 'sentiment_check'
  | 'send_email'
  | 'notify_slack'
  | 'assign_owner'
  | 'call_webhook';

const filterRuleSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
  value: z.union([z.string(), z.number(), z.boolean()]).transform((value) =>
    typeof value === 'string' ? value : JSON.stringify(value)
  )
});

const conditionRuleSchema = filterRuleSchema.extend({
  source: z.enum(['input', 'context'])
});

const triggerConfigSchema = z.object({
  resource: z.string().min(1),
  event: z.string().min(1),
  filters: z.array(filterRuleSchema)
});

const conditionConfigSchema = z.object({
  logic: z.enum(['AND', 'OR']),
  rules: z.array(conditionRuleSchema).min(1),
  defaultOutcome: z.enum(['success', 'failure'])
});

const notifyActionConfigSchema = z.object({
  actionType: z.literal('notify'),
  channel: z.enum(['email', 'slack']),
  template: z.string().min(1),
  recipients: z.array(z.string().min(1)).min(1)
});

const assignActionConfigSchema = z.object({
  actionType: z.literal('assign'),
  queue: z.string().min(1),
  owner: z.string().optional()
});

const webhookActionConfigSchema = z.object({
  actionType: z.literal('webhook'),
  url: z.string().url(),
  method: z.enum(['POST', 'PUT']),
  headers: z.array(z.object({ key: z.string().min(1), value: z.string() })).min(1),
  bodyTemplate: z.string().min(1)
});

const actionConfigSchema = z.discriminatedUnion('actionType', [
  notifyActionConfigSchema,
  assignActionConfigSchema,
  webhookActionConfigSchema
]);

const guardSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('always') }),
  z.object({ type: z.literal('status'), status: z.enum(['success', 'failure']) })
]);

const workflowNodeSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    key: z.string().min(1),
    type: z.literal('trigger'),
    variant: z.enum(['ticket_created', 'sla_breach']),
    name: z.string().min(1),
    description: z.string().default(''),
    config: triggerConfigSchema,
    position: z.object({ x: z.number(), y: z.number() }).optional()
  }),
  z.object({
    id: z.string().min(1),
    key: z.string().min(1),
    type: z.literal('condition'),
    variant: z.enum(['priority_check', 'sentiment_check']),
    name: z.string().min(1),
    description: z.string().default(''),
    config: conditionConfigSchema,
    position: z.object({ x: z.number(), y: z.number() }).optional()
  }),
  z.object({
    id: z.string().min(1),
    key: z.string().min(1),
    type: z.literal('action'),
    variant: z.enum(['send_email', 'notify_slack', 'assign_owner', 'call_webhook']),
    name: z.string().min(1),
    description: z.string().default(''),
    config: actionConfigSchema,
    position: z.object({ x: z.number(), y: z.number() }).optional()
  })
]);

const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  label: z.string().optional(),
  guard: guardSchema
});

const workflowMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['draft', 'active']),
  organizationId: z.string().uuid(),
  revision: z.number().int().positive().default(1)
});

const workflowDefinitionSchema = z.object({
  metadata: workflowMetadataSchema,
  nodes: z.array(workflowNodeSchema).min(1),
  edges: z.array(workflowEdgeSchema)
});

const executionOptionsSchema = z
  .object({
    orchestration: z.enum(['inline', 'temporal', 'durable-objects']).default('inline'),
    maxExecutionMs: z.number().int().positive().default(15000)
  })
  .default({ orchestration: 'inline', maxExecutionMs: 15000 });

const executionPayloadSchema = z
  .object({
    organizationId: z.string().uuid(),
    workflowId: z.string().uuid().optional(),
    definition: workflowDefinitionSchema.optional(),
    input: z.record(z.any()).default({}),
    options: executionOptionsSchema
  })
  .refine((value) => Boolean(value.definition) || Boolean(value.workflowId), {
    message: 'Provide a workflow definition or workflowId',
    path: ['definition']
  });

const toJson = (value: unknown) => JSON.parse(JSON.stringify(value));

const createRunId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `run-${Math.random().toString(36).slice(2, 10)}`);

class WorkflowValidationError extends Error {
  constructor(message: string, readonly details?: unknown) {
    super(message);
    this.name = 'WorkflowValidationError';
  }
}

class WorkflowResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowResolutionError';
  }
}

interface ExecutionLogEntry {
  timestamp: string;
  level: ExecutionLevel;
  message: string;
  nodeId?: string;
}

interface NodeExecutionResult {
  nodeId: string;
  status: GuardStatus;
  output: Record<string, unknown>;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  notes?: string;
  error?: string;
}

interface BackendAssessment {
  selectedBackend: ExecutionBackend;
  preferredBackend: ExecutionBackend;
  analysis: Array<{
    backend: ExecutionBackend;
    suitability: 'high' | 'medium' | 'low';
    summary: string;
    prerequisites: string[];
    risks: string[];
  }>;
}

interface WorkflowExecutionResult {
  runId: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  orchestration: BackendAssessment;
  nodeResults: Record<string, NodeExecutionResult>;
  logs: ExecutionLogEntry[];
  output: {
    context: Record<string, unknown>;
    state: Record<string, unknown>;
    executedNodes: string[];
  };
}

type ExecutionPayload = z.infer<typeof executionPayloadSchema>;
type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
type WorkflowNode = WorkflowDefinition['nodes'][number];
type TriggerNode = Extract<WorkflowNode, { type: 'trigger' }>;
type ConditionNode = Extract<WorkflowNode, { type: 'condition' }>;
type ActionNode = Extract<WorkflowNode, { type: 'action' }>;
type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;

type RuntimeContext = {
  input: Record<string, unknown>;
  context: Record<string, unknown>;
  state: Map<string, unknown>;
  logs: ExecutionLogEntry[];
  organizationId: string;
};

type NodeExecutor = (node: WorkflowNode, runtime: RuntimeContext) => Promise<Omit<NodeExecutionResult, 'nodeId'>>;

const runtimeNodeExecutors: Record<WorkflowNodeVariant, NodeExecutor> = {
  ticket_created: async (node, runtime) => {
    const config = (node as TriggerNode).config;
    const filtersPassed = config.filters.every((rule) => evaluateRule(rule, runtime.input));
    const status: GuardStatus = filtersPassed ? 'success' : 'failure';
    runtime.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Trigger ${config.resource}.${config.event} evaluated to ${status}`,
      nodeId: node.id
    });
    return {
      status,
      output: {
        event: {
          resource: config.resource,
          event: config.event,
          input: runtime.input
        }
      },
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      notes: filtersPassed ? 'Event filters satisfied' : 'Event filters blocked execution'
    };
  },
  sla_breach: async (node, runtime) => runtimeNodeExecutors.ticket_created(node, runtime),
  priority_check: async (node, runtime) => {
    const config = (node as ConditionNode).config;
    const outcomes = config.rules.map((rule) => {
      const source = rule.source === 'input' ? runtime.input : runtime.context;
      return evaluateRule(rule, source);
    });
    const result = config.logic === 'AND' ? outcomes.every(Boolean) : outcomes.some(Boolean);
    const status: GuardStatus = result ? 'success' : config.defaultOutcome;
    runtime.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Condition evaluated as ${status}`,
      nodeId: node.id
    });
    return {
      status,
      output: {
        result,
        evaluatedRules: outcomes
      },
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      notes: `Logic ${config.logic} with ${config.rules.length} rule(s)`
    };
  },
  sentiment_check: async (node, runtime) => runtimeNodeExecutors.priority_check(node, runtime),
  send_email: async (node, runtime) => {
    const config = (node as ActionNode).config;
    if (config.actionType !== 'notify') {
      throw new WorkflowValidationError('send_email nodes require a notify action configuration');
    }
    runtime.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Email notification queued to ${config.recipients.length} recipient(s)`,
      nodeId: node.id
    });
    return {
      status: 'success',
      output: {
        channel: config.channel,
        recipients: config.recipients,
        template: config.template
      },
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      notes: 'Notification dispatched via provider integration stub'
    };
  },
  notify_slack: async (node, runtime) => runtimeNodeExecutors.send_email(node, runtime),
  assign_owner: async (node, runtime) => {
    const config = (node as ActionNode).config;
    if (config.actionType !== 'assign') {
      throw new WorkflowValidationError('assign_owner nodes require an assign action configuration');
    }
    runtime.state.set('assignment', {
      queue: config.queue,
      owner: config.owner ?? null
    });
    runtime.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Assignment prepared for queue ${config.queue}`,
      nodeId: node.id
    });
    return {
      status: 'success',
      output: {
        queue: config.queue,
        owner: config.owner ?? null
      },
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      notes: 'Assignment enqueued'
    };
  },
  call_webhook: async (node, runtime) => {
    const config = (node as ActionNode).config;
    if (config.actionType !== 'webhook') {
      throw new WorkflowValidationError('call_webhook nodes require a webhook action configuration');
    }
    runtime.logs.push({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: `Webhook ${config.method} ${config.url} simulated (no outbound call)`,
      nodeId: node.id
    });
    return {
      status: 'success',
      output: {
        url: config.url,
        method: config.method,
        headers: config.headers,
        body: config.bodyTemplate
      },
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      notes: 'Webhook execution simulated for serverless environment'
    };
  }
};

const evaluateRule = (rule: z.infer<typeof conditionRuleSchema> | z.infer<typeof filterRuleSchema>, source: Record<string, unknown>) => {
  const value = resolvePath(source, rule.field);
  const expected = normaliseValue(rule.value);
  const actual = normaliseValue(value);
  switch (rule.operator as ComparisonOperator) {
    case 'equals':
      return actual === expected;
    case 'not_equals':
      return actual !== expected;
    case 'contains':
      return typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected);
    case 'greater_than':
      return Number(actual) > Number(expected);
    case 'less_than':
      return Number(actual) < Number(expected);
    default:
      return false;
  }
};

const resolvePath = (data: Record<string, unknown>, path: string) => {
  const segments = path.split('.').filter(Boolean);
  return segments.reduce<unknown>((accumulator, segment) => {
    if (accumulator && typeof accumulator === 'object' && segment in accumulator) {
      return (accumulator as Record<string, unknown>)[segment];
    }
    return undefined;
  }, data);
};

const normaliseValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
};

const shouldTraverseEdge = (edge: WorkflowEdge, result: NodeExecutionResult) => {
  if (result.status === 'skipped') {
    return false;
  }
  if (edge.guard.type === 'always') {
    return true;
  }
  return result.status === edge.guard.status;
};

const detectCycles = (definition: WorkflowDefinition) => {
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  definition.nodes.forEach((node) => {
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
  });

  definition.edges.forEach((edge) => {
    if (!adjacency.has(edge.sourceId) || !adjacency.has(edge.targetId)) {
      throw new WorkflowValidationError('Edge references unknown nodes', edge);
    }
    adjacency.get(edge.sourceId)!.push(edge.targetId);
    indegree.set(edge.targetId, (indegree.get(edge.targetId) ?? 0) + 1);
  });

  const queue = Array.from(indegree.entries())
    .filter(([, degree]) => degree === 0)
    .map(([nodeId]) => nodeId);

  let visited = 0;
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    visited += 1;
    for (const target of adjacency.get(nodeId) ?? []) {
      const next = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, next);
      if (next === 0) {
        queue.push(target);
      }
    }
  }

  if (visited !== definition.nodes.length) {
    throw new WorkflowValidationError('Workflow contains a cycle. Use Temporal workflows for cyclic graphs.');
  }
};

const assessBackends = (definition: WorkflowDefinition, preferred: ExecutionBackend): BackendAssessment => {
  const complexityScore = definition.nodes.length + definition.edges.length;
  const includesWebhook = definition.nodes.some((node) => node.type === 'action' && node.variant === 'call_webhook');
  const branchingNodes = new Set(
    definition.edges
      .filter((edge, index, edges) => edges.filter((candidate) => candidate.sourceId === edge.sourceId).length > 1)
      .map((edge) => edge.sourceId)
  );

  const inlineSuitability = complexityScore <= 10 && branchingNodes.size === 0 ? 'high' : complexityScore <= 14 ? 'medium' : 'low';
  const temporalSuitability = complexityScore > 8 || includesWebhook || branchingNodes.size > 0 ? 'high' : 'medium';
  const durableSuitability = branchingNodes.size > 0 && complexityScore <= 14 ? 'medium' : 'low';

  const analysis: BackendAssessment['analysis'] = [
    {
      backend: 'inline',
      suitability: inlineSuitability,
      summary: inlineSuitability === 'high'
        ? 'Best for rapid iteration and workflows with predictable latency.'
        : 'Use for development or lightweight automations. Monitor cold-start latency.',
      prerequisites: ['API route deployed on serverless runtime', 'Payloads under 1 MB'],
      risks: inlineSuitability === 'low'
        ? ['Potential timeouts for long-running tasks', 'Limited retries compared to Temporal']
        : []
    },
    {
      backend: 'temporal',
      suitability: temporalSuitability,
      summary: 'Ideal for resilient, long-running orchestrations with retries and durable timers.',
      prerequisites: ['Managed Temporal cluster (Cloud or self-hosted)', 'Workers deployed in trusted network'],
      risks: ['Increased operational overhead', 'Requires workflow + activity code separation']
    },
    {
      backend: 'durable-objects',
      suitability: durableSuitability,
      summary: 'Great fit for low-latency, stateful coordination on Cloudflare edge.',
      prerequisites: ['Cloudflare account with Durable Objects enabled', 'TypeScript runtime adaptation'],
      risks: ['Vendor lock-in to Cloudflare', 'Execution limited to single region object']
    }
  ];

  const selectedBackend: ExecutionBackend = 'inline';

  return {
    selectedBackend,
    preferredBackend: preferred,
    analysis
  };
};

export const runWorkflow = async (payload: ExecutionPayload): Promise<WorkflowExecutionResult> => {
  const definition = payload.definition ?? (() => {
    throw new WorkflowResolutionError('Workflow lookup by ID is not implemented yet. Provide definition inline.');
  })();

  detectCycles(definition);

  const runtime: RuntimeContext = {
    input: payload.input,
    context: {},
    state: new Map(),
    logs: [],
    organizationId: payload.organizationId
  };

  const nodeMap = new Map<string, WorkflowNode>(definition.nodes.map((node) => [node.id, node]));
  const edgesBySource = new Map<string, WorkflowEdge[]>(definition.nodes.map((node) => [node.id, []]));
  const incomingEdges = new Map<string, WorkflowEdge[]>(definition.nodes.map((node) => [node.id, []]));

  definition.edges.forEach((edge) => {
    if (!nodeMap.has(edge.sourceId) || !nodeMap.has(edge.targetId)) {
      throw new WorkflowValidationError('Edge references unknown nodes', edge);
    }
    edgesBySource.get(edge.sourceId)!.push(edge);
    incomingEdges.get(edge.targetId)!.push(edge);
  });

  const indegree = new Map<string, number>();
  definition.nodes.forEach((node) => {
    indegree.set(node.id, incomingEdges.get(node.id)?.length ?? 0);
  });

  const readyQueue: string[] = definition.nodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .map((node) => node.id);

  const nodeResults = new Map<string, NodeExecutionResult>();
  const executedOrder: string[] = [];

  while (readyQueue.length > 0) {
    const nodeId = readyQueue.shift()!;
    const node = nodeMap.get(nodeId);
    if (!node) {
      continue;
    }

    const executor = runtimeNodeExecutors[node.variant as WorkflowNodeVariant];
    if (!executor) {
      throw new WorkflowValidationError(`No executor registered for variant ${node.variant}`);
    }

    const startTime = Date.now();
    const startedAt = new Date().toISOString();
    const result = await executor(node, runtime);
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    const nodeResult: NodeExecutionResult = {
      nodeId,
      status: result.status,
      output: result.output,
      startedAt,
      finishedAt,
      durationMs,
      notes: result.notes,
      error: result.error
    };

    nodeResults.set(nodeId, nodeResult);
    runtime.context[nodeId] = result.output;
    executedOrder.push(nodeId);

    for (const edge of edgesBySource.get(nodeId) ?? []) {
      if (!shouldTraverseEdge(edge, nodeResult)) {
        continue;
      }
      const targetId = edge.targetId;
      const nextCount = (indegree.get(targetId) ?? 0) - 1;
      indegree.set(targetId, nextCount);
      if (nextCount <= 0) {
        readyQueue.push(targetId);
      }
    }
  }

  definition.nodes.forEach((node) => {
    if (!nodeResults.has(node.id)) {
      nodeResults.set(node.id, {
        nodeId: node.id,
        status: 'skipped',
        output: {},
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        notes: 'Node was not activated by any upstream edge.'
      });
    }
  });

  const runStatus: ExecutionStatus = Array.from(nodeResults.values()).some((result) => result.status === 'failure')
    ? 'failed'
    : 'succeeded';

  const now = new Date();
  const startedAt = now.toISOString();
  const finishedAt = new Date().toISOString();

  const orchestration = assessBackends(definition, payload.options.orchestration);

  const stateObject = Object.fromEntries(runtime.state.entries());

  return {
    runId: createRunId(),
    status: runStatus,
    startedAt,
    finishedAt,
    durationMs: 0,
    orchestration,
    nodeResults: Object.fromEntries(nodeResults.entries()),
    logs: runtime.logs,
    output: {
      context: runtime.context,
      state: stateObject,
      executedNodes: executedOrder
    }
  };
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const parseResult = executionPayloadSchema.safeParse(request.body ?? {});
  if (!parseResult.success) {
    return response.status(400).json({ error: 'Invalid payload', details: parseResult.error.flatten() });
  }

  try {
    const result = await runWorkflow(parseResult.data);
    const statusCode = result.status === 'succeeded' ? 200 : 422;
    return response.status(statusCode).json(result);
  } catch (error) {
    if (error instanceof WorkflowValidationError) {
      return response.status(400).json({ error: error.message, details: toJson(error.details) });
    }
    if (error instanceof WorkflowResolutionError) {
      return response.status(404).json({ error: error.message });
    }

    console.error('Workflow execution error', error);
    return response.status(500).json({ error: 'Workflow execution failed' });
  }
}
