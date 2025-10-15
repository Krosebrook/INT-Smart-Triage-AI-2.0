/*
  # INT Smart Triage AI - Reports Table Setup

  1. New Tables
    - `reports`
      - `id` (bigserial, primary key) - Auto-incrementing ID
      - `report_id` (varchar, unique) - Human-readable report identifier
      - `customer_name` (varchar) - Name of the customer
      - `ticket_subject` (varchar) - Subject line of the ticket
      - `issue_description` (text) - Full description of the issue
      - `customer_tone` (varchar) - Detected customer tone (calm, frustrated, angry, confused, urgent)
      - `priority` (varchar) - Triage priority (low, medium, high)
      - `category` (varchar) - Issue category (authentication, performance, billing, integration, ui, general)
      - `confidence_score` (decimal) - AI confidence score (0-100)
      - `response_approach` (text) - Recommended response approach
      - `talking_points` (jsonb) - Array of talking points for CSR
      - `knowledge_base_articles` (jsonb) - Array of relevant KB articles
      - `metadata` (jsonb) - Additional metadata about the triage
      - `csr_agent` (varchar) - CSR agent handling the ticket
      - `ip_address` (inet) - Client IP for audit
      - `user_agent` (text) - Client user agent for audit
      - `session_id` (varchar) - Session ID for tracking
      - `created_at` (timestamptz) - Ticket creation timestamp
      - `processed_at` (timestamptz) - AI processing timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `reports` table
    - Add policy to deny all public access (client-side blocked)
    - Add policy to allow service_role access (API endpoints only)
    - This ensures all database operations happen server-side via Vercel functions

  3. Performance
    - Indexes on report_id, created_at, priority, category, csr_agent, customer_tone
    - Trigger to auto-update updated_at timestamp

  4. Utilities
    - Function to check RLS status for health monitoring
*/

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
    category VARCHAR(50) DEFAULT 'general',
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    response_approach TEXT,
    talking_points JSONB,
    knowledge_base_articles JSONB,
    metadata JSONB,
    
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
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_csr_agent ON reports(csr_agent);
CREATE INDEX IF NOT EXISTS idx_reports_customer_tone ON reports(customer_tone);

-- MANDATORY: Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- CRITICAL SECURITY REQUIREMENT: Set default DENY ALL policy for public role
-- This ensures NO client-side access to the database
CREATE POLICY "Deny all public access" ON reports
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