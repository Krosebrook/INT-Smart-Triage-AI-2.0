# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of INT Smart Triage AI 2.0 seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** share the vulnerability publicly until it has been addressed
- **Do not** exploit the vulnerability beyond what is necessary to demonstrate it

### Please Do

1. **Email us directly** at security@int-inc.com (or create a private security advisory on GitHub)
2. **Provide detailed information** about the vulnerability:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Allow reasonable time** for us to respond and address the issue

### What to Expect

- **Acknowledgment**: We will acknowledge your report within 48 hours
- **Updates**: We will keep you informed about our progress
- **Fix**: We aim to release a fix within 30 days for critical vulnerabilities
- **Credit**: With your permission, we will acknowledge your contribution

## Security Best Practices

### For Users

1. **Environment Variables**
   - Never commit `.env` files
   - Use Vercel dashboard for secret management
   - Rotate credentials regularly
   - Use different keys for dev/staging/production

2. **Dependencies**
   - Keep dependencies up to date
   - Review Dependabot PRs promptly
   - Run `npm audit` regularly
   - Address high/critical vulnerabilities immediately

3. **Access Control**
   - Use strong, unique passwords
   - Enable 2FA on all accounts
   - Follow principle of least privilege
   - Review access logs regularly

### For Developers

1. **Input Validation**
   ```javascript
   // Always validate and sanitize user input
   const validation = validateTriageRequest(data);
   if (!validation.isValid) {
     return res.status(400).json({ error: validation.errors });
   }
   const sanitized = sanitizeTriageData(data);
   ```

2. **Security Headers**
   ```javascript
   // Always set security headers
   setSecurityHeaders(res);
   ```

3. **Rate Limiting**
   ```javascript
   // Implement rate limiting on all endpoints
   if (!rateLimiter(req, res)) {
     return; // Request blocked
   }
   ```

4. **Database Security**
   - Use Row Level Security (RLS) on all tables
   - Use parameterized queries
   - Never expose service role keys client-side
   - Use service role only in serverless functions
   - Validate browser anon-key sessions cannot bypass RLS (run policy smoke tests each release)

## Security Features

### Current Implementation

1. **Row Level Security (RLS)**
   - Mandatory RLS on all Supabase tables
   - Service role authentication for API
   - Browser Supabase client uses anon key; policies restrict CSR visibility to authorized rows only

2. **Input Sanitization**
   - XSS prevention
   - SQL injection prevention
   - HTML entity encoding
   - Control character removal

3. **Security Headers**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security: max-age=31536000`

4. **Rate Limiting**
   - 50 requests per minute per endpoint
   - IP-based tracking
   - Automatic request blocking

5. **Audit Logging**
   - All triage requests logged
   - IP address tracking
   - Timestamp recording
   - User agent logging

### Automated Security

1. **Dependabot**
   - Weekly dependency scans
   - Automatic security updates
   - Grouped non-security updates

2. **npm audit**
   - CI/CD integration
   - Automated vulnerability detection
   - Artifact retention for audit trail

3. **GitHub Security**
   - Code scanning (recommended)
   - Secret scanning
   - Dependency graph

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Acknowledgment sent
3. **Day 3-7**: Initial assessment and response plan
4. **Day 8-30**: Fix development and testing
5. **Day 30**: Public disclosure (if applicable)

## Security Updates

Security updates are released as soon as fixes are available and tested. We will:

1. Release patch version (e.g., 1.1.0 → 1.1.1)
2. Update CHANGELOG.md with security notice
3. Notify users through GitHub releases
4. Update documentation if needed

## Known Security Considerations

### Development Dependencies

Current vulnerabilities are in development dependencies only (vercel CLI):
- **Production**: ✅ No vulnerabilities
- **Development**: 14 vulnerabilities (1 low, 5 moderate, 8 high)
- **Impact**: Dev dependencies not included in production build
- **Status**: Monitored, will be resolved with Vercel CLI update

See [CI_CD_RESOLUTION_SUMMARY.md](CI_CD_RESOLUTION_SUMMARY.md) for details.

### Environment Variables

Required secrets (never commit):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

### Browser Supabase Client

- **Risk**: CSR dashboard runs the Supabase JS client with the anon key. Any missing or overly broad RLS policy will expose data immediately.
- **Mitigation**: Enforce deny-by-default policies for every table listed in `supabase-setup.sql`, add automated checks that query with an anonymous session, and restrict columns to only those needed by the UI.
- **Operator Action**: Re-run the RLS verification steps in `DEPLOYMENT.md` after every schema or policy change.

### API Security

All API endpoints implement:
- Input validation
- Rate limiting
- Security headers
- Error handling without information leakage

## Security Contacts

- **Email**: security@int-inc.com
- **GitHub**: [Security Advisories](https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0/security/advisories)
- **Emergency**: For critical issues affecting production systems

## Additional Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Vercel Security](https://vercel.com/docs/concepts/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Last Updated**: October 2025  
**Next Review**: January 2026

Thank you for helping keep INT Smart Triage AI 2.0 secure! 🔒
