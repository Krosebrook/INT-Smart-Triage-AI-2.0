# Agent Runtime Integration Guide

The agent runtime bridges repository-defined agents with the external agent dashboard and automation services you mentioned. It loads the canonical registry (`agents/registry.json`), maintains state in `agents/runtime-state.json`, and emits status changes through optional connectors.

## Core Pieces

- `src/agents/runtime.js` — Event-driven manager that updates state, persists status, and calls connectors.
- `src/agents/connectors/dashboardConnector.js` — Posts status transitions to `AGENT_DASH_WEBHOOK` (Bearer token optional via `AGENT_DASH_TOKEN`).
- `src/agents/connectors/automationConnector.js` — Notifies automation apps via `AUTOMATION_API_URL`/`AUTOMATION_API_TOKEN`.
- `scripts/agents-runtime.js` — CLI for status inspection and manual activation/deactivation/flagging.

## Environment Configuration

```
AGENT_DASH_WEBHOOK=https://your-dashboard.example.com/hooks/agent-status
AGENT_DASH_TOKEN=optional-bearer-token
AUTOMATION_API_URL=https://automation.example.com/api/agent-events
AUTOMATION_API_TOKEN=automation-secret
```

Set these locally (e.g., `.env.local`) and in CI/CD so every status change is relayed. Use `.env.agent.example` as a starting template.

## Common Workflows

- List agents: `npm run agents:status`
- Activate an agent: `npm run agents:activate -- --agent automation-ops --trigger deploy`
- Deactivate an agent: `npm run agents:deactivate -- --agent automation-ops --notes "maintenance window"`
- Flag for attention: `npm run agents:flag -- --agent governance-auditor --notes "awaiting gate evidence"`

Each command updates `runtime-state.json` and dispatches the payload to both connectors (if configured). Your external dashboard and automation apps can rely on this stream to know when agents should be considered live or paused.

## Orchestrator Runtime

- Start orchestrator: `npm run agents:orchestrate`
- The orchestrator listens for status changes and starts/stops agent-specific handlers (`src/agents/orchestrator.js`).
- Handlers live in `src/agents/handlers/`; customize them to connect planner loops, routing logic, or automation routines.
- Automation handler reads `AUTOMATION_VALIDATE_COMMAND` and `AUTOMATION_VALIDATE_INTERVAL_MS` to schedule routine tasks (defaults provided in `.env.agent.example`).

## Next Steps

Hook your planner loop, tool adapters, and schedulers into the runtime by subscribing to the `statusChanged` event exported in `AgentRuntime`. For long-running services, instantiate the runtime once during startup and react to `active`/`inactive` transitions to start or stop autonomous behaviors.
