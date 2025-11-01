import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { DatabaseService } from '../src/services/database.js';

const ORIGINAL_ENV = { ...process.env };

const restoreEnvironment = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

describe('DatabaseService configuration hardening', () => {
  beforeEach(() => {
    restoreEnvironment();
  });

  afterEach(() => {
    restoreEnvironment();
  });

  it('should throw a configuration error when service role key is missing', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    assert.throws(
      () => new DatabaseService(),
      /SUPABASE_SERVICE_ROLE_KEY.*required/i,
      'DatabaseService should enforce presence of a service role key'
    );
  });

  it('should initialize successfully when a service role key is provided', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    const service = new DatabaseService();
    assert.ok(service.isInitialized, 'DatabaseService should initialize with a service role key');
  });
});

/**
 * Security Validation Tests
 * These tests verify security requirements without requiring a live deployment
 */

describe('Security Configuration Validation', () => {
  it('should not have secrets in environment that are hardcoded', () => {
    // Verify environment variables are properly loaded, not hardcoded
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.SUPABASE_URL;
    
    // These should be undefined in test environment (good)
    // In production they would be set via Vercel
    assert.ok(typeof serviceKey === 'undefined' || serviceKey === '', 
      'Service key should not be hardcoded');
    assert.ok(typeof url === 'undefined' || url === '', 
      'URL should not be hardcoded');
  });

  it('should have gitignore configured for sensitive files', async () => {
    const fs = await import('fs/promises');
    const gitignore = await fs.readFile('.gitignore', 'utf-8');
    
    assert.ok(gitignore.includes('.env'), '.gitignore should exclude .env files');
    assert.ok(gitignore.includes('node_modules'), '.gitignore should exclude node_modules');
    assert.ok(gitignore.includes('*.key'), '.gitignore should exclude key files');
    assert.ok(gitignore.includes('*.pem'), '.gitignore should exclude pem files');
  });

  it('should have security headers defined in API endpoints', async () => {
    const fs = await import('fs/promises');

    const securityUtils = await fs.readFile('src/utils/security.js', 'utf-8');
    assert.ok(securityUtils.includes('X-Content-Type-Options'), 'Missing X-Content-Type-Options header');
    assert.ok(securityUtils.includes('X-Frame-Options'), 'Missing X-Frame-Options header');
    assert.ok(securityUtils.includes('X-XSS-Protection'), 'Missing X-XSS-Protection header');
    assert.ok(securityUtils.includes('Strict-Transport-Security'), 'Missing HSTS header');
    assert.ok(securityUtils.includes('Content-Security-Policy'), 'Missing CSP header');
    assert.ok(securityUtils.includes('Referrer-Policy'), 'Missing Referrer-Policy header');

    const endpoints = [
      'api/health-check.js',
      'api/triage-report.js',
      'api/report-submit.js'
    ];

    for (const file of endpoints) {
      const content = await fs.readFile(file, 'utf-8');
      assert.ok(content.includes('setSecurityHeaders'), `${file} must set security headers`);
    }
  });

  it('should have RLS configuration in database setup', async () => {
    const fs = await import('fs/promises');
    const setupSql = await fs.readFile('supabase-setup.sql', 'utf-8');
    
    assert.ok(setupSql.includes('ENABLE ROW LEVEL SECURITY'), 'RLS must be enabled');
    assert.ok(setupSql.includes('Deny all public access'), 'Must have deny-all policy');
    assert.ok(setupSql.includes('service_role'), 'Must have service role policy');
    assert.ok(setupSql.includes('USING (false)'), 'Public USING clause must be false');
    assert.ok(setupSql.includes('WITH CHECK (false)'), 'Public WITH CHECK clause must be false');
  });

  it('should have input validation in triage endpoint', async () => {
    const fs = await import('fs/promises');
    const triageReport = await fs.readFile('api/triage-report.js', 'utf-8');
    const validationUtils = await fs.readFile('src/utils/validation.js', 'utf-8');

    assert.ok(triageReport.includes('validateTriageRequest'), 'Triage endpoint must validate requests');
    assert.ok(triageReport.includes('sanitizeTriageData'), 'Triage endpoint must sanitize data');
    assert.ok(triageReport.includes('Validation Error'), 'Should have validation error handling');

    assert.ok(validationUtils.includes('substring(0, 100)'), 'Customer name limit must be enforced');
    assert.ok(validationUtils.includes('substring(0, 200)'), 'Ticket subject limit must be enforced');
    assert.ok(validationUtils.includes('substring(0, 2000)'), 'Issue description limit must be enforced');
    assert.ok(validationUtils.includes("'calm'"), 'Customer tone whitelist must include calm');
    assert.ok(validationUtils.includes("'urgent'"), 'Customer tone whitelist must include urgent');
  });

  it('should use service role key, not anon key', async () => {
    const fs = await import('fs/promises');
    const triageReport = await fs.readFile('api/triage-report.js', 'utf-8');
    const healthCheck = await fs.readFile('api/health-check.js', 'utf-8');
    const reportSubmit = await fs.readFile('api/report-submit.js', 'utf-8');

    for (const file of [triageReport, healthCheck, reportSubmit]) {
      assert.ok(file.includes('DatabaseService'), 'Endpoints must use DatabaseService for service role access');
      assert.ok(!file.includes('SUPABASE_ANON_KEY'), 'Anon key must not be referenced in endpoints');
    }
  });

  it('should require service role configuration in database service', async () => {
    const fs = await import('fs/promises');
    const databaseService = await fs.readFile('src/services/database.js', 'utf-8');

    assert.ok(databaseService.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Service role key must be required');
    assert.ok(!databaseService.includes('VITE_SUPABASE_ANON_KEY'), 'Database service must not fall back to anon key');
  });

  it('should have audit logging fields in database schema', async () => {
    const fs = await import('fs/promises');
    const setupSql = await fs.readFile('supabase-setup.sql', 'utf-8');
    
    assert.ok(setupSql.includes('csr_agent'), 'Must log CSR agent');
    assert.ok(setupSql.includes('ip_address'), 'Must log IP address');
    assert.ok(setupSql.includes('user_agent'), 'Must log user agent');
    assert.ok(setupSql.includes('session_id'), 'Must log session ID');
    assert.ok(setupSql.includes('created_at'), 'Must log creation time');
    assert.ok(setupSql.includes('processed_at'), 'Must log processing time');
  });

  it('should have proper indexes for performance', async () => {
    const fs = await import('fs/promises');
    const setupSql = await fs.readFile('supabase-setup.sql', 'utf-8');
    
    assert.ok(setupSql.includes('idx_reports_report_id'), 'Must have report_id index');
    assert.ok(setupSql.includes('idx_reports_created_at'), 'Must have created_at index');
    assert.ok(setupSql.includes('idx_reports_priority'), 'Must have priority index');
    assert.ok(setupSql.includes('idx_reports_csr_agent'), 'Must have csr_agent index');
  });

  it('should not expose internal errors in production', async () => {
    const fs = await import('fs/promises');
    const triageReport = await fs.readFile('api/triage-report.js', 'utf-8');
    
    assert.ok(triageReport.includes('NODE_ENV'), 'Should check environment');
    assert.ok(triageReport.includes('development'), 'Should differentiate dev/prod');
    assert.ok(triageReport.includes('Internal Server Error'), 'Should have generic error message');
  });

  it('should have method restrictions on API endpoints', async () => {
    const fs = await import('fs/promises');
    const healthCheck = await fs.readFile('api/health-check.js', 'utf-8');
    const triageReport = await fs.readFile('api/triage-report.js', 'utf-8');
    const reportSubmit = await fs.readFile('api/report-submit.js', 'utf-8');

    assert.ok(healthCheck.includes('validateHttpMethod'), 'Health check should validate HTTP methods');
    assert.ok(triageReport.includes('validateHttpMethod'), 'Triage endpoint should validate HTTP methods');
    assert.ok(reportSubmit.includes('validateHttpMethod'), 'Report submission should validate HTTP methods');

    assert.ok(healthCheck.includes("['GET']"), 'Health check must allow only GET');
    assert.ok(triageReport.includes("['POST']"), 'Triage endpoint must allow only POST');
    assert.ok(reportSubmit.includes("['POST']"), 'Report submission must allow only POST');
  });

  it('should validate public report submission endpoint', async () => {
    const fs = await import('fs/promises');
    const reportSubmit = await fs.readFile('api/report-submit.js', 'utf-8');

    assert.ok(reportSubmit.includes('Validation Error'), 'Report submission should reject invalid payloads');
    assert.ok(reportSubmit.includes('createRateLimiter'), 'Report submission should rate limit clients');
    assert.ok(reportSubmit.includes('sanitizeReportSubmission'), 'Report submission should sanitize data');
  });

  it('should restrict report insertion policies to authenticated roles', async () => {
    const fs = await import('fs/promises');
    const migration = await fs.readFile('supabase/migrations/20251007140835_allow_anon_insert_reports.sql', 'utf-8');

    assert.ok(!migration.includes('TO anon'), 'Anon role must not have insert access');
    assert.ok(migration.includes('TO authenticated'), 'Authenticated users should have insert access');
    assert.ok(migration.includes('TO service_role'), 'Service role should retain insert access');
  });
});

describe('Database Security Validation', () => {
  it('should have CHECK constraints on critical fields', async () => {
    const fs = await import('fs/promises');
    const setupSql = await fs.readFile('supabase-setup.sql', 'utf-8');
    
    assert.ok(setupSql.includes('CHECK (customer_tone IN'), 'Customer tone must have CHECK constraint');
    assert.ok(setupSql.includes('CHECK (priority IN'), 'Priority must have CHECK constraint');
    assert.ok(setupSql.includes('CHECK (confidence_score'), 'Confidence score must have range check');
  });

  it('should have NOT NULL constraints on required fields', async () => {
    const fs = await import('fs/promises');
    const setupSql = await fs.readFile('supabase-setup.sql', 'utf-8');
    
    assert.ok(setupSql.includes('customer_name VARCHAR(100) NOT NULL'), 'Customer name must be NOT NULL');
    assert.ok(setupSql.includes('ticket_subject VARCHAR(200) NOT NULL'), 'Ticket subject must be NOT NULL');
    assert.ok(setupSql.includes('issue_description TEXT NOT NULL'), 'Issue description must be NOT NULL');
    assert.ok(setupSql.includes('csr_agent VARCHAR(50) NOT NULL'), 'CSR agent must be NOT NULL');
  });

  it('should have UNIQUE constraint on report_id', async () => {
    const fs = await import('fs/promises');
    const setupSql = await fs.readFile('supabase-setup.sql', 'utf-8');
    
    assert.ok(setupSql.includes('report_id VARCHAR(50) UNIQUE NOT NULL'), 'Report ID must be unique');
  });

  it('should use appropriate field types for security', async () => {
    const fs = await import('fs/promises');
    const setupSql = await fs.readFile('supabase-setup.sql', 'utf-8');
    
    assert.ok(setupSql.includes('INET'), 'IP address should use INET type');
    assert.ok(setupSql.includes('TIMESTAMPTZ'), 'Timestamps should include timezone');
    assert.ok(setupSql.includes('JSONB'), 'JSON fields should use JSONB');
  });
});

describe('Code Security Validation', () => {
  it('should not have hardcoded credentials in codebase', async () => {
    const fs = await import('fs/promises');

    // Check main API files for hardcoded credentials
    const filesToCheck = [
      'api/health-check.js',
      'api/triage-report.js',
      'api/report-submit.js',
      'index.js'
    ];
    
    for (const file of filesToCheck) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check for common credential patterns
      assert.ok(!content.match(/password\s*=\s*["'][^"']+["']/i), 
        `${file} should not contain hardcoded passwords`);
      assert.ok(!content.match(/api[_-]?key\s*=\s*["'][a-zA-Z0-9]{20,}["']/i), 
        `${file} should not contain hardcoded API keys`);
      assert.ok(!content.match(/secret\s*=\s*["'][a-zA-Z0-9]{20,}["']/i), 
        `${file} should not contain hardcoded secrets`);
      assert.ok(!content.match(/https:\/\/[a-z0-9]{20,}\.supabase\.co/i), 
        `${file} should not contain hardcoded Supabase URLs`);
    }
  });

  it('should use crypto for random ID generation', async () => {
    const fs = await import('fs/promises');
    const triageReport = await fs.readFile('api/triage-report.js', 'utf-8');
    
    assert.ok(triageReport.includes("import crypto from 'crypto'"), 'Should import crypto module');
    assert.ok(triageReport.includes('crypto.randomBytes'), 'Should use crypto.randomBytes for IDs');
  });

  it('should have error logging but not sensitive data logging', async () => {
    const fs = await import('fs/promises');
    const triageReport = await fs.readFile('api/triage-report.js', 'utf-8');
    
    assert.ok(triageReport.includes('console.error'), 'Should log errors');
    // Ensure we're not logging the entire request body with sensitive data
    assert.ok(!triageReport.includes('console.log(req.body)'), 'Should not log entire request body');
  });
});

describe('Documentation Validation', () => {
  it('should have comprehensive deployment documentation', async () => {
    const fs = await import('fs/promises');
    const deployment = await fs.readFile('DEPLOYMENT.md', 'utf-8');
    
    assert.ok(deployment.includes('Security'), 'Must document security features');
    assert.ok(deployment.includes('RLS'), 'Must document RLS');
    assert.ok(deployment.includes('HTTPS'), 'Must document HTTPS');
    assert.ok(deployment.includes('Environment Variables'), 'Must document env vars');
    assert.ok(deployment.includes('service_role'), 'Must document service role');
    assert.ok(deployment.includes('Troubleshooting'), 'Must have troubleshooting section');
  });

  it('should have security verification checklist', async () => {
    const fs = await import('fs/promises');
    const deployment = await fs.readFile('DEPLOYMENT.md', 'utf-8');
    
    assert.ok(deployment.includes('Security Verification Checklist'), 'Must have security checklist');
    assert.ok(deployment.includes('RLS Enabled'), 'Checklist must include RLS');
    assert.ok(deployment.includes('Input Validation'), 'Checklist must include input validation');
    assert.ok(deployment.includes('Audit Logging'), 'Checklist must include audit logging');
  });

  it('should have Pre-Mortem Risk Report', async () => {
    const fs = await import('fs/promises');
    
    try {
      const riskReport = await fs.readFile('PRE_MORTEM_RISK_REPORT.md', 'utf-8');
      assert.ok(riskReport.includes('Risk'), 'Must be a risk report');
      assert.ok(riskReport.includes('Mitigation'), 'Must include mitigations');
      assert.ok(riskReport.includes('Security'), 'Must cover security risks');
    } catch (err) {
      assert.fail('PRE_MORTEM_RISK_REPORT.md must exist');
    }
  });

  it('should have Final Audit Report', async () => {
    const fs = await import('fs/promises');
    
    try {
      const auditReport = await fs.readFile('FINAL_AUDIT_REPORT.md', 'utf-8');
      assert.ok(auditReport.includes('Audit'), 'Must be an audit report');
      assert.ok(auditReport.includes('Compliance'), 'Must cover compliance');
      assert.ok(auditReport.includes('Security'), 'Must cover security');
      assert.ok(auditReport.includes('APPROVED') || auditReport.includes('PASS'), 
        'Must have approval status');
    } catch (err) {
      assert.fail('FINAL_AUDIT_REPORT.md must exist');
    }
  });
});

describe('Supabase Client Configuration', () => {
  it('should disable session persistence for security', async () => {
    const fs = await import('fs/promises');
    const databaseService = await fs.readFile('src/services/database.js', 'utf-8');

    assert.ok(databaseService.includes('persistSession: false'), 'Must disable session persistence');
  });

  it('should disable auto-refresh for security', async () => {
    const fs = await import('fs/promises');
    const databaseService = await fs.readFile('src/services/database.js', 'utf-8');

    assert.ok(databaseService.includes('autoRefreshToken: false'), 'Must disable auto-refresh');
  });
});

describe('Input Sanitization Logic', () => {
  it('should have length limits on all text inputs', async () => {
    const fs = await import('fs/promises');
    const validationUtils = await fs.readFile('src/utils/validation.js', 'utf-8');

    assert.ok(validationUtils.includes('substring(0, 100)'), 'Customer name limit');
    assert.ok(validationUtils.includes('substring(0, 200)'), 'Ticket subject limit');
    assert.ok(validationUtils.includes('substring(0, 2000)'), 'Issue description limit');
    assert.ok(validationUtils.includes('substring(0, 50)'), 'CSR agent limit');
  });

  it('should validate customer tone against whitelist', async () => {
    const fs = await import('fs/promises');
    const validationUtils = await fs.readFile('src/utils/validation.js', 'utf-8');

    assert.ok(validationUtils.includes("'calm'"), 'Must include calm tone');
    assert.ok(validationUtils.includes("'frustrated'"), 'Must include frustrated tone');
    assert.ok(validationUtils.includes("'angry'"), 'Must include angry tone');
    assert.ok(validationUtils.includes("'confused'"), 'Must include confused tone');
    assert.ok(validationUtils.includes("'urgent'"), 'Must include urgent tone');
  });
});

describe('Response Structure Validation', () => {
  it('should validate triage response structure', async () => {
    const fs = await import('fs/promises');
    const triageReport = await fs.readFile('api/triage-report.js', 'utf-8');
    
    assert.ok(triageReport.includes('priority'), 'Response must include priority');
    assert.ok(triageReport.includes('confidence'), 'Response must include confidence');
    assert.ok(triageReport.includes('responseApproach'), 'Response must include approach');
    assert.ok(triageReport.includes('talkingPoints'), 'Response must include talking points');
    assert.ok(triageReport.includes('knowledgeBase'), 'Response must include KB articles');
  });

  it('should include security confirmation in response', async () => {
    const fs = await import('fs/promises');
    const triageReport = await fs.readFile('api/triage-report.js', 'utf-8');
    
    assert.ok(triageReport.includes('rlsEnforced'), 'Response must confirm RLS');
    assert.ok(triageReport.includes('auditLogged'), 'Response must confirm audit logging');
  });
});
