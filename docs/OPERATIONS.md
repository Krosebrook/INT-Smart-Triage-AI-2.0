# Operations Runbook

Guidance for keeping INT Smart Triage AI 2.0 healthy in production. Covers SLOs, monitoring, incident response, maintenance routines, and compliance touchpoints.

## 1. Service Level Objectives

| Metric                                  | Target               | Alert Threshold   | Source                           |
| --------------------------------------- | -------------------- | ----------------- | -------------------------------- |
| API success rate (`/api/triage-report`) | ≥ 99.5% over 30 days | 99% over 1 hour   | Vercel function metrics          |
| P95 triage latency                      | ≤ 2.0s               | ≥ 2.5s for 10 min | Vercel, Supabase query inspector |
| Ticket ingestion-to-assignment          | ≤ 15s                | ≥ 20s for 10 min  | Supabase `reports` timestamps    |
| Supabase replication lag                | ≤ 5s                 | ≥ 10s             | Supabase status dashboard        |

## 2. Monitoring & Dashboards

- **Application logs**: Vercel dashboard → Logs → filter `api/triage-report`. Export to SIEM daily.
- **Database observability**: Supabase → Logs → `reports` table; monitor RLS denials.
- **Analytics dashboards**: `public/analytics.html` served via CDN for internal analytics, with metrics fed by Supabase views.
- **Alerting**: Integrate Vercel webhooks + Supabase webhooks to PagerDuty channel `cs-triage`.

## 3. Incident Response

1. **Detect**: Alert fired or CSR reports failure.
2. **Acknowledge**: On-call DevOps engineer (rotation in Ops calendar) responds in ≤5 min.
3. **Mitigate**:
   - Check Vercel status, redeploy latest green build if function corrupted.
   - Use `docs/agent-change-management-playbook.md` G7 runbook to pause agent flows (`/api/triage-report` feature flag) if outputs unsafe.
   - Roll back via `vercel rollback <deployment-id>`.
4. **Comms**: Update #ai-triage-ops channel every 15 min; escalate to Safety Review Board if customer-impacting >30 min.
5. **Post-incident**: File RCA in `docs/incidents/<YYYY-MM-DD>-<slug>.md`, update mitigation items in `WORKING_NOW.md`.

## 4. Scheduled Maintenance

| Cadence   | Task                                             | Owner              | Notes                                              |
| --------- | ------------------------------------------------ | ------------------ | -------------------------------------------------- |
| Weekly    | Review Supabase slow query log, optimize indexes | MLOps Lead         | Log actions in `FEATURES_ADDED.md` if code changes |
| Weekly    | Sample 10 agent traces for hallucination review  | AI Quality Lead    | Record finding in governance tracker               |
| Bi-weekly | Validate backups & restore dr plan               | DevOps Lead        | Test `reports` table restore into staging          |
| Monthly   | Update knowledge base embeddings                 | Knowledge Ops      | Script lives in `generate_kb_articles.py`          |
| Quarterly | Governance board review                          | Safety Board Chair | Agenda in `agent-change-management-playbook.md`    |

## 5. Change Management Touchpoints

- Before any production deploy, confirm `docs/agent-governance-owner-acknowledgements.md` is up to date.
- Use outreach template in `agent-governance-communication-template.md` for owner confirmations.
- Upload new artifacts to `docs/governance-pre-read/` and notify board.

## 6. Data Retention & Privacy

- Customer tickets retained 24 months. Use Supabase retention policy `reports_retention` job (see migrations).
- Audit logs stored indefinitely per compliance; export monthly to secure object storage.
- Redact PII before shipping logs off platform.

## 7. Runbooks

- **Pause agent loop**: Toggle `AGENT_ENABLED=false` env (requires redeploy) or apply Supabase feature flag row.
- **Force manual triage**: Direct CSRs to fallback queue UI; disable auto-assign in `src/assignmentEngine.js` via feature flag.
- **Rebuild embeddings**: Run `npm run generate-kb-updates` (see KB playbook) and redeploy.

## 8. Onboarding Checklist for Operators

- Gain access to Vercel, Supabase, PagerDuty.
- Read `README.md` sections 6–8.
- Complete tabletop incident drill using this document.

## 9. Change Log

- 16 Oct 2025: Initial operations runbook drafted (Codex agent).
