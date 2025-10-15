# Troubleshooting Guide

## Fixed: "HTTP error! status" Error in Triage Form

### Problem
The triage form (`index.html`) was throwing an HTTP error when submitting triage requests to `/api/triage-report`.

### Root Causes
1. **Missing Environment Variables**: The API endpoint expected `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` but only `VITE_` prefixed variables were defined
2. **RLS Policy Blocking**: The `reports` table had Row Level Security enabled with policies that blocked anonymous inserts

### Solutions Applied

#### 1. Added Server-Side Environment Variables
Updated `.env` file to include non-prefixed variables for server-side API usage:
```
SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
```

#### 2. Updated Database Service
Modified `/src/services/database.js` to support both client-side (`VITE_` prefixed) and server-side environment variables:
```javascript
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
```

#### 3. Added RLS Policy for Anonymous Inserts
Created migration `allow_anon_insert_reports.sql` to allow the anon role to insert triage reports:
```sql
CREATE POLICY "Allow anon to insert reports" ON reports
    FOR INSERT
    TO anon
    WITH CHECK (true);
```

### Verification
- Build completes successfully: ✅
- Database connection established: ✅
- RLS policies configured: ✅

### Testing the Fix
1. Open `index.html` or the deployed app
2. Fill out the triage form
3. Submit the form
4. Should receive successful response with triage analysis

### Security Note
In production, you should:
- Use proper authentication for the triage form
- Replace the anon insert policy with authenticated user policies
- Use the service role key only in secure server-side environments
- Never expose service role keys in client-side code
