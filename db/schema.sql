-- INT Smart Triage AI 2.0 Database Schema
-- Secure audit table with Row Level Security (RLS)

-- Create reports table for audit logging
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    inquiry_summary TEXT NOT NULL,
    report_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Deny all access by default" ON reports;
DROP POLICY IF EXISTS "Allow service_role full access" ON reports;

-- Create deny-all-by-default policy
CREATE POLICY "Deny all access by default"
    ON reports
    FOR ALL
    TO PUBLIC
    USING (false)
    WITH CHECK (false);

-- Create policy allowing only service_role to insert and select
CREATE POLICY "Allow service_role full access"
    ON reports
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions to service_role
GRANT ALL ON reports TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;