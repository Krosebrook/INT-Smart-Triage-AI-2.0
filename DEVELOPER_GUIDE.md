# Developer Guide

## Overview

This guide provides best practices, development workflows, and guidelines for contributing to the INT Smart Triage AI 2.0 project.

---

## Getting Started

### Prerequisites

- **Node.js**: 18.20.0+ (LTS) - use `nvm use` to automatically load the correct version
- **npm**: 9.0.0+
- **Git**: 2.30.0+
- **nvm** (recommended): For Node.js version management

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0.git
cd INT-Smart-Triage-AI-2.0

# Use correct Node.js version (if using nvm)
nvm use

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Verify setup
npm run validate
```

---

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch for integration
- Feature branches: `feature/your-feature-name`
- Bug fixes: `fix/your-bug-fix`

### Making Changes

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes

# Format code
npm run format

# Lint code
npm run lint:fix

# Run tests
npm test

# Run coverage
npm run test:coverage

# Build and verify
npm run build

# Commit changes
git add .
git commit -m "feat: your descriptive message"

# Push to remote
git push origin feature/your-feature-name
```

---

## Code Quality Standards

### Linting

We use ESLint to enforce code quality:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

**ESLint Configuration Highlights**:
- ES2022 syntax support
- Module-based imports (ESM)
- `console.log` warnings (errors in production)
- No unused variables (except those prefixed with `_`)
- `prefer-const` enforced
- No `var` declarations allowed

### Code Formatting

We use Prettier for consistent code formatting:

```bash
# Check formatting
npm run format:check

# Auto-format all files
npm run format
```

**Prettier Settings**:
- Semicolons: Yes
- Single quotes: Yes
- Print width: 80 characters
- Tab width: 2 spaces
- Trailing commas: ES5

### Testing

We use Node.js native test runner with 100% test pass rate:

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run with coverage thresholds
npm run test:coverage-check
```

**Test Coverage Targets**:
- Lines: 70%
- Functions: 70%
- Branches: 70%

**Current Coverage**:
- Overall: 5.43%
- triageEngine.js: 99.19% ✅
- validation.js: 83.05% ✅
- security.js: 51.94% ⚠️

---

## Project Scripts

### Essential Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run test:coverage` | Generate coverage reports |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format all code |
| `npm run format:check` | Check formatting |
| `npm run validate` | Run all checks (format, lint, test, build) |
| `npm run deploy` | Deploy to Vercel production |

### Validation Before Commit

Always run validation before committing:

```bash
npm run validate
```

This runs:
1. Prettier format check
2. ESLint
3. Tests
4. Build

---

## Architecture

### Directory Structure

```
.
├── api/                    # Serverless functions (Vercel)
│   ├── health-check.js    # System health endpoint
│   ├── triage-report.js   # Main triage processing
│   ├── generate-kb-article.js
│   ├── generate-template.js
│   └── review-response.js
├── src/
│   ├── components/        # UI components (13 modules)
│   ├── services/          # Business logic (8 services)
│   └── utils/             # Utility functions
├── test/                  # Test files
│   ├── api.test.js
│   ├── index.test.js
│   └── integration.test.js
├── supabase/
│   └── migrations/        # Database migrations
├── public/                # Static assets
├── .github/
│   ├── workflows/         # CI/CD workflows
│   └── dependabot.yml     # Automated dependency updates
└── docs/                  # Documentation
```

### Key Services

1. **triageEngine.js**: Core AI triage logic with 9 categories
2. **geminiService.js**: Google Gemini AI integration
3. **database.js**: Supabase database client
4. **validation.js**: Input validation and sanitization
5. **security.js**: Security headers and rate limiting

### Categories Supported

- `authentication` - Password, login, MFA issues
- `infosec` - Security, compliance, audit
- `technology` - IT, network, server issues
- `website_design` - Web design, CMS, hosting
- `branding` - Brand, logo, visual identity
- `content` - Content strategy, SEO, copywriting
- `marketing` - Marketing automation, CRM
- `operations` - Bookkeeping, HR, analytics

---

## Testing Guidelines

### Writing Tests

Tests should be:
- **Focused**: Test one thing at a time
- **Isolated**: No dependencies between tests
- **Readable**: Clear descriptions and assertions
- **Fast**: Run quickly for rapid feedback

Example test structure:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    assert.strictEqual(result.property, expectedValue);
  });
});
```

### Test Conventions

- Use descriptive test names that read like sentences
- Test both success and error paths
- Verify expected behavior, not implementation details
- Include edge cases and boundary conditions

---

## Security Best Practices

### Environment Variables

**Never commit**:
- `.env` files
- API keys
- Database credentials
- Service role keys

**Always**:
- Use `.env.example` as a template
- Store secrets in Vercel dashboard
- Use different keys for dev/staging/production
- Rotate credentials regularly

### Input Validation

All user input must be:
1. Validated (type, length, format)
2. Sanitized (remove XSS, SQL injection attempts)
3. Escaped (before database operations)

Example:

```javascript
const validation = validateTriageRequest(data);
if (!validation.isValid) {
  return res.status(400).json({
    error: 'Validation Error',
    details: validation.errors
  });
}

const sanitized = sanitizeTriageData(data);
```

### Security Headers

All API responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

---

## Debugging

### Common Issues

#### Tests Failing

```bash
# Run specific test file
node --test test/api.test.js

# Verbose output
node --test test/api.test.js --test-reporter=spec
```

#### Build Errors

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

#### Coverage Not Generated

```bash
# Ensure c8 is installed
npm install --save-dev c8

# Run with verbose output
npm run test:coverage
```

---

## CI/CD Pipeline

### GitHub Actions

The CI pipeline runs on:
- Push to `main` or `develop`
- Pull requests to `main`

**CI Jobs**:
1. **Test and Lint**
   - Node.js 18 and 20 matrix
   - Install dependencies
   - Run security audit
   - Run linter
   - Run tests with coverage
   - Build project
   - Upload coverage artifacts

2. **Security Check**
   - Run npm audit
   - Generate audit report
   - Upload report as artifact

### Dependabot

Automated dependency updates run:
- **npm**: Weekly on Mondays at 9 AM
- **GitHub Actions**: Monthly
- Groups minor/patch updates
- Separate PRs for security updates
- Auto-labels with `dependencies`

---

## Contributing

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes following code quality standards
3. Write/update tests for new functionality
4. Update documentation as needed
5. Run `npm run validate` to ensure all checks pass
6. Push to your branch
7. Create a pull request to `develop`
8. Wait for CI checks to pass
9. Address review feedback
10. Squash and merge when approved

### Commit Message Convention

Use conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add or update tests
chore: maintenance tasks
```

Examples:
- `feat: add authentication category to triage engine`
- `fix: resolve failing test in api.test.js`
- `docs: update README with coverage information`
- `chore: update dependencies to latest versions`

---

## Resources

### Documentation

- [CHANGELOG.md](CHANGELOG.md) - Version history
- [IMPROVEMENTS_IMPLEMENTED.md](IMPROVEMENTS_IMPLEMENTED.md) - Recent improvements
- [CI_CD_IMPROVEMENTS.md](CI_CD_IMPROVEMENTS.md) - CI/CD details
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

### External Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Node.js Test Runner](https://nodejs.org/api/test.html)

---

## Support

For questions or issues:
1. Check existing documentation
2. Search GitHub issues
3. Create a new issue with detailed description
4. Tag appropriate team members

---

**Last Updated**: October 2025  
**Maintained By**: INT Inc. Development Team
