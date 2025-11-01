# INT Smart Triage AI 2.0

Enterprise-grade AI workflow that triages inbound customer tickets, guides CSR responses, and maintains full auditability across the stack. Built for security-first deployments on Vercel with Supabase as the system of record.

---

## 1. Product Highlights

- Automated ticket classification with confidence scoring and sentiment tagging
- CSR guidance: empathetic response prompts, KB article surfacing, and escalation hints
- Full audit trail (per ticket, per tool call) backed by Supabase with enforced Row Level Security
- Real-time analytics and collaboration with WebSocket-based live updates
- Multi-channel communication hub integrating email, Freshdesk, HubSpot, and Microsoft Teams
- Intelligent auto-assignment engine balancing workload and expertise
- Progressive Web App (PWA) with offline capabilities for uninterrupted CSR workflows
- Advanced sentiment analysis with real-time scoring and escalation triggers
- Comprehensive customer profiles with 360-degree history and context
- Agent orchestration system with runtime management and external integrations
- Hardened serverless deployment with zero direct client access to protected data

---

## 2. Architecture at a Glance

- **Frontend**: Vite + vanilla JS client served as a CSR dashboard (`index.html`, `src/`)
- **APIs**: Vercel serverless functions (`api/`) acting as the secure boundary to Supabase
- **Data**: Supabase Postgres with RLS policies, migrations in `supabase/`
- **AI Services**: Modular services in `src/` orchestrating ticket analysis, communication, routing, and knowledge retrieval
- **Agent Runtime**: Dynamic orchestration system for autonomous agents (`src/agents/`) with external integration hooks
- **Infrastructure**: Vercel for hosting, CI/CD, secrets; Supabase for database and auth
- **Observability**: Structured logs via Vercel, Supabase audit tables, optional dashboards described in `docs/OPERATIONS.md`

### Key Features

- **Real-time Collaboration**: WebSocket-based updates, presence tracking, and live ticket changes
- **Advanced Analytics**: Comprehensive dashboards for workload, SLA, and agent efficiency
- **Knowledge Base Search**: Intelligent article surfacing integrated with ticket context
- **Multi-Channel Communication**: Email service, communication hub, and integration with Freshdesk/HubSpot
- **Auto-Assignment Engine**: Smart ticket routing based on workload and expertise
- **Customer Profiles**: 360-degree customer view with history and context
- **Sentiment Analysis**: Real-time sentiment scoring and escalation triggers
- **Progressive Web App**: Offline-capable CSR dashboard with responsive design
- **Comprehensive Reporting**: Export, analytics, and audit trail for compliance
- **Agent Orchestration**: Runtime management of autonomous agents with external dashboards

For a detailed component breakdown see `docs/ARCHITECTURE.md` and `FEATURES_ADDED.md`.

---

## 3. Environment Matrix

| Environment | Purpose            | Deployment                 | Notes                                                                                |
| ----------- | ------------------ | -------------------------- | ------------------------------------------------------------------------------------ |
| Local       | Developer sandbox  | `npm run dev`              | Uses local `.env` (see below). Supabase keys should target a non-production project. |
| Preview     | Feature validation | Vercel preview deployments | Pull requests auto-deploy; limited to QA data set.                                   |
| Production  | Customer-facing    | `npm run deploy`           | Requires governance approval per `docs/agent-change-management-playbook.md`.         |

Required secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (client-side access with RLS protection)

Optional integrations:

- `HUBSPOT_ACCESS_TOKEN` / `HUBSPOT_PORTAL_ID` — HubSpot CRM integration
- `FRESHDESK_DOMAIN` / `FRESHDESK_API_KEY` — Freshdesk help desk integration
- `TEAMS_WEBHOOK_URL` — Microsoft Teams notifications
- `SENDGRID_API_KEY` — Email service integration
- `SLACK_WEBHOOK_URL` / `SLACK_BOT_TOKEN` — Slack integration (optional)

Optional agent runtime integrations:

- `AGENT_DASH_WEBHOOK` / `AGENT_DASH_TOKEN` — External dashboard for agent status
- `AUTOMATION_API_URL` / `AUTOMATION_API_TOKEN` — Automation service integration
- `AUTOMATION_VALIDATE_COMMAND` — Command to execute during automation cycles
- `AUTOMATION_VALIDATE_INTERVAL_MS` — Interval between automation runs

Store secrets in Vercel or local `.env` (never commit). See `.env.example` and `.env.agent.example` for templates.

---

## 4. Local Development

### 4.1 Quick Start

For first-time setup:

```bash
# 1. Clone the repository
git clone https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0.git
cd INT-Smart-Triage-AI-2.0

# 2. Install dependencies
npm install

# 3. Copy environment template and configure
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. (Optional) Set up agent runtime
cp .env.agent.example .env.local
# Configure agent dashboard and automation webhooks

# 5. Start development server
npm run dev
```

Access the CSR dashboard at `http://localhost:5173`.

### 4.2 Prerequisites

- Node.js 18+
- npm 9+ (pnpm/yarn supported but scripts use npm)
- Supabase project (dev tier)

### 4.3 First-Time Setup

```bash
npm install
npm run husky install # optional if git hooks desired
```

### 4.4 Running Locally

```bash
npm run dev
```

Access the CSR dashboard at `http://localhost:5173`.

### 4.5 Linting & Formatting

```bash
npm run lint       # eslint
npm run format     # prettier write
npm run validate   # format:check + lint + test + build
```

### 4.6 Import Validation

After importing data batches (KB articles, customer data, etc.), validate the codebase:

```bash
npm run validate:imports  # comprehensive validation workflow
```

This command:

1. Validates project structure
2. Installs/updates dependencies
3. Checks code formatting
4. Runs linter
5. Executes all tests
6. Performs production build

For detailed guidance, see [`docs/IMPORT_VALIDATION.md`](docs/IMPORT_VALIDATION.md).

### 4.7 Testing

```bash
npm test                # node --test suite
npm run test:coverage   # generates ./coverage and lcov report
```

Coverage thresholds enforced at ≥70% branches/functions/lines (`npm run test:coverage-check`).

### 4.8 Agent Runtime Management

The agent runtime system enables dynamic control of autonomous agents:

```bash
npm run agents:status             # list all registered agents
npm run agents:status -- --json   # get JSON output
npm run agents:activate -- --agent <id> --trigger <reason>
npm run agents:deactivate -- --agent <id> --notes <reason>
npm run agents:flag -- --agent <id> --notes <message>
npm run agents:orchestrate        # start long-running orchestrator
```

Agents are defined in `agents/registry.json` with runtime state tracked in `agents/runtime-state.json`. Status changes are broadcast to external dashboards and automation services when configured. See `docs/agent-runtime.md` for details.

---

## 5. Database & Supabase

1. Execute `supabase-setup.sql` in the Supabase SQL editor.
2. Apply migrations in `supabase/migrations/` (timestamped). Migrations are idempotent.
3. Provision service role key with RLS enabled; never expose to client code.

Indices, constraints, and policies are documented inline within the SQL files. Review `docs/SERVICES.md` for how services interact with the schema.

---

## 6. Build & Deployment

### 6.1 Build

```bash
npm run build   # Vite production build into ./dist
npm run preview # serve build locally
```

### 6.2 Deploy

```bash
npm run deploy  # vercel --prod
```

Deployment gating requires:

- Green `npm run validate`
- Updated `docs/agent-governance-owner-acknowledgements.md`
- Governance board approval (see `docs/agent-change-management-playbook.md`)

For rollback, use Vercel deployments dashboard or `vercel rollback <deployment-id>`.

---

## 7. Operations & Monitoring

Refer to `docs/OPERATIONS.md` for:

- Runbooks (incident response, pause/resume agent flows)
- Observability dashboards and log queries
- SLOs/SLIs and alert thresholds
- Data retention and backup policy

Supabase and Vercel logs should be exported to your SIEM per compliance requirements.

---

## 8. Security & Compliance

- All database access occurs through serverless functions with service role credentials
- RLS and policy enforcement validated by `/api/health-check`
- Secrets managed via Vercel encrypted store and local `.env` (excluded via `.gitignore`)
- Change approvals governed in `docs/agent-change-management-playbook.md`
- Owner acknowledgements tracked in `docs/agent-governance-owner-acknowledgements.md`

---

## 9. Documentation Map

| Topic                                       | Location                                          |
| ------------------------------------------- | ------------------------------------------------- |
| Architecture deep dive                      | `docs/ARCHITECTURE.md`                            |
| Frontend flows & UI states                  | `docs/FRONTEND.md`                                |
| Service layer (AI, routing, KB, comms)      | `docs/SERVICES.md`                                |
| API reference                               | `docs/API_REFERENCE.md`                           |
| Agent runtime integration & orchestration   | `docs/agent-runtime.md`                           |
| Agent governance & best practices           | `agents.md` / `claude.md`                         |
| Change management gates                     | `docs/agent-change-management-playbook.md`        |
| Owner acknowledgements & pre-read checklist | `docs/agent-governance-owner-acknowledgements.md` |
| Operations runbook                          | `docs/OPERATIONS.md`                              |

A high-level documentation index lives at `docs/README.md`.

---

## 10. Support & Contacts

- **AI Program Manager**: Drives governance cadence and owner coordination
- **Feature Squad Engineering Manager**: Owns build/integration gating
- **Safety Review Board Chair**: Final authority on production promotion

Escalations follow the incident playbook in `docs/OPERATIONS.md` with paging via the on-call rotation.

---

## 11. Changelog & Release Notes

Product-level milestones are captured in:

- `FEATURES_ADDED.md` — Documentation of 10 advanced features added to the platform
- `ROADMAP_SUMMARY.md` — 50-feature roadmap across 5 phases (18 months)
- `BUILD_FIXED.md`, `BOLT_NEW_FIX.md` — Build and deployment improvements
- Weekly snapshots in `WEEK_2_COMPLETE.md` and `WORKING_NOW.md`

**Recent Additions:**

- Real-time collaboration system with presence tracking
- Advanced analytics dashboard with comprehensive metrics
- Knowledge base search and intelligent article surfacing
- Multi-channel communication hub (Email, Freshdesk, HubSpot, Teams)
- Auto-assignment engine with smart routing
- Customer profile service with 360-degree view
- Sentiment analysis with real-time scoring
- Progressive Web App with offline capabilities
- Comprehensive reporting and export features
- Agent orchestration runtime with external integrations

For new releases, append a summary to `FEATURES_ADDED.md` and link back to the relevant governance gate approvals.

---

## 12. License

MIT License © INT Inc.
