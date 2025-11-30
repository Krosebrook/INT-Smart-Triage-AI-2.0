# GitHub Copilot Custom Agents

## Overview: Symphony of Roles Architecture

This directory contains **17 production-ready GitHub Copilot Custom Agents** implementing the Symphony of Roles architecture. These specialized AI personas collaborate across 6 development phases using RACI accountability matrices.

The FlashFusion source-of-truth monorepo consolidates 53 repositories with:

- **Package Manager**: npm with workspaces
- **Build Tool**: Vite for bundling, Vercel for serverless deployment
- **Language**: JavaScript (ES modules) with JSDoc typing
- **Database**: Supabase with Row Level Security
- **CI/CD**: GitHub Actions
- **Security**: gitleaks, Renovate, npm audit
- **Testing**: Node.js built-in test runner with c8 coverage

## Agent Directory

| File                  | Role                             | Tools                     |
| --------------------- | -------------------------------- | ------------------------- |
| `visionary.agent.md`  | Product Strategist               | read, search, edit, web   |
| `product.agent.md`    | Product Manager / Product Owner  | read, search, edit        |
| `ux.agent.md`         | UX Designer                      | read, search, edit        |
| `ui.agent.md`         | UI Designer                      | read, search, edit        |
| `mobile.agent.md`     | Mobile App Developer             | read, search, edit, shell |
| `database.agent.md`   | Backend Developer / DB Architect | read, search, edit, shell |
| `test.agent.md`       | QA Engineer / Tester             | read, search, edit, shell |
| `deploy.agent.md`     | DevOps / Release Engineer        | read, search, edit, shell |
| `security.agent.md`   | Security Analyst                 | read, search, edit, shell |
| `growth.agent.md`     | Marketing & Growth Strategist    | read, search, edit, web   |
| `analyst.agent.md`    | Business Analyst                 | read, search, edit        |
| `docs.agent.md`       | Documentation Specialist         | read, search, edit        |
| `api.agent.md`        | API Designer                     | read, search, edit        |
| `automation.agent.md` | Workflow Automation Specialist   | read, search, edit        |
| `review.agent.md`     | Code Review Specialist           | read, search, edit        |
| `refactor.agent.md`   | Refactoring Specialist           | read, search, edit, shell |
| `debug.agent.md`      | Debugging Specialist             | read, search, edit, shell |

## RACI Matrix by Development Phase

The Symphony of Roles uses RACI (Responsible, Accountable, Consulted, Informed) to define clear ownership across phases:

| Phase       | Responsible (R)          | Accountable (A) | Consulted (C)  | Informed (I) |
| ----------- | ------------------------ | --------------- | -------------- | ------------ |
| Discovery   | Visionary, Analyst       | Product         | UX, Security   | Growth       |
| Design      | UX, UI                   | Product         | Visionary      | Growth       |
| Build       | Mobile, Database, Deploy | Product         | Security, Test | UI           |
| Release     | Test, Deploy             | Product         | Security       | Growth       |
| Growth      | Growth                   | Visionary       | Product        | UX           |
| Maintenance | Deploy, Test, Security   | Product         | Database       | Visionary    |

### Phase Descriptions

1. **Discovery**: Market research, user research, requirements gathering, feasibility studies
2. **Design**: UX flows, UI specifications, design systems, prototyping
3. **Build**: Development, database schema, API implementation, mobile apps
4. **Release**: Testing, CI/CD, deployment, monitoring setup
5. **Growth**: Marketing campaigns, analytics, SEO/ASO, retention strategies
6. **Maintenance**: Bug fixes, security patches, performance optimization, documentation

## Usage Instructions

### GitHub.com (Copilot Chat)

In any repository issue, PR, or file view:

```
@visionary-agent Analyze the competitive landscape for our triage AI
@product-agent Write user stories for the new dashboard feature
@security-agent Review this PR for security vulnerabilities
```

### VS Code (GitHub Copilot Chat)

Open the Copilot Chat panel and invoke agents:

```
@test-agent Generate unit tests for src/assignmentEngine.js
@refactor-agent Reduce complexity in this function
@debug-agent Help me trace this null reference error
```

### Copilot CLI

From your terminal with GitHub Copilot CLI installed:

```bash
gh copilot explain "@database-agent How should I structure the RLS policies?"
gh copilot suggest "@deploy-agent Create a GitHub Actions workflow for staging"
```

### Agent Chaining

Agents can reference each other's outputs:

```
@analyst-agent Create a BRD for the notification system
# Then:
@product-agent Convert this BRD into user stories
# Then:
@ux-agent Create user journey maps for these stories
```

## Requirements

### Subscription Tiers

| Feature                    | Copilot Individual | Copilot Business | Copilot Enterprise |
| -------------------------- | ------------------ | ---------------- | ------------------ |
| Custom agent invocation    | ✅                 | ✅               | ✅                 |
| Organization-wide agents   | ❌                 | ✅               | ✅                 |
| Knowledge base integration | ❌                 | ❌               | ✅                 |
| Audit logging              | ❌                 | ✅               | ✅                 |

### Technical Requirements

- GitHub Copilot subscription (Individual, Business, or Enterprise)
- VS Code with GitHub Copilot extension (for IDE usage)
- GitHub CLI with Copilot extension (for CLI usage)
- Repository access permissions appropriate to the agent's scope

## Contributing

When adding or modifying agents:

1. Follow the established `.agent.md` format with YAML frontmatter
2. Include all required sections (Role, Responsibilities, Boundaries, Examples)
3. Test invocation examples before committing
4. Update this README's agent table if adding new agents
5. Ensure security boundaries are specific and actionable
