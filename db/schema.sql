-- INT Smart Triage AI Database Schema
-- This schema is idempotent and can be run multiple times safely

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS triage_reports (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(255) UNIQUE NOT NULL,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    suggested_response TEXT,
    kb_articles JSONB DEFAULT '[]'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_triage_reports_ticket_id ON triage_reports(ticket_id);
CREATE INDEX IF NOT EXISTS idx_triage_reports_priority ON triage_reports(priority);
CREATE INDEX IF NOT EXISTS idx_triage_reports_category ON triage_reports(category);
CREATE INDEX IF NOT EXISTS idx_triage_reports_timestamp ON triage_reports(timestamp);

-- Create audit table for tracking changes
CREATE TABLE IF NOT EXISTS triage_audit (
    id SERIAL PRIMARY KEY,
    triage_report_id INTEGER REFERENCES triage_reports(id),
    action VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB
);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_triage_reports_updated_at ON triage_reports;
CREATE TRIGGER update_triage_reports_updated_at
    BEFORE UPDATE ON triage_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a test user table for CSR management (if needed)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'csr' CHECK (role IN ('admin', 'csr', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test data for integration testing
INSERT INTO users (username, email, role) 
VALUES ('test_csr', 'test@intinc.com', 'csr')
ON CONFLICT (username) DO NOTHING;

-- Grant necessary permissions (adjust based on your user setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Verification queries to check schema application
-- SELECT 'Schema applied successfully' as status;
-- SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';