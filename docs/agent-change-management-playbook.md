# Agent Change Management Playbook

This playbook translates current best practices from `agents.md` into a gated workflow so every agent initiative follows a predictable, auditable SDLC.

## Gate Summary

| Gate | Name                         | Primary Objective                                             | Key Deliverables                                                                         | Accountable Owner                                 |
| ---- | ---------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| G0   | Concept Intake               | Validate agent fit, scope, and risk tier                      | Intake brief, success metrics, risk classification                                       | Product Lead, AI Program Manager                  |
| G1   | Architecture & Policy Review | Approve technical approach and policy posture                 | Architecture doc, prompt repository, fallback plan, data flow diagram                    | AI Architect, Security Architect, Privacy Counsel |
| G2   | Planning & Control Design    | Finalize planner/middleware strategy and operational controls | System prompt package, planner design, operator playbooks, planner smoke-test report     | AI Architect, Senior SWE                          |
| G3   | Tooling & Memory Readiness   | Harden memory stores and tool catalog prior to build          | Memory retention SOP, tool catalog, sandbox validation results, guardrail configurations | MLOps Lead, Platform/SRE Lead                     |
| G4   | Build & Integration          | Implement agent loop, middleware, and interfaces              | Feature branch, integration test results, prompt reviews                                 | Feature Squad Engineering Manager                 |
| G5   | Evaluation & Observability   | Validate quality, reliability, and monitoring                 | Automated eval pipeline, trace grading setup, dashboards, expert review log              | AI Quality Lead, Observability Engineer           |
| G6   | Governance & Risk Approval   | Confirm compliance, legal, and safety coverage                | Risk assessment, guardrail evidence, human-in-the-loop thresholds, incident runbook      | Safety Review Board Chair                         |
| G7   | Launch Readiness             | Confirm production hardening and operational preparedness     | Hardened deployment, launch/rollback runbook, support training checklist                 | DevOps Lead, Support Operations Manager           |
| G8   | Monitoring & Improvement     | Sustain performance and drive continuous improvement          | Weekly metric reports, quarterly audits, change log                                      | AI Operations Manager, Compliance Officer         |

## Gate Details

### G0 – Concept Intake

- **Owner(s)**: Product Lead, AI Program Manager
- **Checklist Links**: Implementation Checklist – Architecture & Prompts (agents.md:52-55)
- **Exit Criteria**: Problem statement signed off, success metrics defined, risk tier logged in intake tracker, cross-functional working group named.

### G1 – Architecture & Policy Review

- **Owner(s)**: AI Architect, Security Architect, Privacy Counsel
- **Checklist Links**: Architecture & Prompts (agents.md:52-55)
- **Exit Criteria**: Approved architecture diagram, prompt repo with version history, fallback/DR plan, privacy impact assessment signed.

### G2 – Planning & Control Design

- **Owner(s)**: AI Architect, Senior SWE
- **Checklist Links**: Planning & Control Flow (agents.md:58-61)
- **Exit Criteria**: Planner/sub-agent specs, operator SOPs, planner smoke-test results uploaded, incident pause/resume procedures ratified.

### G3 – Tooling & Memory Readiness

- **Owner(s)**: MLOps Lead, Platform/SRE Lead
- **Checklist Links**: Memory & Knowledge (agents.md:63-66), Tooling & Guardrails (agents.md:68-72)
- **Exit Criteria**: Retention policies implemented, validation hooks on memory writes, tool catalog published, guardrail tests passing.

### G4 – Build & Integration

- **Owner(s)**: Feature Squad Engineering Manager
- **Checklist Links**: All prior sections plus Development SOPs
- **Exit Criteria**: Code merged behind feature flag, middleware integrated, peer reviews complete, integration tests green.

### G5 – Evaluation & Observability

- **Owner(s)**: AI Quality Lead, Observability Engineer
- **Checklist Links**: Evaluation & Observability (agents.md:74-77)
- **Exit Criteria**: Automated eval suite, trace grading workflow, live dashboards, expert trace review sign-off.

### G6 – Governance & Risk Approval

- **Owner(s)**: Safety Review Board Chair (with Legal, Compliance)
- **Checklist Links**: Safety, Guardrails & Human Oversight (agents.md:32-35)
- **Exit Criteria**: Risk memo approved, human-in-the-loop gates verified, compliance checklist complete, go/no-go recorded.

### G7 – Launch Readiness

- **Owner(s)**: DevOps Lead, Support Operations Manager
- **Checklist Links**: Deployment & UX (agents.md:79-82)
- **Exit Criteria**: Production deployment checklist signed, launch/rollback comms plan, support training delivered, monitoring alerts tested.

### G8 – Monitoring & Improvement

- **Owner(s)**: AI Operations Manager, Compliance Officer
- **Checklist Links**: Evaluation & Observability follow-through, Safety oversight
- **Exit Criteria**: Weekly metric review cadence, quarterly compliance audits scheduled, change log maintained, retrospective actions tracked.

## Governance Board Review Cadence

- **Board**: AI Safety & Compliance Governance Board (AI Architect, Security, Privacy, Compliance, Support Ops)
- **First Session**: Thursday, 23 Oct 2025 @ 10:00 CDT (60 min)
- **Agenda**:
  1. Review `agents.md` checklist adoption and gating alignment
  2. Approve owners and responsibilities per gate
  3. Ratify evaluation metrics and monitoring dashboards
  4. Define success criteria for first agent pilot
- **Pre-Work**: Owners to upload deliverables for Gates G0–G2 to shared workspace by 21 Oct 2025 EOD.

## Change Log

- 16 Oct 2025: Initial playbook drafted from best-practice checklist and governance guidance (AI Program Manager, recorded by Codex agent).
