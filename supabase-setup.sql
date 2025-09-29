-- Supabase Database Setup for INT Smart Triage AI 2.0
-- This script sets up the reports table with mandatory RLS enforcement

-- Create the reports table
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    report_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Ticket Information
    customer_name VARCHAR(100) NOT NULL,
    ticket_subject VARCHAR(200) NOT NULL,
    issue_description TEXT NOT NULL,
    customer_tone VARCHAR(20) NOT NULL CHECK (customer_tone IN ('calm', 'frustrated', 'angry', 'confused', 'urgent')),
    
    -- Triage Results
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    response_approach TEXT,
    talking_points JSONB,
    knowledge_base_articles JSONB,
    
    -- Audit and Security Fields
    csr_agent VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_report_id ON reports(report_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_csr_agent ON reports(csr_agent);

-- Create notifications table for real-time notification system
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    notification_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Notification content
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    
    -- Targeting
    target_user_id VARCHAR(100),
    broadcast_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_notification_id ON notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user_id ON notifications(target_user_id);

-- Create comments table to simulate the idea commenting system
CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    comment_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Comment content
    idea_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    comment_text TEXT NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_comment_id ON comments(comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- MANDATORY: Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- CRITICAL SECURITY REQUIREMENT: Set default DENY ALL policy for public role
-- This ensures NO client-side access to the database
CREATE POLICY "Deny all public access" ON reports
    FOR ALL 
    TO public
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access" ON notifications
    FOR ALL 
    TO public
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access" ON comments
    FOR ALL 
    TO public
    USING (false)
    WITH CHECK (false);

-- Allow service role (used by API endpoints) to perform all operations
-- This policy allows our Vercel serverless functions to access the data
CREATE POLICY "Allow service role access" ON reports
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Optional: Create a policy for authenticated CSR users (if implementing user authentication)
-- CREATE POLICY "Allow authenticated CSR access" ON reports
--     FOR SELECT 
--     TO authenticated
--     USING (auth.jwt() ->> 'role' = 'csr');

-- Create a function to check RLS status (for health checks)
CREATE OR REPLACE FUNCTION check_rls_status(table_name TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'table_name', table_name,
        'rls_enabled', 
        CASE 
            WHEN relrowsecurity THEN true 
            ELSE false 
        END,
        'policies_count', (
            SELECT COUNT(*) 
            FROM pg_policies 
            WHERE tablename = table_name
        )
    ) INTO result
    FROM pg_class 
    WHERE relname = table_name;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the RLS check function to service role
GRANT EXECUTE ON FUNCTION check_rls_status(TEXT) TO service_role;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify RLS is properly configured
DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'reports';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'reports';
    
    -- Raise notice about configuration
    IF rls_enabled THEN
        RAISE NOTICE 'SUCCESS: RLS is ENABLED on reports table';
    ELSE
        RAISE WARNING 'SECURITY ISSUE: RLS is NOT enabled on reports table';
    END IF;
    
    RAISE NOTICE 'RLS Policies configured: %', policy_count;
    
    -- Verify the deny-all policy exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' 
        AND policyname = 'Deny all public access'
    ) THEN
        RAISE NOTICE 'SUCCESS: Public access DENIED policy is active';
    ELSE
        RAISE WARNING 'SECURITY ISSUE: Public access deny policy is MISSING';
    END IF;
    
END $$;