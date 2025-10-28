# Repository Guidelines

## Project Structure & Module Organization

- `src/` holds service modules such as `assignmentEngine.js`, `analyticsService.js`, and channel integrations.
- `api/` contains Vercel-ready serverless functions (e.g., `triage-report.js`).
- `public/` serves static dashboards and report viewers used by the client UI.
- `test/` stores Node test files; snapshots and fixtures live alongside the specs.
- `supabase/` tracks SQL migrations and schema helpers; update these when data models change.

## Build, Test, and Development Commands

- `npm run dev` launches the Vite dev server for the client experience.
- `npm run build` emits the production bundle to `dist/`.
- `npm test` runs the Node test suite under the built-in `node:test` runner.
- `npm run lint` and `npm run format:check` enforce ESLint/Prettier gates; use `lint:fix` or `format` before pushing.
- `npm run validate` chains format, lint, tests, and build for pre-deploy confidence.
- `npm run agents:status` lists runtime-registered agents; append `-- --json` for raw output.
- `npm run agents:activate -- --agent <id>` (and `agents:deactivate` / `agents:flag`) update runtime state and notify external dashboards/automation hooks.
- `npm run agents:orchestrate` boots the long-running orchestrator that reacts to agent activations and invokes handlers.

## Coding Style & Naming Conventions

- JavaScript is ES modules with 2-space indentation and semicolons (lint enforced).
- Service classes use PascalCase (e.g., `AssignmentEngine`); helper functions are camelCase.
- Environment variables follow upper snake case (`SUPABASE_SERVICE_ROLE_KEY`).
- Run `npm run format` to keep Markdown/JSON aligned with repository formatting rules.

## Testing Guidelines

- Tests live in `test/*.test.js` and should mirror the module under test.
- Target ≥70% coverage for lines, functions, and branches (`npm run test:coverage-check`).
- Use descriptive `describe` blocks (`AssignmentEngine › autoAssign`) and keep fixtures minimal and inline unless reused.

## Commit & Pull Request Guidelines

- Follow the existing Conventional Commit pattern (`feat:`, `fix:`, `docs:`) with imperative summaries.
- Reference relevant docs or Supabase migrations inside the body when behavior changes.
- PRs should include: purpose statement, affected modules/paths, screenshots of UI diffs, and validation steps (tests, lint, build).
- Link issues or roadmap items (`ROADMAP_SUMMARY.md`) when applicable to maintain governance traceability.

## Security & Configuration Tips

- Never commit secrets; rely on `.env.local` and `scripts/validate-env.js` to confirm required keys.
- Keep Supabase migrations synchronized with production using the `supabase/migrations` directory.
- Run `npm run predeploy` before Vercel releases to ensure environment validation passes.
- Configure `AGENT_DASH_WEBHOOK` / `AGENT_DASH_TOKEN` and `AUTOMATION_API_URL` / `AUTOMATION_API_TOKEN` to sync runtime status with the external agent dashboard and automation apps.
- Copy `.env.agent.example` to `.env.local` (or CI secret store) and adjust `AUTOMATION_VALIDATE_COMMAND` / `AUTOMATION_VALIDATE_INTERVAL_MS` so Autopilot runs the desired workflows.
