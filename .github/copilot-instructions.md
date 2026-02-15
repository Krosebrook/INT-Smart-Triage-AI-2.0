# GitHub Copilot Instructions for INT Smart Triage AI 2.0

## Project Overview

INT Smart Triage AI 2.0 is a secure, production-ready AI-powered ticket triage system for INT Inc. Customer Success Representatives. The system processes customer tickets, assigns priorities, provides empathetic response guidelines, suggests Knowledge Base articles, and maintains comprehensive audit logging.

## Architecture

- **Frontend**: Vanilla JavaScript with modern CSS (no framework dependencies)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Supabase (PostgreSQL) with mandatory Row Level Security (RLS)
- **Deployment**: Vercel with CI/CD via GitHub Actions
- **Security**: Enterprise-grade with comprehensive audit logging and RLS enforcement

## Security Requirements

### Critical Security Principles

1. **Row Level Security (RLS) is Mandatory**
   - ALL database access MUST use RLS
   - NEVER allow direct client-side database access
   - Use `service_role` key for server-side operations only
   - NEVER use `anon` key in production code

2. **Environment Variables**
   - ALL secrets MUST be stored as Vercel environment variables
   - Required variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - NEVER commit secrets or keys to the repository
   - Use `.env.example` for documentation only

3. **Input Validation & Sanitization**
   - Validate ALL user inputs before processing
   - Sanitize inputs to prevent injection attacks
   - Enforce length limits on all text fields
   - Validate enum values (e.g., customer tone must be one of: calm, frustrated, angry, confused, urgent)

4. **Security Headers**
   - Always set these headers on API responses:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `X-XSS-Protection: 1; mode=block`
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

5. **Audit Logging**
   - Log ALL triage requests to database with metadata
   - Include: IP address, session ID, timestamp, CSR agent
   - Never expose sensitive data in logs

## Code Style & Patterns

### JavaScript

- Use modern ES6+ syntax (const, let, arrow functions, async/await)
- Use ESLint configuration in `.eslintrc.cjs`
- Prefer `const` over `let`, never use `var`
- Use meaningful variable names that reflect the data they hold
- Add JSDoc comments for functions in API endpoints
- Follow existing patterns in `/api/triage-report.js` and `/api/health-check.js`

### Error Handling

- Always wrap async operations in try-catch blocks
- Return structured error responses: `{ error: 'ErrorType', message: 'Description' }`
- Use appropriate HTTP status codes (400 for validation, 500 for server errors, 503 for service unavailable)
- Log errors for debugging but never expose sensitive details to clients

### API Endpoints

- Export a default async function named `handler(req, res)`
- Validate HTTP method first (e.g., only GET or POST)
- Set security headers immediately after method validation
- Validate and sanitize all inputs before processing
- Use Supabase client with service role key for database operations
- Return JSON responses with appropriate status codes

## Database Operations

### Supabase Client Initialization

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
```

### Database Schema

The `reports` table has the following structure:
- `report_id` (text, primary key)
- `customer_name` (text)
- `ticket_subject` (text)
- `issue_description` (text)
- `customer_tone` (text)
- `priority` (text)
- `confidence_score` (numeric)
- `response_approach` (text)
- `talking_points` (jsonb array)
- `knowledge_base_articles` (jsonb array)
- `csr_agent` (text)
- `client_ip` (text)
- `session_id` (text)
- `created_at` (timestamp)

### Query Patterns

- Use `.select()` for reads
- Use `.insert()` for writes
- Always check for errors: `if (error) { throw error; }`
- Use `.single()` when expecting one result

## Testing & Quality

### Before Submitting Code

1. Lint your code: Ensure it follows ESLint rules
2. Test locally: Use `vercel dev` to test serverless functions
3. Verify security: Check that no secrets are committed
4. Test error cases: Validate error handling works correctly
5. Check RLS: Ensure database operations use service role

### Manual Testing

Test endpoints using curl:
```bash
# Replace <YOUR_DEPLOYMENT_URL> with your actual deployed app domain (e.g., https://myproject.vercel.app)

# Health check
curl https://<YOUR_DEPLOYMENT_URL>/api/health-check

# Triage report
curl -X POST https://<YOUR_DEPLOYMENT_URL>/api/triage-report \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test","ticketSubject":"Issue","issueDescription":"Problem","customerTone":"calm","csrAgent":"TEST"}'
```

## Common Tasks

### Adding a New API Endpoint

1. Create new file in `/api/` directory (e.g., `/api/new-endpoint.js`)
2. Export default async handler function
3. Add security headers
4. Validate HTTP method and inputs
5. Implement business logic
6. Return appropriate JSON response
7. Test thoroughly before committing

### Modifying Database Schema

1. Update `supabase-setup.sql` with schema changes
2. Update relevant API endpoints to handle new fields
3. Update validation logic to include new fields
4. Update documentation in `DEPLOYMENT.md`
5. Test with existing data to ensure backward compatibility

### Adding New Validation Rules

1. Define validation constants at the top of the file
2. Implement validation before processing requests
3. Return 400 status with clear error message for validation failures
4. Add validation for both type and business logic constraints

## File Structure

```
├── api/
│   ├── health-check.js       # System health check with RLS verification
│   └── triage-report.js      # Main triage processing endpoint
├── data/
│   ├── kb.json              # Knowledge base articles
│   └── personas.json        # CSR personas
├── public/
│   └── demo.html            # Demo interface
├── test/
│   └── index.test.js        # Test suite
├── index.html               # Main CSR dashboard
├── index.js                 # Entry point
├── supabase-setup.sql       # Database schema with RLS
├── DEPLOYMENT.md            # Deployment guide
├── README.md                # Project documentation
└── vercel.json              # Vercel configuration
```

## Documentation

When making changes:
- Update `README.md` for user-facing changes
- Update `DEPLOYMENT.md` for deployment-related changes
- Add comments in code for complex logic
- Keep documentation accurate and up-to-date

## Best Practices

1. **Security First**: Always consider security implications before implementing features
2. **Minimal Dependencies**: Avoid adding new dependencies unless absolutely necessary
3. **Performance**: Use caching where appropriate (e.g., health check has 10s cache)
4. **Error Messages**: Provide helpful error messages that guide users to fix issues
5. **Consistency**: Follow existing patterns and conventions in the codebase
6. **Documentation**: Document why, not just what (code should be self-documenting for "what")

## Common Pitfalls to Avoid

- ❌ Don't use `anon` key - always use `service_role` key for server operations
- ❌ Don't skip input validation - validate everything from user input
- ❌ Don't expose internal errors - sanitize error messages before returning to client
- ❌ Don't commit environment variables or secrets
- ❌ Don't bypass RLS - it's a critical security feature
- ❌ Don't add console.log in production code (except in index.js which is allowed)
- ❌ Don't use `var` - use `const` or `let`
- ❌ Don't skip security headers on API responses

## Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Project Deployment Guide**: See `DEPLOYMENT.md`
- **Database Schema**: See `supabase-setup.sql`

## Getting Help

For questions or issues:
1. Check `DEPLOYMENT.md` for deployment-related questions
2. Review existing code for patterns and examples
3. Check Vercel logs for runtime errors
4. Verify Supabase dashboard for database issues
