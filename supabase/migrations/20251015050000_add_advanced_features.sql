/*
  # Add Advanced Features to INT Smart Triage AI 2.0

  1. New Tables
    - `customer_profiles` - Comprehensive customer profile data
    - `customer_notes` - Notes and tags for customer management
    - `csr_profiles` - CSR availability and workload tracking
    - `assignment_history` - Audit trail for ticket assignments
    - `communication_log` - Multi-channel communication tracking
    - `chat_messages` - Real-time chat message storage
    - `kb_searches` - Knowledge base search analytics
    - `kb_feedback` - Knowledge base article ratings
    - `user_preferences` - User communication and notification preferences

  2. Indexes
    - Performance optimization for common queries
    - Foreign key relationships

  3. Security
    - Row Level Security (RLS) enabled on all tables
    - Service role policies for API access
*/

-- Customer Profiles Table
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    communication_preferences JSONB DEFAULT '{"email": true, "sms": false, "phone": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_customer_id ON customer_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_tags ON customer_profiles USING GIN(tags);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage customer profiles"
    ON customer_profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Customer Notes Table
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created ON customer_notes(created_at DESC);

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage customer notes"
    ON customer_notes FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- CSR Profiles Table
CREATE TABLE IF NOT EXISTS csr_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'agent',
    specialties TEXT[] DEFAULT '{}',
    skill_level TEXT DEFAULT 'junior',
    current_workload INTEGER DEFAULT 0 CHECK (current_workload >= 0),
    max_workload     INTEGER DEFAULT 10 CHECK (max_workload > 0 AND max_workload >= current_workload),
    avg_resolution_time DECIMAL(5,2) DEFAULT 0,
    avg_resolution_time DECIMAL(5,2) DEFAULT 0,
    satisfaction_rating DECIMAL(3,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    shift_start TIME,
    shift_end TIME,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csr_profiles_email ON csr_profiles(email);
CREATE INDEX IF NOT EXISTS idx_csr_profiles_available ON csr_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_csr_profiles_workload ON csr_profiles(current_workload);

ALTER TABLE csr_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage CSR profiles"
    ON csr_profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Assignment History Table
CREATE TABLE IF NOT EXISTS assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    assigned_from TEXT,
    reassignment_reason TEXT,
    assignment_method TEXT DEFAULT 'manual',
    assigned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_history_report ON assignment_history(report_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_assigned_to ON assignment_history(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignment_history_date ON assignment_history(assigned_at DESC);

ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage assignment history"
    ON assignment_history FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Communication Log Table
CREATE TABLE IF NOT EXISTS communication_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT,
    report_id TEXT,
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_log_customer ON communication_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_report ON communication_log(report_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_channel ON communication_log(channel);
CREATE INDEX IF NOT EXISTS idx_communication_log_date ON communication_log(sent_at DESC);

ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage communication log"
    ON communication_log FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    sender TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_date ON chat_messages(sent_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage chat messages"
    ON chat_messages FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Knowledge Base Searches Table
CREATE TABLE IF NOT EXISTS kb_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    searched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_searches_date ON kb_searches(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_searches_query ON kb_searches(query);

ALTER TABLE kb_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage KB searches"
    ON kb_searches FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Knowledge Base Feedback Table
CREATE TABLE IF NOT EXISTS kb_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id TEXT NOT NULL,
    helpful BOOLEAN NOT NULL,
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_feedback_article ON kb_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_helpful ON kb_feedback(helpful);

ALTER TABLE kb_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage KB feedback"
    ON kb_feedback FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    communication_channels JSONB DEFAULT '{"email": true, "sms": false, "slack": true, "teams": false}'::jsonb,
    notification_settings JSONB DEFAULT '{"high_priority": true, "assignments": true, "mentions": true}'::jsonb,
    theme TEXT DEFAULT 'light',
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage user preferences"
    ON user_preferences FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add new fields to existing reports table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'reports' AND column_name = 'customer_id') THEN
        ALTER TABLE reports ADD COLUMN customer_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'reports' AND column_name = 'category') THEN
        ALTER TABLE reports ADD COLUMN category TEXT DEFAULT 'general';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'reports' AND column_name = 'metadata') THEN
        ALTER TABLE reports ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'reports' AND column_name = 'escalated_at') THEN
        ALTER TABLE reports ADD COLUMN escalated_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'reports' AND column_name = 'escalation_reason') THEN
        ALTER TABLE reports ADD COLUMN escalation_reason TEXT;
    END IF;
END $$;

-- Create function to increment article views
CREATE OR REPLACE FUNCTION increment_article_views(article_id TEXT)
RETURNS VOID AS $$
BEGIN
    -- This function would update a views counter in kb_articles table
    -- For now, it's a placeholder for future implementation
    INSERT INTO kb_searches (query, result_count)
    VALUES (article_id, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_article_views(TEXT) TO service_role;

-- Create function for auto-assignment
CREATE OR REPLACE FUNCTION auto_assign_report(report_id TEXT)
RETURNS TEXT AS $$
DECLARE
    selected_csr TEXT;
    csr_id UUID;
    current_load INTEGER;
CREATE OR REPLACE FUNCTION auto_assign_report(report_id TEXT)
RETURNS TEXT AS $$
DECLARE
    selected_csr TEXT;
    csr_id UUID;
    current_load INTEGER;
    max_load INTEGER;
BEGIN
    SELECT id, name, current_workload, max_workload
    INTO csr_id, selected_csr, current_load, max_load
    FROM csr_profiles
    WHERE is_available = true
      AND current_workload < max_workload
    ORDER BY current_workload ASC, satisfaction_rating DESC
    LIMIT 1
    FOR UPDATE;  -- Lock the row

    IF selected_csr IS NOT NULL THEN
        UPDATE reports
        SET assigned_to = selected_csr,
            assigned_at = now(),
            status = 'assigned'
        WHERE reports.report_id = auto_assign_report.report_id;

        UPDATE csr_profiles
        SET current_workload = current_workload + 1
        WHERE id = csr_id;

        RETURN selected_csr;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION auto_assign_report(TEXT) TO service_role;

-- Create updated_at trigger for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_profiles_updated_at
    BEFORE UPDATE ON customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_csr_profiles_updated_at
    BEFORE UPDATE ON csr_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
