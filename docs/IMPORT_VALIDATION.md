# Import Batch Validation Guide

This guide explains how to validate the codebase after importing data batches (such as knowledge base articles) to ensure code quality and build integrity.

## Overview

The import validation workflow ensures that after each batch import of data:

1. ✅ All dependencies are installed correctly
2. ✅ Code formatting is consistent
3. ✅ Code passes linting checks
4. ✅ All tests pass
5. ✅ The project builds successfully

## Quick Start

After importing any batch of data (KB articles, customer data, etc.), run:

```bash
npm run validate:imports
```

This single command runs all validation checks and provides a comprehensive report.

## Step-by-Step Workflow

### 1. Before Import

Ensure your environment is clean:

```bash
# Check git status
git status

# Ensure you're on the correct branch
git checkout develop  # or your feature branch

# Pull latest changes
git pull origin develop
```

### 2. Import Data

Import your data batch using the appropriate method:

```bash
# Example: Import KB articles
python3 generate_kb_articles.py

# Or manually update JSON files
vim data/kb.json
```

### 3. Run Validation

Immediately after import, validate the changes:

```bash
npm run validate:imports
```

**Expected Output:**

```
╔════════════════════════════════════════════════╗
║   Import Batch Validation Workflow             ║
╚════════════════════════════════════════════════╝

Validating Project Structure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ package.json (file) exists
  ✓ src/ (directory) exists
  ✓ api/ (directory) exists
  ✓ public/ (directory) exists
  ✓ test/ (directory) exists
  ✓ vite.config.js (file) exists
  ✓ .eslintrc.cjs (file) exists

▶ Installing dependencies
  Command: npm install
  ✓ Success

▶ Checking code formatting
  Command: npm run format:check
  ✓ Success

▶ Running linter
  Command: npm run lint
  ✓ Success

▶ Running tests
  Command: npm test
  ✓ Success

▶ Building project
  Command: npm run build
  ✓ Success

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Validation Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Project Structure: PASSED
  ✓ Dependencies Install: PASSED
  ✓ Format Check: PASSED
  ✓ Lint: PASSED
  ✓ Tests: PASSED
  ✓ Build: PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All validation checks passed!
The codebase is ready for deployment.
```

### 4. Fix Any Issues

If validation fails, fix the issues before committing:

#### Format Issues

```bash
# Auto-fix formatting
npm run format

# Re-run validation
npm run validate:imports
```

#### Lint Issues

```bash
# Auto-fix some lint issues
npm run lint:fix

# Manually fix remaining issues
# Then re-run validation
npm run validate:imports
```

#### Test Failures

```bash
# Run tests in watch mode to debug
npm test

# Fix failing tests
# Re-run validation
npm run validate:imports
```

#### Build Failures

```bash
# Check the error output from the validation script
# Fix syntax errors, missing imports, etc.
# Re-run validation
npm run validate:imports
```

### 5. Commit Changes

Once all validation passes:

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: import new KB articles for [topic]"

# Push to remote
git push origin your-branch-name
```

## CI/CD Integration

The validation workflow is integrated into the CI/CD pipeline. When you push changes, GitHub Actions will:

1. Run the comprehensive validation job
2. Run individual test/lint/build jobs on multiple Node versions
3. Run security checks

**CI Workflow Jobs:**

- `validate`: Runs `npm run validate:imports` (fast, comprehensive check)
- `test`: Runs individual checks on Node 20 & 22 (thorough, multi-version)
- `security`: Runs security audits

All jobs must pass for the PR to be mergeable.

## Common Scenarios

### Scenario 1: Importing Knowledge Base Articles

```bash
# 1. Run the import script
python3 generate_kb_articles.py

# 2. Validate
npm run validate:imports

# 3. If successful, commit
git add data/kb.json public/data/kb.json
git commit -m "feat: add KB articles for network security"
git push
```

### Scenario 2: Batch Update of Customer Data

```bash
# 1. Update data files
vim data/personas.json

# 2. Validate
npm run validate:imports

# 3. Commit
git add data/personas.json
git commit -m "feat: update customer personas"
git push
```

### Scenario 3: Multiple Import Batches

When importing multiple batches in sequence:

```bash
# Batch 1
./import_batch_1.sh
npm run validate:imports
git add . && git commit -m "feat: import batch 1"

# Batch 2
./import_batch_2.sh
npm run validate:imports
git add . && git commit -m "feat: import batch 2"

# Batch 3
./import_batch_3.sh
npm run validate:imports
git add . && git commit -m "feat: import batch 3"

# Push all commits
git push
```

## Validation Script Details

The `validate:imports` script performs the following checks:

### 1. Project Structure Validation

Ensures critical files and directories exist:

- `package.json`
- `src/`
- `api/`
- `public/`
- `test/`
- `vite.config.js`
- `.eslintrc.cjs`

### 2. Dependency Installation

Runs `npm install` to ensure:

- All dependencies are installed
- Lock file is up to date
- No dependency conflicts

### 3. Format Check

Uses Prettier to verify:

- JavaScript/CJS files follow style guide
- JSON files are properly formatted
- Markdown documents are formatted consistently
- HTML/CSS files follow formatting rules

### 4. Lint Check

Uses ESLint to check:

- Code quality issues
- Potential bugs
- Best practice violations
- Consistent code style

### 5. Test Execution

Runs the full test suite:

- Unit tests for all services
- Integration tests
- 189 test cases covering:
  - Assignment Engine
  - Communication Hub
  - Customer Profile Service
  - Knowledge Base Service
  - Sentiment Analyzer
  - And more...

### 6. Build Verification

Builds the project with Vite:

- Transpiles/bundles all code
- Optimizes assets
- Generates production-ready artifacts
- Validates all imports/dependencies

## Troubleshooting

### Error: "Project structure validation failed"

**Cause**: Critical file or directory is missing.

**Solution**:

```bash
# Check what's missing from the output
# Restore missing files from git
git checkout main -- <missing-file>
```

### Error: "Dependencies install failed"

**Cause**: Network issue or corrupted npm cache.

**Solution**:

```bash
# Clean npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules

# Reinstall
npm install
```

### Error: "Format check failed"

**Cause**: Code formatting doesn't match Prettier rules.

**Solution**:

```bash
# Auto-fix all formatting issues
npm run format

# Verify fix
npm run format:check
```

### Error: "Lint failed"

**Cause**: Code quality issues or style violations.

**Solution**:

```bash
# Auto-fix fixable issues
npm run lint:fix

# Check what's left
npm run lint

# Manually fix remaining issues
```

### Error: "Tests failed"

**Cause**: Code changes broke existing functionality.

**Solution**:

```bash
# Run tests to see which failed
npm test

# Review the failing test output
# Fix the code or update tests if needed
# Ensure test data is up to date
```

### Error: "Build failed"

**Cause**: Syntax error, missing import, or configuration issue.

**Solution**:

```bash
# Review build error output carefully
npm run build

# Common issues:
# - Syntax errors in JS files
# - Missing imports
# - Invalid JSON
# - TypeScript errors (if applicable)
```

## Best Practices

1. **Run validation immediately after imports**: Don't wait until commit time
2. **Fix issues incrementally**: Easier to debug when changes are small
3. **Commit after each successful validation**: Keep commits atomic
4. **Review validation output**: Don't just check the exit code
5. **Use meaningful commit messages**: Reference what data was imported
6. **Test locally before pushing**: CI runs the same checks, save time by running locally first

## Alternative Commands

If you prefer to run checks individually:

```bash
# Format only
npm run format:check

# Lint only
npm run lint

# Tests only
npm test

# Build only
npm run build

# All together (without dependency install)
npm run validate
```

## Integration with Other Tools

### Git Hooks

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run validate:imports
```

### VS Code Tasks

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Validate Imports",
      "type": "npm",
      "script": "validate:imports",
      "problemMatcher": []
    }
  ]
}
```

### Pre-Push Hook

Add to `.husky/pre-push`:

```bash
#!/bin/sh
npm run validate:imports
```

## Summary

The import batch validation workflow ensures code quality and build integrity after data imports. By running `npm run validate:imports` after each import batch, you can:

- ✅ Catch issues early
- ✅ Maintain code quality
- ✅ Ensure CI/CD success
- ✅ Keep the codebase deployable
- ✅ Maintain team confidence

For questions or issues, refer to the [scripts README](./scripts/README.md) or contact the development team.
