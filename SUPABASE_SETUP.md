# Supabase Database Setup for INT Smart Triage AI

## Required Environment Variables

Set these in your Vercel project dashboard:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema

### Reports Table

```sql
-- Create the reports table
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    ticket_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    suggested_response TEXT NOT NULL,
    knowledge_base_articles TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Configuration

### Row Level Security (RLS) - MANDATORY

```sql
-- Enable RLS on the reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy to DENY ALL public access (MANDATORY for security)
CREATE POLICY "Deny all public access" ON reports
FOR ALL TO PUBLIC
USING (false);

-- Service role operations are automatically allowed
-- This ensures only our backend API can access the data
```

## Verification Commands

```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reports';
```

## Security Notes

1. **RLS Protection**: The 'DENY ALL' policy ensures no public access to the reports table
2. **Service Role Only**: Only the backend API using the service role key can write/read data
3. **No Direct Access**: Frontend users cannot directly access the database
4. **Secure Communication**: All data flows through authenticated serverless functions

## Testing

1. Verify health check: `GET /api/health-check`
2. Test secure database write: `POST /api/triage-report` with valid payload
3. Confirm RLS blocks direct database access from client-side code