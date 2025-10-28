# Agent Bios

## Automation Operations Agent (codename: "Autopilot")

- **Mission:** Schedule and execute routine ops (validations, backups, migrations) to keep deployments healthy.
- **Key Inputs:** Deployment calendar, `supabase/migrations/*`, npm scripts (`validate`, `predeploy`).
- **Primary Tools:** Shell execution sandbox, Supabase service key (limited scope), Vercel CLI (CI only).
- **Core Outputs:** Run logs archived to `supabase.audit_logs`, status pings to Slack/Teams via `communicationHub`.
- **Autonomy Signals:** Nightly `npm run validate` job summary present; drift alerts when migrations diverge from production.

## Intake Triage Planner ("Compass")

- **Mission:** Transform raw intake forms into structured triage briefs with priority, risk, and success criteria.
- **Key Inputs:** `/api/triage-report` payloads, personas catalog, SOP snippets from `docs/`.
- **Primary Tools:** Classification prompts, keyword heuristics, governance checklist references.
- **Core Outputs:** Normalized ticket records enriched with priority rationale and escalation flags.
- **Autonomy Signals:** Each new report includes `planner_notes` and `priority_explanation` fields populated without human intervention.

## Department Router ("Switchboard")

- **Mission:** Assign the optimal department and CSR queue with confidence scoring and rationale logging.
- **Key Inputs:** Planner output, `AssignmentEngine` metrics, live CSR availability.
- **Primary Tools:** Hybrid rules + embeddings, Supabase `csr_profiles`, `AssignmentEngine.autoAssign`.
- **Core Outputs:** Department + CSR assignment events, confidence scores, audit trace in `assignment_history`.
- **Autonomy Signals:** Assignment audit rows populated with `confidence` > 0.7 and escalations when routing fails twice.

## Workload Balancer ("Equilibrium")

- **Mission:** Monitor queue load and reassign tickets before SLA breaches occur.
- **Key Inputs:** `analyticsService` snapshots, SLA policies, CSR schedules.
- **Primary Tools:** Supabase queries, scheduling daemon, Slack alert channel.
- **Core Outputs:** Reassignment actions, load redistribution reports, proactive SLA breach warnings.
- **Autonomy Signals:** Reassignment logs show agent as actor; SLA breach count trends downward week-over-week.

## Knowledge Retrieval Specialist ("Lighthouse")

- **Mission:** Surface sourced KB snippets tailored to each ticket and persona.
- **Key Inputs:** `data/kb.json`, Supabase KB tables, planner context.
- **Primary Tools:** Vector search (ANN), citation-aware prompt templates.
- **Core Outputs:** Ranked article list with citations attached to ticket view and outbound messages.
- **Autonomy Signals:** Talking points include source IDs; retrieval latency < 500 ms on average.

## Sentiment Coach ("Empathy")

- **Mission:** Generate tone-aware messaging guidance and escalation cues for frontline responders.
- **Key Inputs:** Detected sentiment, persona style guides, historical conversation outcomes.
- **Primary Tools:** Tone-tuning prompt library, feedback loop from CSAT scores.
- **Core Outputs:** Suggested openers, objection handling language, tone-shift escalations.
- **Autonomy Signals:** Coaching snippets appear in UI without manual drafts; CSAT variance narrows.

## Resolution Drafting Agent ("Scribe")

- **Mission:** Draft channel-ready responses aligned to compliance, tone, and KB guidance.
- **Key Inputs:** Planner brief, retrieval snippets, sentiment guidance.
- **Primary Tools:** Channel-specific prompt templates, post-processing validators (PII scrub, length checks).
- **Core Outputs:** Email/SMS/Slack drafts queued in `communicationHub` with edit suggestions.
- **Autonomy Signals:** Draft coverage >80% of tickets; manual edits trend downward per analytics.

## Governance Auditor ("Sentinel-G")

- **Mission:** Enforce gate approvals, documentation completeness, and prompt version control.
- **Key Inputs:** `docs/agent-change-management-playbook.md`, owner acknowledgements tracker, Git history.
- **Primary Tools:** Policy checklists, diff parsers, approval workflow integrations.
- **Core Outputs:** Gate compliance reports, block/resume recommendations, evidence snapshots.
- **Autonomy Signals:** Pull requests blocked until required artifacts attached; governance dashboards auto-updated.

## Customer Memory Curator ("Archivist")

- **Mission:** Maintain longitudinal customer context and surface relevant history to active tickets.
- **Key Inputs:** `customerProfileService`, note streams, prior resolutions.
- **Primary Tools:** Deduplication heuristics, recency-weighted retrieval, privacy filters.
- **Core Outputs:** Context packets embedded in planner briefs, updated profile summaries, stale note cleanup.
- **Autonomy Signals:** Tickets include `customer_context` attachments; duplicate notes reduced quarter-over-quarter.

## Analytics Storyteller ("Pulse")

- **Mission:** Narrate operations health with actionable insights drawn from analytics pipelines.
- **Key Inputs:** `analyticsService` metrics, SLA baselines, deployment changelog.
- **Primary Tools:** Batch summarization prompts, anomaly detection heuristics.
- **Core Outputs:** Daily heartbeat reports, anomaly alerts, exec-ready summaries stored in `/docs/reports`.
- **Autonomy Signals:** Fresh report artifacts timestamped daily; anomalies annotated before human review.

## Security & Compliance Sentinel ("Aegis")

- **Mission:** Detect and halt risky actions involving PII, compliance infractions, or unapproved tool use.
- **Key Inputs:** Ticket content, tool invocation logs, policy rule sets.
- **Primary Tools:** Safety classifiers, pattern scanners, approval request bridge.
- **Core Outputs:** Blocked action events, escalation tickets, compliance audit trails.
- **Autonomy Signals:** High-risk actions route through approval flow; audit log shows proactive interventions.
