import React, { useCallback, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { z } from 'zod';
import '../styles/workflow-builder.css';

type NodeType = 'trigger' | 'condition' | 'action';
type TriggerVariant = 'ticket_created' | 'sla_breach';
type ConditionVariant = 'priority_check' | 'sentiment_check';
type ActionVariant = 'send_email' | 'notify_slack' | 'assign_owner' | 'call_webhook';
type WorkflowNodeVariant = TriggerVariant | ConditionVariant | ActionVariant;

type ComparisonOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';

type GuardStatus = 'success' | 'failure';

type PaletteCategory = NodeType;

type EdgeGuard =
  | { type: 'always' }
  | { type: 'status'; status: GuardStatus };

type RuleSource = 'input' | 'context';

interface FilterRule {
  field: string;
  operator: ComparisonOperator;
  value: string;
}

interface ConditionRule extends FilterRule {
  source: RuleSource;
}

interface TriggerConfig {
  resource: string;
  event: string;
  filters: FilterRule[];
}

interface ConditionConfig {
  logic: 'AND' | 'OR';
  rules: ConditionRule[];
  defaultOutcome: GuardStatus;
}

interface NotifyActionConfig {
  actionType: 'notify';
  channel: 'email' | 'slack';
  template: string;
  recipients: string[];
}

interface AssignActionConfig {
  actionType: 'assign';
  queue: string;
  owner?: string;
}

interface WebhookActionConfig {
  actionType: 'webhook';
  url: string;
  method: 'POST' | 'PUT';
  headers: Array<{ key: string; value: string }>;
  bodyTemplate: string;
}

type ActionConfig = NotifyActionConfig | AssignActionConfig | WebhookActionConfig;

type Position = { x: number; y: number };

interface BaseNode<TType extends NodeType, TVariant extends WorkflowNodeVariant, TConfig> {
  id: string;
  key: string;
  type: TType;
  variant: TVariant;
  name: string;
  description: string;
  config: TConfig;
  position: Position;
}

type TriggerNode = BaseNode<'trigger', TriggerVariant, TriggerConfig>;
type ConditionNode = BaseNode<'condition', ConditionVariant, ConditionConfig>;
type ActionNode = BaseNode<'action', ActionVariant, ActionConfig>;

type WorkflowNode = TriggerNode | ConditionNode | ActionNode;

interface WorkflowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  guard: EdgeGuard;
}

interface PaletteItem {
  id: string;
  type: PaletteCategory;
  variant: WorkflowNodeVariant;
  name: string;
  description: string;
  helperText?: string;
}

interface RuleMeta {
  name: string;
  description: string;
  status: 'draft' | 'active';
  organizationId: string;
}

const guardOptions: Array<{ label: string; guard: EdgeGuard }> = [
  { label: 'Always', guard: { type: 'always' } },
  { label: 'On Success', guard: { type: 'status', status: 'success' } },
  { label: 'On Failure', guard: { type: 'status', status: 'failure' } }
];

const palette: PaletteItem[] = [
  {
    id: 'trigger-ticket-created',
    type: 'trigger',
    variant: 'ticket_created',
    name: 'Ticket Created',
    description: 'Kick off when a new ticket enters the system.',
    helperText: 'Requires ticket event stream'
  },
  {
    id: 'trigger-sla-breach',
    type: 'trigger',
    variant: 'sla_breach',
    name: 'SLA Breached',
    description: 'Start when an SLA threshold is crossed.',
    helperText: 'Requires SLA timers'
  },
  {
    id: 'condition-priority-check',
    type: 'condition',
    variant: 'priority_check',
    name: 'Priority Threshold',
    description: 'Branch based on ticket priority and queue.',
    helperText: 'Supports AND/OR logic'
  },
  {
    id: 'condition-sentiment-check',
    type: 'condition',
    variant: 'sentiment_check',
    name: 'Sentiment Score',
    description: 'Route when customer sentiment dips below a boundary.',
    helperText: 'Reads from AI signal store'
  },
  {
    id: 'action-send-email',
    type: 'action',
    variant: 'send_email',
    name: 'Send Email Update',
    description: 'Notify customer or internal stakeholders by email.',
    helperText: 'Uses template with variables'
  },
  {
    id: 'action-notify-slack',
    type: 'action',
    variant: 'notify_slack',
    name: 'Notify Slack Channel',
    description: 'Send alert to a triage Slack room.',
    helperText: 'Requires Slack webhook URL'
  },
  {
    id: 'action-assign-owner',
    type: 'action',
    variant: 'assign_owner',
    name: 'Assign Owner',
    description: 'Route ticket to a queue or named CSR.',
    helperText: 'Supports load balancing'
  },
  {
    id: 'action-call-webhook',
    type: 'action',
    variant: 'call_webhook',
    name: 'Invoke Webhook',
    description: 'Call downstream system with contextual payload.',
    helperText: 'POST or PUT supported'
  }
];

const triggerConfigSchema = z.object({
  resource: z.string().min(1),
  event: z.string().min(1),
  filters: z.array(
    z.object({
      field: z.string().min(1),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
      value: z.string()
    })
  )
});

const conditionConfigSchema = z.object({
  logic: z.enum(['AND', 'OR']),
  rules: z
    .array(
      z.object({
        field: z.string().min(1),
        operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
        value: z.string(),
        source: z.enum(['input', 'context'])
      })
    )
    .min(1),
  defaultOutcome: z.enum(['success', 'failure'])
});

const notifyActionSchema = z.object({
  actionType: z.literal('notify'),
  channel: z.enum(['email', 'slack']),
  template: z.string().min(1),
  recipients: z.array(z.string().email('Recipients must be valid emails or Slack webhook URLs')).min(1)
});

const assignActionSchema = z.object({
  actionType: z.literal('assign'),
  queue: z.string().min(1),
  owner: z.string().optional()
});

const webhookActionSchema = z.object({
  actionType: z.literal('webhook'),
  url: z.string().url(),
  method: z.enum(['POST', 'PUT']),
  headers: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string()
    })
  ),
  bodyTemplate: z.string().min(1)
});

const actionConfigSchema = z.discriminatedUnion('actionType', [
  notifyActionSchema,
  assignActionSchema,
  webhookActionSchema
]);

const guardSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('always') }),
  z.object({ type: z.literal('status'), status: z.enum(['success', 'failure']) })
]);

const nodeSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    key: z.string(),
    type: z.literal('trigger'),
    variant: z.enum(['ticket_created', 'sla_breach']),
    name: z.string(),
    description: z.string(),
    config: triggerConfigSchema,
    position: z.object({ x: z.number(), y: z.number() })
  }),
  z.object({
    id: z.string(),
    key: z.string(),
    type: z.literal('condition'),
    variant: z.enum(['priority_check', 'sentiment_check']),
    name: z.string(),
    description: z.string(),
    config: conditionConfigSchema,
    position: z.object({ x: z.number(), y: z.number() })
  }),
  z.object({
    id: z.string(),
    key: z.string(),
    type: z.literal('action'),
    variant: z.enum(['send_email', 'notify_slack', 'assign_owner', 'call_webhook']),
    name: z.string(),
    description: z.string(),
    config: actionConfigSchema,
    position: z.object({ x: z.number(), y: z.number() })
  })
]);

const edgeSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().optional(),
  guard: guardSchema
});

const workflowDefinitionSchema = z.object({
  metadata: z.object({
    name: z.string().min(1),
    description: z.string(),
    status: z.enum(['draft', 'active']),
    organizationId: z.string().uuid()
  }),
  nodes: z.array(nodeSchema).min(1),
  edges: z.array(edgeSchema)
});

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `node-${Math.random().toString(36).slice(2, 10)}`;
};

const deriveKey = (variant: WorkflowNodeVariant): string => `${variant}-${Math.random().toString(36).slice(2, 8)}`;

const paletteDefaultConfig: Record<WorkflowNodeVariant, TriggerConfig | ConditionConfig | ActionConfig> = {
  ticket_created: {
    resource: 'tickets',
    event: 'created',
    filters: [
      {
        field: 'priority',
        operator: 'greater_than',
        value: '0'
      }
    ]
  },
  sla_breach: {
    resource: 'tickets',
    event: 'sla_breached',
    filters: [
      {
        field: 'sla_minutes_remaining',
        operator: 'less_than',
        value: '0'
      }
    ]
  },
  priority_check: {
    logic: 'AND',
    defaultOutcome: 'failure',
    rules: [
      {
        source: 'input',
        field: 'priority',
        operator: 'greater_than',
        value: '3'
      }
    ]
  },
  sentiment_check: {
    logic: 'OR',
    defaultOutcome: 'success',
    rules: [
      {
        source: 'context',
        field: 'sentiment.score',
        operator: 'less_than',
        value: '0.2'
      },
      {
        source: 'context',
        field: 'sentiment.trend',
        operator: 'equals',
        value: 'negative'
      }
    ]
  },
  send_email: {
    actionType: 'notify',
    channel: 'email',
    template: 'Ticket {{ticket_id}} requires attention. Priority: {{priority}}',
    recipients: ['support-leads@example.com']
  },
  notify_slack: {
    actionType: 'notify',
    channel: 'slack',
    template: ':rotating_light: Escalation for ticket {{ticket_id}}',
    recipients: ['https://hooks.slack.com/services/XXXX/YYYY']
  },
  assign_owner: {
    actionType: 'assign',
    queue: 'escalations',
    owner: ''
  },
  call_webhook: {
    actionType: 'webhook',
    url: 'https://example.com/webhooks/triage',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'application/json' }
    ],
    bodyTemplate: '{"ticketId":"{{ticket_id}}","priority":"{{priority}}"}'
  }
};

const ensurePositioned = (nodes: WorkflowNode[]): WorkflowNode[] =>
  nodes.map((node, index) => ({
    ...node,
    position: { x: 0, y: index * 180 }
  }));

const PaletteCard: React.FC<{ item: PaletteItem }> = ({ item }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette-${item.id}`,
    data: { fromPalette: true, item }
  });

  return (
    <div
      ref={setNodeRef}
      className={`palette-item ${item.type}`}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
    >
      <span className="tag">{item.type.toUpperCase()}</span>
      <strong>{item.name}</strong>
      <p style={{ margin: '0.35rem 0', fontSize: '0.85rem' }}>{item.description}</p>
      {item.helperText ? (
        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>{item.helperText}</p>
      ) : null}
    </div>
  );
};

const SortableNodeCard: React.FC<{
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}> = ({ node, isSelected, onSelect, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: node.id,
    data: { fromPalette: false, nodeId: node.id }
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const summary = useMemo(() => {
    if (node.type === 'trigger') {
      const config = node.config as TriggerConfig;
      return `${config.resource}.${config.event} • ${config.filters.length} filter(s)`;
    }
    if (node.type === 'condition') {
      const config = node.config as ConditionConfig;
      return `${config.logic} logic • ${config.rules.length} rule(s)`;
    }
    const config = node.config as ActionConfig;
    switch (config.actionType) {
      case 'notify':
        return `${config.channel} • ${config.recipients.length} recipient(s)`;
      case 'assign':
        return `Queue: ${config.queue}`;
      case 'webhook':
        return `${config.method} ${config.url}`;
      default:
        return '';
    }
  }, [node]);

  return (
    <div
      ref={setNodeRef}
      className={`node-card ${node.type}${isSelected ? ' selected' : ''}`}
      style={style}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <div className="node-actions">
        <button
          type="button"
          aria-label="Duplicate node"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          ✦
        </button>
        <button
          type="button"
          aria-label="Remove node"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          ✕
        </button>
      </div>
      <span className="node-badge">{node.type.toUpperCase()}</span>
      <h3 style={{ margin: '0 0 0.35rem 0' }}>{node.name}</h3>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>{node.description}</p>
      <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.78rem', color: '#0f172a' }}>
        <strong>Key:</strong> {node.key}
      </p>
      <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.78rem', color: '#2563eb' }}>{summary}</p>
    </div>
  );
};

const CanvasDropzone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOver, setNodeRef } = useDroppable({ id: 'canvas-dropzone' });

  return (
    <div ref={setNodeRef} className={`canvas-dropzone${isOver ? ' active' : ''}`}>
      {children}
    </div>
  );
};

const addRule = <TRule extends FilterRule | ConditionRule>(rules: TRule[], defaultRule: TRule): TRule[] => [
  ...rules,
  { ...defaultRule }
];

const WorkflowBuilderApp: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<PaletteItem | WorkflowNode | null>(null);
  const [ruleMeta, setRuleMeta] = useState<RuleMeta>({
    name: 'Priority Escalation Workflow',
    description: 'Auto-escalate urgent tickets and notify stakeholders.',
    status: 'draft',
    organizationId: '00000000-0000-0000-0000-000000000000'
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (!data) {
      return;
    }
    if (data.fromPalette) {
      setActiveDragItem(data.item as PaletteItem);
    } else if (data.nodeId) {
      const node = nodes.find((existing) => existing.id === data.nodeId) || null;
      setActiveDragItem(node);
    }
  }, [nodes]);

  const createNodeFromPalette = useCallback((item: PaletteItem): WorkflowNode => {
    const id = generateId();
    const key = deriveKey(item.variant);
    const base = {
      id,
      key,
      variant: item.variant,
      name: item.name,
      description: item.description,
      position: { x: 0, y: 0 }
    };
    const config = deepClone(paletteDefaultConfig[item.variant]) as TriggerConfig | ConditionConfig | ActionConfig;

    if (item.type === 'trigger') {
      return ensurePositioned([
        {
          ...base,
          type: 'trigger',
          config: config as TriggerConfig
        } as TriggerNode
      ])[0];
    }
    if (item.type === 'condition') {
      return ensurePositioned([
        {
          ...base,
          type: 'condition',
          config: config as ConditionConfig
        } as ConditionNode
      ])[0];
    }
    return ensurePositioned([
      {
        ...base,
        type: 'action',
        config: config as ActionConfig
      } as ActionNode
    ])[0];
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over) {
      return;
    }

    const data = active.data.current;
    if (!data) {
      return;
    }

    if (data.fromPalette && over.id) {
      const newNode = createNodeFromPalette(data.item as PaletteItem);
      setNodes((prev) => ensurePositioned([...prev, newNode]));
      if (nodes.length === 0) {
        setSelectedNodeId(newNode.id);
      }
      return;
    }

    if (!data.fromPalette && over.id && typeof over.id === 'string' && over.id !== active.id) {
      const activeIndex = nodes.findIndex((node) => node.id === active.id);
      const overIndex = nodes.findIndex((node) => node.id === over.id);
      if (activeIndex >= 0 && overIndex >= 0) {
        setNodes((prev) => ensurePositioned(arrayMove(prev, activeIndex, overIndex)));
      }
    }
  }, [createNodeFromPalette, nodes]);

  const handleRemoveNode = useCallback((id: string) => {
    setNodes((prev) => ensurePositioned(prev.filter((node) => node.id !== id)));
    setEdges((prev) => prev.filter((edge) => edge.sourceId !== id && edge.targetId !== id));
    setSelectedNodeId((prev) => (prev === id ? null : prev));
  }, []);

  const updateNode = useCallback((id: string, updater: (node: WorkflowNode) => WorkflowNode) => {
    setNodes((prev) => ensurePositioned(prev.map((node) => (node.id === id ? updater(node) : node))));
  }, []);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);

  const workflowPreview = useMemo(() => {
    const payload = {
      metadata: ruleMeta,
      nodes,
      edges
    };
    const validation = workflowDefinitionSchema.safeParse(payload);
    return {
      definition: payload,
      errors: validation.success ? null : validation.error.format()
    };
  }, [edges, nodes, ruleMeta]);

  const addConnection = useCallback(() => {
    if (!selectedNode) {
      return;
    }
    const candidate = nodes.find((node) => node.id !== selectedNode.id);
    if (!candidate) {
      return;
    }
    const newEdge: WorkflowEdge = {
      id: generateId(),
      sourceId: selectedNode.id,
      targetId: candidate.id,
      guard: { type: 'always' }
    };
    setEdges((prev) => [...prev, newEdge]);
  }, [nodes, selectedNode]);

  const updateEdge = useCallback((edgeId: string, partial: Partial<WorkflowEdge>) => {
    setEdges((prev) => prev.map((edge) => (edge.id === edgeId ? { ...edge, ...partial } : edge)));
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
  }, []);

  const outgoingEdges = useMemo(
    () => (selectedNode ? edges.filter((edge) => edge.sourceId === selectedNode.id) : []),
    [edges, selectedNode]
  );

  return (
    <div className="workflow-builder">
      <aside className="workflow-panel" aria-label="Workflow palette">
        <h2>Workflow Building Blocks</h2>
        {(['trigger', 'condition', 'action'] as PaletteCategory[]).map((category) => (
          <section key={category} className="palette-section">
            <h3 style={{ marginBottom: '0.6rem' }}>{category.toUpperCase()}</h3>
            <div className="palette-list">
              {palette
                .filter((item) => item.type === category)
                .map((item) => (
                  <PaletteCard key={item.id} item={item} />
                ))}
            </div>
          </section>
        ))}
      </aside>

      <main className="builder-canvas">
        <header className="canvas-header">
          <div>
            <h1>{ruleMeta.name}</h1>
            <p style={{ margin: 0, color: '#475569' }}>{ruleMeta.description}</p>
          </div>
          <div className="canvas-actions">
            <button
              type="button"
              onClick={() =>
                setRuleMeta((prev) => ({
                  ...prev,
                  status: prev.status === 'draft' ? 'active' : 'draft'
                }))
              }
            >
              Toggle Status ({ruleMeta.status})
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  void navigator.clipboard
                    .writeText(JSON.stringify(workflowPreview.definition, null, 2))
                    .catch(() => window.alert('Unable to copy definition to clipboard in this browser.'));
                } else {
                  window.alert('Clipboard API is unavailable in this browser.');
                }
              }}
            >
              Copy Definition
            </button>
          </div>
        </header>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <CanvasDropzone>
            {nodes.length === 0 ? (
              <div className="canvas-placeholder">
                Drag triggers, conditions, or actions here to compose your workflow.
              </div>
            ) : (
              <SortableContext items={nodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
                {nodes.map((node) => (
                  <SortableNodeCard
                    key={node.id}
                    node={node}
                    isSelected={node.id === selectedNodeId}
                    onSelect={() => setSelectedNodeId(node.id)}
                    onRemove={() => handleRemoveNode(node.id)}
                  />
                ))}
              </SortableContext>
            )}
          </CanvasDropzone>
          <DragOverlay>
            {activeDragItem && 'variant' in activeDragItem ? (
              <div className="palette-item">
                <span className="tag">{activeDragItem.type.toUpperCase()}</span>
                <strong>{activeDragItem.name}</strong>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <aside className="editor-panel" aria-label="Node configuration">
        <h3>Rule Metadata</h3>
        <fieldset>
          <legend>Details</legend>
          <label htmlFor="rule-name">Name</label>
          <input
            id="rule-name"
            value={ruleMeta.name}
            onChange={(event) => setRuleMeta((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Workflow name"
          />
          <label htmlFor="rule-description" style={{ marginTop: '0.75rem' }}>
            Description
          </label>
          <textarea
            id="rule-description"
            value={ruleMeta.description}
            onChange={(event) => setRuleMeta((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Describe the workflow intent"
          />
          <label htmlFor="rule-organization" style={{ marginTop: '0.75rem' }}>
            Organization ID
          </label>
          <input
            id="rule-organization"
            value={ruleMeta.organizationId}
            onChange={(event) => setRuleMeta((prev) => ({ ...prev, organizationId: event.target.value }))}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </fieldset>

        {selectedNode ? (
          <>
            <h3>Node Configuration</h3>
            <fieldset>
              <legend>Basics</legend>
              <label htmlFor="node-name">Display name</label>
              <input
                id="node-name"
                value={selectedNode.name}
                onChange={(event) =>
                  updateNode(selectedNode.id, (node) => ({
                    ...node,
                    name: event.target.value
                  }))
                }
              />
              <label htmlFor="node-description" style={{ marginTop: '0.75rem' }}>
                Description
              </label>
              <textarea
                id="node-description"
                value={selectedNode.description}
                onChange={(event) =>
                  updateNode(selectedNode.id, (node) => ({
                    ...node,
                    description: event.target.value
                  }))
                }
              />
            </fieldset>

            {selectedNode.type === 'trigger' ? (
              <TriggerConfigEditor node={selectedNode as TriggerNode} updateNode={updateNode} />
            ) : null}
            {selectedNode.type === 'condition' ? (
              <ConditionConfigEditor node={selectedNode as ConditionNode} updateNode={updateNode} />
            ) : null}
            {selectedNode.type === 'action' ? (
              <ActionConfigEditor node={selectedNode as ActionNode} updateNode={updateNode} />
            ) : null}

            <h3>Connections</h3>
            <button type="button" onClick={addConnection} disabled={nodes.length <= 1}>
              Add connection
            </button>
            <div className="connection-list">
              {outgoingEdges.map((edge) => (
                <div key={edge.id} className="connection-card">
                  <label>Target node</label>
                  <select
                    value={edge.targetId}
                    onChange={(event) => updateEdge(edge.id, { targetId: event.target.value })}
                  >
                    {nodes
                      .filter((candidate) => candidate.id !== selectedNode.id)
                      .map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </option>
                      ))}
                  </select>
                  <label style={{ marginTop: '0.5rem' }}>Guard condition</label>
                  <select
                    value={JSON.stringify(edge.guard)}
                    onChange={(event) => {
                      const parsed = JSON.parse(event.target.value) as EdgeGuard;
                      updateEdge(edge.id, { guard: parsed });
                    }}
                  >
                    {guardOptions.map((option) => (
                      <option key={option.label} value={JSON.stringify(option.guard)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <label style={{ marginTop: '0.5rem' }}>Label</label>
                  <input
                    value={edge.label ?? ''}
                    onChange={(event) => updateEdge(edge.id, { label: event.target.value })}
                    placeholder="Optional label"
                  />
                  <button
                    type="button"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => removeEdge(edge.id)}
                  >
                    Remove connection
                  </button>
                </div>
              ))}
              {outgoingEdges.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  No outgoing connections configured yet.
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <p style={{ color: '#64748b' }}>Select a node to configure triggers, conditions, and actions.</p>
        )}

        <h3>Definition Preview</h3>
        <div className="rule-preview" role="region" aria-live="polite">
          <pre>{JSON.stringify(workflowPreview.definition, null, 2)}</pre>
        </div>
        {workflowPreview.errors ? (
          <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>Fix validation issues before activating this rule.</p>
        ) : (
          <p style={{ color: '#16a34a', fontSize: '0.85rem' }}>Definition passes structural validation.</p>
        )}
      </aside>
    </div>
  );
};

type NodeUpdater = (id: string, updater: (node: WorkflowNode) => WorkflowNode) => void;

const TriggerConfigEditor: React.FC<{ node: TriggerNode; updateNode: NodeUpdater }> = ({ node, updateNode }) => {
  const config = node.config;
  const applyUpdate = (mutator: (current: TriggerConfig) => TriggerConfig) => {
    updateNode(node.id, (current) => {
      if (current.type !== 'trigger') {
        return current;
      }
      return {
        ...current,
        config: mutator(current.config)
      };
    });
  };
  return (
    <fieldset>
      <legend>Trigger configuration</legend>
      <label htmlFor="trigger-resource">Resource</label>
      <input
        id="trigger-resource"
        value={config.resource}
        onChange={(event) => applyUpdate((current) => ({ ...current, resource: event.target.value }))}
      />
      <label htmlFor="trigger-event" style={{ marginTop: '0.75rem' }}>
        Event
      </label>
      <input
        id="trigger-event"
        value={config.event}
        onChange={(event) => applyUpdate((current) => ({ ...current, event: event.target.value }))}
      />
      <label style={{ marginTop: '0.75rem' }}>Filters</label>
      {config.filters.map((filter, index) => (
        <div key={index} style={{ marginBottom: '0.75rem' }}>
          <input
            value={filter.field}
            onChange={(event) => {
              applyUpdate((current) => ({
                ...current,
                filters: current.filters.map((existing, filterIndex) =>
                  filterIndex === index ? { ...existing, field: event.target.value } : existing
                )
              }));
            }}
            placeholder="Field"
          />
          <select
            style={{ marginTop: '0.4rem', width: '100%' }}
            value={filter.operator}
            onChange={(event) => {
              applyUpdate((current) => ({
                ...current,
                filters: current.filters.map((existing, filterIndex) =>
                  filterIndex === index
                    ? { ...existing, operator: event.target.value as ComparisonOperator }
                    : existing
                )
              }));
            }}
          >
            {['equals', 'not_equals', 'contains', 'greater_than', 'less_than'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            style={{ marginTop: '0.4rem' }}
            value={filter.value}
            onChange={(event) => {
              applyUpdate((current) => ({
                ...current,
                filters: current.filters.map((existing, filterIndex) =>
                  filterIndex === index ? { ...existing, value: event.target.value } : existing
                )
              }));
            }}
            placeholder="Value"
          />
          <button
            type="button"
            style={{ marginTop: '0.35rem' }}
            onClick={() =>
              applyUpdate((current) => ({
                ...current,
                filters: current.filters.filter((_, filterIndex) => filterIndex !== index)
              }))
            }
            disabled={config.filters.length === 1}
          >
            Remove filter
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          applyUpdate((current) => ({
            ...current,
            filters: addRule(current.filters, {
              field: 'status',
              operator: 'equals',
              value: 'open'
            })
          }))
        }
      >
        Add filter
      </button>
    </fieldset>
  );
};

const ConditionConfigEditor: React.FC<{ node: ConditionNode; updateNode: NodeUpdater }> = ({ node, updateNode }) => {
  const config = node.config;
  const applyUpdate = (mutator: (current: ConditionConfig) => ConditionConfig) => {
    updateNode(node.id, (current) => {
      if (current.type !== 'condition') {
        return current;
      }
      return {
        ...current,
        config: mutator(current.config)
      };
    });
  };
  return (
    <fieldset>
      <legend>Condition logic</legend>
      <label>Boolean logic</label>
      <select
        value={config.logic}
        onChange={(event) => applyUpdate((current) => ({ ...current, logic: event.target.value as 'AND' | 'OR' }))}
      >
        <option value="AND">AND (all must pass)</option>
        <option value="OR">OR (any may pass)</option>
      </select>
      <label style={{ marginTop: '0.75rem' }}>Default outcome</label>
      <select
        value={config.defaultOutcome}
        onChange={(event) =>
          applyUpdate((current) => ({ ...current, defaultOutcome: event.target.value as GuardStatus }))
        }
      >
        <option value="success">Success</option>
        <option value="failure">Failure</option>
      </select>
      <label style={{ marginTop: '0.75rem' }}>Rules</label>
      {config.rules.map((rule, index) => (
        <div key={index} style={{ marginBottom: '0.75rem' }}>
          <select
            value={rule.source}
            onChange={(event) => {
              applyUpdate((current) => ({
                ...current,
                rules: current.rules.map((existing, ruleIndex) =>
                  ruleIndex === index ? { ...existing, source: event.target.value as RuleSource } : existing
                )
              }));
            }}
          >
            <option value="input">Workflow input</option>
            <option value="context">Execution context</option>
          </select>
          <input
            style={{ marginTop: '0.4rem' }}
            value={rule.field}
            onChange={(event) => {
              applyUpdate((current) => ({
                ...current,
                rules: current.rules.map((existing, ruleIndex) =>
                  ruleIndex === index ? { ...existing, field: event.target.value } : existing
                )
              }));
            }}
            placeholder="Field path"
          />
          <select
            style={{ marginTop: '0.4rem', width: '100%' }}
            value={rule.operator}
            onChange={(event) => {
              applyUpdate((current) => ({
                ...current,
                rules: current.rules.map((existing, ruleIndex) =>
                  ruleIndex === index
                    ? { ...existing, operator: event.target.value as ComparisonOperator }
                    : existing
                )
              }));
            }}
          >
            {['equals', 'not_equals', 'contains', 'greater_than', 'less_than'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            style={{ marginTop: '0.4rem' }}
            value={rule.value}
            onChange={(event) => {
              applyUpdate((current) => ({
                ...current,
                rules: current.rules.map((existing, ruleIndex) =>
                  ruleIndex === index ? { ...existing, value: event.target.value } : existing
                )
              }));
            }}
            placeholder="Expected value"
          />
          <button
            type="button"
            style={{ marginTop: '0.35rem' }}
            onClick={() =>
              applyUpdate((current) => ({
                ...current,
                rules: current.rules.filter((_, ruleIndex) => ruleIndex !== index)
              }))
            }
            disabled={config.rules.length === 1}
          >
            Remove rule
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          applyUpdate((current) => ({
            ...current,
            rules: addRule(current.rules, {
              source: 'input',
              field: 'status',
              operator: 'equals',
              value: 'open'
            })
          }))
        }
      >
        Add rule
      </button>
    </fieldset>
  );
};

const ActionConfigEditor: React.FC<{ node: ActionNode; updateNode: NodeUpdater }> = ({ node, updateNode }) => {
  const config = node.config;
  const applyUpdate = (mutator: (current: ActionConfig) => ActionConfig) => {
    updateNode(node.id, (current) => {
      if (current.type !== 'action') {
        return current;
      }
      return {
        ...current,
        config: mutator(current.config)
      };
    });
  };

  if (config.actionType === 'notify') {
    const updateNotify = (mutator: (current: NotifyActionConfig) => NotifyActionConfig) => {
      applyUpdate((current) => (current.actionType === 'notify' ? mutator(current) : current));
    };
    return (
      <fieldset>
        <legend>Notification</legend>
        <label>Channel</label>
        <select
          value={config.channel}
          onChange={(event) =>
            updateNotify((current) => ({ ...current, channel: event.target.value as 'email' | 'slack' }))
          }
        >
          <option value="email">Email</option>
          <option value="slack">Slack</option>
        </select>
        <label style={{ marginTop: '0.75rem' }}>Template</label>
        <textarea
          value={config.template}
          onChange={(event) => updateNotify((current) => ({ ...current, template: event.target.value }))}
        />
        <label style={{ marginTop: '0.75rem' }}>Recipients</label>
        {config.recipients.map((recipient, index) => (
          <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              value={recipient}
              onChange={(event) => {
                updateNotify((current) => ({
                  ...current,
                  recipients: current.recipients.map((value, recipientIndex) =>
                    recipientIndex === index ? event.target.value : value
                  )
                }));
              }}
              placeholder={config.channel === 'email' ? 'name@example.com' : 'https://hooks.slack.com/...'}
            />
            <button
              type="button"
              onClick={() =>
                updateNotify((current) => ({
                  ...current,
                  recipients: current.recipients.filter((_, recipientIndex) => recipientIndex !== index)
                }))
              }
              disabled={config.recipients.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            updateNotify((current) => ({
              ...current,
              recipients: [...current.recipients, '']
            }))
          }
        >
          Add recipient
        </button>
      </fieldset>
    );
  }

  if (config.actionType === 'assign') {
    const updateAssign = (mutator: (current: AssignActionConfig) => AssignActionConfig) => {
      applyUpdate((current) => (current.actionType === 'assign' ? mutator(current) : current));
    };
    return (
      <fieldset>
        <legend>Assignment</legend>
        <label>Queue</label>
        <input
          value={config.queue}
          onChange={(event) => updateAssign((current) => ({ ...current, queue: event.target.value }))}
        />
        <label style={{ marginTop: '0.75rem' }}>Owner (optional)</label>
        <input
          value={config.owner ?? ''}
          onChange={(event) => updateAssign((current) => ({ ...current, owner: event.target.value }))}
          placeholder="CSR email or ID"
        />
      </fieldset>
    );
  }

  const updateWebhook = (mutator: (current: WebhookActionConfig) => WebhookActionConfig) => {
    applyUpdate((current) => (current.actionType === 'webhook' ? mutator(current) : current));
  };

  return (
    <fieldset>
      <legend>Webhook</legend>
      <label>URL</label>
      <input
        value={config.url}
        onChange={(event) => updateWebhook((current) => ({ ...current, url: event.target.value }))}
        placeholder="https://example.com/webhook"
      />
      <label style={{ marginTop: '0.75rem' }}>Method</label>
      <select
        value={config.method}
        onChange={(event) => updateWebhook((current) => ({ ...current, method: event.target.value as 'POST' | 'PUT' }))}
      >
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
      </select>
      <label style={{ marginTop: '0.75rem' }}>Headers</label>
      {config.headers.map((header, index) => (
        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            value={header.key}
            onChange={(event) => {
              updateWebhook((current) => ({
                ...current,
                headers: current.headers.map((existing, headerIndex) =>
                  headerIndex === index ? { ...existing, key: event.target.value } : existing
                )
              }));
            }}
            placeholder="Header key"
          />
          <input
            value={header.value}
            onChange={(event) => {
              updateWebhook((current) => ({
                ...current,
                headers: current.headers.map((existing, headerIndex) =>
                  headerIndex === index ? { ...existing, value: event.target.value } : existing
                )
              }));
            }}
            placeholder="Header value"
          />
          <button
            type="button"
            onClick={() =>
              updateWebhook((current) => ({
                ...current,
                headers: current.headers.filter((_, headerIndex) => headerIndex !== index)
              }))
            }
            disabled={config.headers.length === 1}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          updateWebhook((current) => ({
            ...current,
            headers: [...current.headers, { key: '', value: '' }]
          }))
        }
      >
        Add header
      </button>
      <label style={{ marginTop: '0.75rem' }}>Body template</label>
      <textarea
        value={config.bodyTemplate}
        onChange={(event) => updateWebhook((current) => ({ ...current, bodyTemplate: event.target.value }))}
      />
    </fieldset>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Workflow builder root container is missing');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <WorkflowBuilderApp />
  </React.StrictMode>
);
