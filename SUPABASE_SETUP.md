# Supabase Setup Guide

This document provides instructions for setting up the Supabase database schema with Row Level Security (RLS) for the INT Smart Triage AI 2.0 application.

## Prerequisites

- Supabase project created
- Supabase CLI installed (optional but recommended)
- Database access via Supabase dashboard or psql

## Database Schema Setup

### 1. Apply SQL Schema

Execute the SQL schema located at `db/schema.sql` in your Supabase database:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `db/schema.sql`
4. Click "Run" to execute the schema

**Option B: Using Supabase CLI**
```bash
supabase db push
```

**Option C: Using psql**
```bash
psql -h your-project.supabase.co -U postgres -d postgres < db/schema.sql
```

### 2. Verify Row Level Security (RLS)

After applying the schema, verify that RLS is properly configured:

#### Check RLS is Enabled
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';
```
Expected result: `rowsecurity` should be `true`

#### Check Policies
```sql
SELECT tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reports';
```
Expected result: Two policies should be present:
- "Deny all access by default" 
- "Allow service_role full access"

### 3. Test RLS Configuration

#### Test Anonymous Access (Should Fail)
```sql
-- This should return no results or error
SET ROLE anon;
SELECT * FROM reports;
INSERT INTO reports (user_id, domain, inquiry_summary, report_data) 
VALUES ('test', 'test.com', 'test summary', '{"test": true}');
```

#### Test Service Role Access (Should Succeed)
```sql
-- This should work
SET ROLE service_role;
INSERT INTO reports (user_id, domain, inquiry_summary, report_data) 
VALUES ('test_user', 'example.com', 'Test inquiry', '{"status": "processed"}');
SELECT * FROM reports;
```

## Security Guidelines

⚠️ **CRITICAL SECURITY RULES**

### DO NOT use the service_role key in client-side code
- The `service_role` key bypasses RLS and should NEVER be used in frontend applications
- Only use `service_role` key in secure server-side environments (Vercel serverless functions)
- Always use the `anon` key for client-side operations

### Proper Key Usage
- **Frontend/Client**: Use `anon` key only
- **Server-side functions**: Use `service_role` key for database operations
- **Admin operations**: Use `service_role` key in secure backend contexts only

## Acceptance Criteria Checklist

Use this checklist to verify successful setup:

- [ ] **Database Schema Applied**
  - [ ] `reports` table created with correct columns (id, user_id, domain, inquiry_summary, report_data, created_at)
  - [ ] RLS enabled on `reports` table
  - [ ] Deny-all-by-default policy created
  - [ ] Service role policy created for inserts/selects

- [ ] **RLS Security Verification**
  - [ ] Anonymous role (`anon`) blocked from accessing reports table
  - [ ] Service role can successfully insert records
  - [ ] Service role can successfully select records
  - [ ] Public access denied by default

- [ ] **Documentation Complete**
  - [ ] Setup instructions provided
  - [ ] Security guidelines documented
  - [ ] Testing procedures outlined
  - [ ] Acceptance criteria checklist present

- [ ] **Production Readiness**
  - [ ] Never use service key in client-side code
  - [ ] Server-side functions use service_role key appropriately
  - [ ] RLS policies tested and verified

## Troubleshooting

### Common Issues

1. **"permission denied for table reports"**
   - Check that RLS policies are correctly applied
   - Verify you're using the correct role (service_role for server operations)

2. **"row-level security policy violation"**
   - Ensure you're not using anon key for insert/select operations
   - Verify service_role policy is active

3. **Schema application fails**
   - Check for existing table conflicts
   - Verify database connection and permissions

### Support

For additional support, refer to:
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Policies Guide](https://supabase.com/docs/guides/auth/policies)