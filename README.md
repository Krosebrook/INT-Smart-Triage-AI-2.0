# INT Smart Triage AI 2.0

Enterprise-grade AI workflow that triages inbound customer tickets, guides CSR responses, and maintains full auditability across the stack. Built for security-first deployments on Vercel with Supabase as the system of record.

---

## 1. Product Highlights

- Automated ticket classification with confidence scoring and sentiment tagging
- CSR guidance: empathetic response prompts, KB article surfacing, and escalation hints
- Full audit trail (per ticket, per tool call) backed by Supabase with enforced Row Level Security
- Real-time analytics for workload, SLA burn-down, and agent efficiency
- Hardened serverless deployment with zero direct client access to protected data

---

## 2. Architecture at a Glance

- **Frontend**: Vite + vanilla JS client served as a CSR dashboard (`index.html`, `src/`)
- **APIs**: Vercel serverless functions (`api/`) acting as the secure boundary to Supabase
- **Data**: Supabase Postgres with RLS policies, migrations in `supabase/`
- **AI Services**: Modular services in `src/` orchestrating ticket analysis, communication, routing, and knowledge retrieval
- **Infrastructure**: Vercel for hosting, CI/CD, secrets; Supabase for database and auth
- **Observability**: Structured logs via Vercel, Supabase audit tables, optional dashboards described in `docs/OPERATIONS.md`

For a detailed component breakdown see `docs/ARCHITECTURE.md`.

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
- `OPENAI_API_KEY` (if agentic enhancements are enabled)

Store secrets in Vercel or local `.env` (never commit).

---

## 4. Local Development

### 4.1 Prerequisites

- Node.js 18+
- npm 9+ (pnpm/yarn supported but scripts use npm)
- Supabase project (dev tier)

### 4.2 First-Time Setup

```bash
npm install
npm run husky install # optional if git hooks desired
```

### 4.3 Running Locally

```bash
npm run dev
```

Access the CSR dashboard at `http://localhost:5173`.

### 4.4 Linting & Formatting

```bash
npm run lint       # eslint
npm run format     # prettier write
npm run validate   # format:check + lint + test + build
```

### 4.5 Testing

```bash
npm test                # node --test suite
npm run test:coverage   # generates ./coverage and lcov report
```

Coverage thresholds enforced at ≥70% branches/functions/lines (`npm run test:coverage-check`).

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

- `BUILD_FIXED.md`, `BOLT_NEW_FIX.md`, `FEATURES_ADDED.md`
- Weekly snapshots in `WEEK_2_COMPLETE.md` and `WORKING_NOW.md`

For new releases, append a summary to `FEATURES_ADDED.md` and link back to the relevant governance gate approvals.

---

## 12. License

MIT License © INT Inc.
