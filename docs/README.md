# Documentation Index

Central landing page for INT Smart Triage AI 2.0 documentation. Each section maps to a core responsibility so new engineers, operators, and reviewers can find the right depth quickly.

## Quick Table

| Area                                         | Audience                 | Document                                     |
| -------------------------------------------- | ------------------------ | -------------------------------------------- |
| Product overview & onboarding                | Everyone                 | `../README.md`                               |
| System architecture & data flow              | Architects, SWE          | `ARCHITECTURE.md`                            |
| Frontend states & UI logic                   | Frontend SWE, UX         | `FRONTEND.md`                                |
| Service layer internals (AI, routing, comms) | Backend SWE, AI          | `SERVICES.md`                                |
| HTTP endpoints & payload contracts           | API consumers            | `API_REFERENCE.md`                           |
| Operations, monitoring, incident response    | SRE, Support Ops         | `OPERATIONS.md`                              |
| Governance gates & approval workflow         | Program Mgmt, Compliance | `agent-change-management-playbook.md`        |
| Owner acknowledgements & submission tracker  | Program Mgmt             | `agent-governance-owner-acknowledgements.md` |
| Outreach templates                           | Program Mgmt             | `agent-governance-communication-template.md` |
| Pre-read workspace                           | Gate owners              | `governance-pre-read/`                       |

## How to Use This Folder

1. Start with `ARCHITECTURE.md` for a mental model of the system.
2. Jump to the domain-specific doc matching your task.
3. Update the relevant doc when you ship changes; list yourself in the change log (each file includes one).
4. Reflect cross-cutting impacts in `agents.md` / `claude.md` (agent best practices) when governance processes evolve.

## Contribution Workflow

- Maintain ASCII formatting.
- Include a “Change Log” section in new docs (see examples).
- Cross-link related docs so updates stay discoverable.

_Last updated: 16 Oct 2025 (Codex agent)._
