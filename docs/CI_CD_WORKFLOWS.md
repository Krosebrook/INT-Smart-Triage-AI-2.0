# CI/CD Workflow Documentation

This document explains the CI/CD setup for INT Smart Triage AI 2.0, implementing a split between offline unit tests and manual integration tests.

## Workflow Structure

### 1. Unit Tests (Offline) - `.github/workflows/unit.yml`

**Purpose:** Deterministic testing without network dependencies
**Trigger:** Automatic on PRs and pushes to main/develop branches
**Network Policy:** No network access - isolated testing environment

**Features:**
- Fast feedback for all pull requests
- No external dependencies or API calls
- Test coverage reporting
- Deterministic results ensuring consistent CI behavior

**Duration:** ~2-5 minutes

### 2. Integration Tests (Manual) - `.github/workflows/integration.yml`

**Purpose:** End-to-end testing with external services
**Trigger:** Manual execution via `workflow_dispatch`
**Network Policy:** Full network access for external service integration

**Features:**
- Sandbox Supabase database testing
- Dummy Gemini API key configuration
- Database schema application (idempotent)
- API endpoint testing with verification
- Database insert validation

**Function Durations:**
- Database schema application: ~10-15 seconds
- Health check endpoint test: ~2-3 seconds
- Triage report test with DB verification: ~5-10 seconds
- Total workflow runtime: ~2-3 minutes

## Environment Configuration

### Sandbox Credentials (Safe for Testing)

The integration workflow uses sandbox/dummy credentials that are safe for testing:

```yaml
# Sandbox Supabase (non-production)
SUPABASE_URL: https://sandbox-project.supabase.co
SUPABASE_ANON_KEY: dummy-sandbox-key
SUPABASE_SERVICE_KEY: dummy-service-key

# Dummy Gemini API (non-functional testing key)
GEMINI_API_KEY: dummy-gemini-api-key-for-testing

# Test Database
DATABASE_URL: postgresql://dummy:dummy@localhost:5432/test
```

### Secrets Configuration

To configure real sandbox credentials, set these GitHub repository secrets:
- `SANDBOX_SUPABASE_URL`
- `SANDBOX_SUPABASE_ANON_KEY` 
- `SANDBOX_SUPABASE_SERVICE_KEY`
- `DUMMY_GEMINI_KEY`
- `SANDBOX_DATABASE_URL`

## API Endpoints Tested

### Health Check - `GET /api/health`
- Returns server status and metadata
- Used to verify server availability
- No authentication required

### Triage Report - `POST /api/triage-report`
- Accepts triage report data
- Validates required fields
- Simulates database insert
- Returns success confirmation with generated ID

**Sample Request:**
```json
{
  "ticketId": "TEST-12345",
  "priority": "medium",
  "category": "technical",
  "summary": "Customer experiencing login issues",
  "suggestedResponse": "Please try clearing browser cache",
  "kbArticles": ["article-1", "article-2"],
  "timestamp": "2025-09-29T08:00:00Z"
}
```

## Database Schema

The `db/schema.sql` file contains:
- `triage_reports` table with proper indexes
- `triage_audit` table for change tracking
- `users` table for CSR management
- Idempotent CREATE statements (safe to run multiple times)
- Automatic timestamp triggers

## Usage Instructions

### For Developers

1. **Create a Pull Request:**
   - Unit tests run automatically
   - PR is blocked if unit tests fail
   - Integration tests are optional

2. **Run Integration Tests (Optional):**
   - Go to Actions tab in GitHub
   - Select "Integration Tests (Manual)"
   - Click "Run workflow"
   - Choose environment (sandbox/staging)

### For Maintainers

1. **Unit Test Failures:**
   - Check test output in PR checks
   - Fix issues before merging
   - No network dependencies should be added to unit tests

2. **Integration Test Failures:**
   - Verify sandbox credentials are correct
   - Check if external services are available
   - Review API endpoint implementations
   - Validate database schema changes

## Network Policy Details

### Unit Tests
- **Network Access:** ❌ Disabled
- **External APIs:** ❌ Not allowed
- **Database:** ❌ No real database connections
- **Purpose:** Fast, deterministic testing

### Integration Tests
- **Network Access:** ✅ Enabled
- **External APIs:** ✅ Sandbox/dummy credentials only
- **Database:** ✅ Sandbox database testing
- **Purpose:** End-to-end validation

## Security Considerations

1. **Sandbox Only:** Integration tests use sandbox/dummy credentials
2. **No Production Data:** All test data is synthetic
3. **Manual Trigger:** Integration tests don't run automatically
4. **Secret Management:** Credentials stored as GitHub secrets
5. **Network Isolation:** Unit tests have no network access

## Future Enhancements

- Add real unit test implementations
- Integrate with actual Supabase sandbox
- Add more comprehensive API testing
- Implement database rollback after tests
- Add performance benchmarking
- Include security scanning