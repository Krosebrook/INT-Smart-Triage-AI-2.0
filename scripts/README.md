# Scripts Directory

This directory contains utility scripts for maintaining and validating the INT Smart Triage AI 2.0 application.

## Available Scripts

### validate-imports.js

**Purpose**: Comprehensive validation script to run after each import batch or data change.

**Usage**:

```bash
npm run validate:imports
```

**What it does**:

1. **Project Structure Validation**: Verifies all critical files and directories exist
2. **Dependency Installation**: Runs `npm install` to ensure dependencies are up to date
3. **Format Check**: Validates code formatting with Prettier
4. **Lint**: Runs ESLint to check for code quality issues
5. **Tests**: Executes the full test suite
6. **Build**: Performs a production build to ensure no build errors

**Exit Codes**:

- `0`: All validation checks passed
- `1`: One or more validation checks failed

**When to use**:

- After importing knowledge base articles
- After batch data updates
- Before committing changes
- As part of CI/CD pipeline

### validate-env.js

**Purpose**: Validates that all required environment variables are set before deployment.

**Usage**:

```bash
npm run validate:env
```

**What it does**:

- Checks for required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
- Validates optional environment variables
- Checks URL formats and NODE_ENV values
- Provides detailed feedback on missing or invalid configurations

**When to use**:

- Before deploying to production
- When setting up a new environment
- Automatically runs before `npm run deploy`

### agents-runtime.js

**Purpose**: Manages the runtime status of agents in the system.

**Usage**:

```bash
npm run agents:status              # List all agents
npm run agents:status -- --json    # Output as JSON
npm run agents:activate -- --agent <id>    # Activate an agent
npm run agents:deactivate -- --agent <id>  # Deactivate an agent
npm run agents:flag -- --agent <id>        # Flag an agent for review
```

**Features**:

- View agent status and metadata
- Activate/deactivate agents
- Flag agents for review
- Integrates with external dashboard via webhook

### agents-orchestrator.js

**Purpose**: Long-running orchestrator that monitors agent activations and invokes handlers.

**Usage**:

```bash
npm run agents:orchestrate
```

**What it does**:

- Monitors agent activation events
- Routes requests to appropriate handlers
- Manages agent lifecycle
- Coordinates between multiple agents

### agents-status.js

**Purpose**: Helper module for managing agent status data.

**Features**:

- Read/write agent status
- Track agent metadata
- Persist state across sessions

## Workflow Integration

### Standard Development Workflow

```bash
# 1. Make changes (e.g., import data)
# 2. Run validation
npm run validate:imports

# 3. If validation passes, commit
git add .
git commit -m "feat: import new KB articles"
```

### Pre-Deployment Workflow

```bash
# 1. Ensure environment is configured
npm run validate:env

# 2. Run comprehensive validation
npm run validate

# 3. Deploy
npm run deploy
```

### CI/CD Integration

The validation scripts are designed to work seamlessly with GitHub Actions:

```yaml
- name: Run import validation
  run: npm run validate:imports
```

## Best Practices

1. **Always run validation after batch imports**: Use `npm run validate:imports` after importing data to catch issues early
2. **Check environment before deployment**: Run `npm run validate:env` to ensure all required variables are set
3. **Use in Git hooks**: Consider adding validation to pre-commit or pre-push hooks
4. **Monitor in CI**: Add validation steps to your CI/CD pipeline for continuous quality assurance
5. **Review failures**: When validation fails, review the output carefully to identify the root cause

## Troubleshooting

### "Dependencies Install Failed"

- Check your internet connection
- Verify `package.json` is valid
- Try `npm cache clean --force` and retry

### "Format Check Failed"

- Run `npm run format` to auto-fix formatting issues
- Review specific files listed in the error output

### "Lint Failed"

- Run `npm run lint:fix` to auto-fix some issues
- Review and manually fix remaining lint errors

### "Tests Failed"

- Review test output to identify failing tests
- Ensure test data and fixtures are up to date
- Check if recent changes broke existing functionality

### "Build Failed"

- Review build errors in the output
- Check for syntax errors or missing imports
- Ensure all dependencies are installed correctly

## Contributing

When adding new scripts:

1. Add a shebang line: `#!/usr/bin/env node`
2. Make the script executable: `chmod +x scripts/new-script.js`
3. Add an entry to `package.json` scripts section
4. Document the script in this README
5. Add error handling and user-friendly output
