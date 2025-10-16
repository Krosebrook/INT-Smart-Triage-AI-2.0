# INT Smart Triage AI 2.0 - Claude Code Context

## Project Overview

This is a secure, production-ready AI-powered ticket triage system designed for INT Inc.'s Customer Success Representatives (CSRs). The system analyzes customer tickets, assigns priority levels, provides empathetic response guidelines, and suggests relevant Knowledge Base articles—all while maintaining enterprise-grade security and complete audit trails.

**Key Features:**

- Intelligent ticket triage with confidence scoring
- Tone-aware empathetic response generation
- Knowledge Base article recommendations
- Comprehensive audit logging with RLS enforcement
- Real-time analytics and reporting
- Customer profile management with sentiment tracking

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES modules), modern CSS Grid/Flexbox
- **Backend**: Vercel Serverless Functions (Node.js 18+)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Deployment**: Vercel with CI/CD integration via GitHub Actions
- **Build Tools**: Vite for bundling, ESLint for linting, Prettier for formatting
- **Testing**: Node.js native test runner with c8 for coverage

## Project Structure

```
├── api/                          # Vercel serverless functions
│   ├── health-check.js          # System health and RLS verification endpoint
│   └── triage-report.js         # Main triage processing and logging endpoint
├── src/                          # Core business logic modules
│   ├── analyticsService.js      # Analytics and metrics tracking
│   ├── assignmentEngine.js      # Intelligent ticket assignment logic
│   ├── communicationHub.js      # Multi-channel communication handling
│   ├── customerProfileService.js # Customer data and history management
│   ├── emailService.js          # Email notification handling
│   ├── knowledgeBaseService.js  # KB article search and retrieval
│   ├── realtimeService.js       # Real-time updates via Supabase
│   ├── reportingService.js      # Report generation and export
│   ├── sentimentAnalysis.js     # Customer sentiment detection
│   └── supabaseClient.js        # Supabase client initialization
├── data/                         # Static data files
│   ├── kb.json                  # Knowledge Base articles
│   └── personas.json            # Customer persona definitions
├── supabase/                     # Database migrations and configs
│   └── migrations/              # SQL migration files
├── test/                         # Test files (*.test.js)
├── public/                       # Static assets
├── index.html                    # Main CSR dashboard interface
├── index.js                      # Application entry point
└── vercel.json                   # Vercel deployment configuration
```

## Coding Standards and Conventions

### JavaScript Style

- **ES Modules**: Use `import/export` syntax (not CommonJS)
- **Modern JavaScript**: Target ES2022+ features
- **Const by default**: Use `const` unless reassignment is needed, then `let` (never `var`)
- **Arrow functions**: Prefer arrow functions for callbacks and short functions
- **Async/await**: Use async/await over raw Promises for better readability
- **Naming conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes
  - `UPPER_SNAKE_CASE` for constants
  - Prefix unused parameters with underscore: `_unusedParam`

### ESLint Configuration

- Extends `eslint:recommended`
- No unused variables (except those prefixed with `_`)
- `no-console` warnings in development, errors in production
- Exceptions: console allowed in `index.js` and test files

### Code Organization

- **Modular architecture**: Each service in `src/` should have a single responsibility
- **API endpoints**: Keep thin—delegate business logic to `src/` modules
- **Error handling**: Always use try-catch blocks in async functions
- **Input validation**: Validate and sanitize all user inputs in API endpoints
- **Comments**: Use JSDoc-style comments for functions, especially in API endpoints

### Security Best Practices

**CRITICAL**: This project enforces strict security standards:

1. **Row Level Security (RLS)**:
   - ALL database operations MUST go through API endpoints
   - NEVER expose Supabase anon key to frontend
   - Use `SUPABASE_SERVICE_ROLE_KEY` only in serverless functions
   - Verify RLS policies are active before deployment

2. **Environment Variables**:
   - Store ALL secrets in Vercel environment variables
   - Never commit `.env` files
   - Use `.env.example` as a template
   - Required vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

3. **Input Sanitization**:
   - Validate all request payloads
   - Sanitize strings before database insertion
   - Use parameterized queries (Supabase does this by default)

4. **Security Headers**:
   - Already configured in API responses
   - XSS protection, CSRF protection, clickjacking prevention

5. **Audit Logging**:
   - Log ALL triage requests with IP addresses
   - Include session IDs and timestamps
   - Never log sensitive customer data in plaintext

## Database Schema

Key tables:

- `triage_logs`: Stores all triage requests and results
- `kb_articles`: Knowledge Base article metadata
- `customer_profiles`: Customer history and preferences
- `analytics_events`: System analytics and metrics
- `email_notifications`: Email delivery tracking

All tables have RLS policies that restrict public access. Only service role can perform CRUD operations.

## Development Workflow

### Setup

```bash
npm install
cp .env.example .env  # Then fill in your values
```

### Development

```bash
npm run dev          # Start Vite dev server
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting errors
npm run format       # Format code with Prettier
npm run format:check # Check formatting without changes
```

### Testing

```bash
npm test                  # Run all tests
npm run test:coverage     # Run tests with coverage report
npm run test:coverage-check # Enforce minimum coverage thresholds (70%)
```

### Build and Deploy

```bash
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run deploy   # Deploy to Vercel production
npm run validate # Run format check + lint + test + build
```

## Testing Guidelines

- **Location**: All test files in `test/` directory with `.test.js` extension
- **Framework**: Node.js native test runner (no Jest/Mocha needed)
- **Coverage tool**: c8 (nyc/istanbul compatible)
- **Coverage requirements**: Minimum 70% for lines, functions, and branches
- **Covered paths**: `src/**/*.js` and `api/**/*.js`
- **Test structure**: Use `describe` blocks for grouping, `it` for individual tests
- **Assertions**: Use Node's built-in `assert` module

## Common Development Tasks

### Adding a New API Endpoint

1. Create new file in `api/` directory (e.g., `api/new-endpoint.js`)
2. Export default async function: `export default async function handler(req, res) { }`
3. Add appropriate security headers and CORS configuration
4. Validate request method and payload
5. Use try-catch for error handling
6. Import and use services from `src/` as needed
7. Log significant actions to Supabase
8. Test endpoint manually and add automated tests

### Adding a New Service Module

1. Create new file in `src/` directory (e.g., `src/newService.js`)
2. Import `supabaseClient.js` if database access is needed
3. Export functions with clear JSDoc comments
4. Keep functions pure and testable when possible
5. Add corresponding test file in `test/`
6. Update this claude.md if the module introduces new concepts

### Database Migrations

1. Create new SQL file in `supabase/migrations/` with timestamp prefix
2. Include both schema changes and RLS policies
3. Test migration in Supabase SQL editor
4. Document any breaking changes in migration file comments
5. Update `.env.example` if new config is required

### Updating Frontend

1. Modify `index.html` directly (single-page application)
2. Follow existing CSS structure (uses CSS variables for theming)
3. Use vanilla JavaScript with event delegation where possible
4. Ensure all API calls go through Vercel functions (never direct to Supabase)
5. Test in multiple browsers (Chrome, Firefox, Safari, Edge)

## Key Architectural Decisions

### Why Serverless?

- **Scalability**: Automatic scaling with zero configuration
- **Security**: Secrets stored server-side, never exposed to frontend
- **Cost**: Pay only for actual usage
- **Simplicity**: No server management or DevOps overhead

### Why RLS Instead of API Keys?

- **Defense in depth**: Even if API keys leak, database is protected
- **Compliance**: Meets enterprise security requirements
- **Auditability**: Database-level access control is easier to audit

### Why Vanilla JavaScript?

- **Performance**: No framework overhead
- **Simplicity**: Easier onboarding for team members
- **Control**: Full control over bundle size and behavior
- **Future-proof**: No framework lock-in or upgrade cycles

## Debugging Tips

### API Endpoint Not Working

1. Check Vercel logs: `vercel logs --follow`
2. Verify environment variables are set in Vercel dashboard
3. Test health-check endpoint: `GET /api/health-check`
4. Check Supabase logs for database errors
5. Verify RLS policies haven't been accidentally disabled

### Frontend Issues

1. Open browser DevTools console for JavaScript errors
2. Check Network tab for failed API requests
3. Verify API endpoints return expected JSON structure
4. Clear browser cache if seeing stale data

### Database Issues

1. Verify RLS is enabled: Query should fail from SQL editor without service role
2. Check Supabase logs for permission errors
3. Verify service role key (not anon key) is configured
4. Test queries directly in Supabase SQL editor with RLS disabled temporarily

## Dependencies and Package Management

### Production Dependencies

- `@supabase/supabase-js`: Supabase client library
- `undici`: Fast HTTP client (used by Vercel functions)

### Dev Dependencies

- `vite`: Build tool and dev server
- `eslint`: JavaScript linting
- `prettier`: Code formatting
- `c8`: Test coverage reporting
- `vercel`: CLI for deployment

**Dependency Philosophy**: Keep dependencies minimal. Only add new packages if they provide significant value and are actively maintained.

## Helpful Context for AI Assistants

### When Modifying Code

- Always prioritize security over convenience
- Maintain backward compatibility with existing database schema
- Keep API responses consistent in structure
- Add appropriate error messages for debugging
- Consider impact on CSR workflow (this is a production tool)

### When Adding Features

- Check if feature requires database migration
- Update relevant documentation files (README.md, DEPLOYMENT.md, etc.)
- Add tests before implementation (TDD approach encouraged)
- Consider mobile responsiveness for frontend changes
- Ensure accessibility (ARIA labels, keyboard navigation)

### Common Pitfalls to Avoid

- DON'T expose Supabase anon key to frontend
- DON'T bypass RLS policies
- DON'T log sensitive customer information
- DON'T use synchronous blocking operations in API endpoints
- DON'T commit environment variables or secrets
- DON'T break existing API contracts without versioning

### Project-Specific Terminology

- **CSR**: Customer Success Representative
- **Triage**: Process of analyzing and prioritizing customer tickets
- **Talking Points**: Empathetic response guidelines generated for CSRs
- **KB**: Knowledge Base (collection of help articles)
- **RLS**: Row Level Security (Supabase security feature)
- **Service Role**: Supabase admin-level access key (used server-side only)

## Related Documentation

- `README.md`: User-facing project overview and setup instructions
- `DEPLOYMENT.md`: Production deployment guide
- `COMPLETE_WORKFLOW.md`: Detailed workflow documentation
- `IMPLEMENTATION_SUMMARY.md`: Technical implementation details
- `.env.example`: Required environment variables template
- `supabase-setup.sql`: Database schema and RLS policies

## Continuous Integration

GitHub Actions workflow (`.github/workflows/`) runs on every push:

1. Install dependencies
2. Run linting checks
3. Run format checks
4. Execute test suite
5. Build production bundle
6. Run security audit

All checks must pass before merging to main branch.

## Contact and Support

For questions about architecture decisions or security concerns, refer to commit history and related documentation files. The project follows a security-first approach, so when in doubt, choose the more secure option.

---

**Last Updated**: 2025-10-16
**Project Version**: 2.0
**Node Version**: >=18.0.0
