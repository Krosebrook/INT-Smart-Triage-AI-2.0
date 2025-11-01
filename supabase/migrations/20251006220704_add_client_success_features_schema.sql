/*
  # Client Success Platform - Complete Feature Schema

  ## Summary
  Comprehensive database schema for all 10 Client Success Representative features including
  ticket management, customer history, AI templates, escalations, knowledge base, analytics,
  follow-ups, multi-channel integration, quality assurance, and forecasting.

  ## New Tables

  ### 1. tickets
  Core ticket tracking system for all customer inquiries
  - `id` (uuid, primary key)
  - `ticket_number` (text, unique, auto-generated)
  - `customer_id` (uuid, foreign key)
  - `assigned_to` (uuid, foreign key to users)
  - `status` (text: open, in_progress, waiting_customer, resolved, closed)
  - `priority` (text: low, medium, high, urgent)
  - `category` (text)
  - `subject` (text)
  - `description` (text)
  - `channel` (text: email, chat, phone, social)
  - `sentiment_score` (numeric, -1 to 1)
  - `ai_suggested_priority` (text)
  - `ai_suggested_category` (text)
  - `escalated` (boolean)
  - `created_at`, `updated_at`, `resolved_at`, `closed_at` (timestamps)

  ### 2. customers
  Customer master data and profile information
  - `id` (uuid, primary key)
  - `email` (text, unique)
  - `name` (text)
  - `company` (text)
  - `phone` (text)
  - `contract_tier` (text: basic, professional, enterprise)
  - `contract_start_date` (date)
  - `contract_end_date` (date)
  - `account_value` (numeric)
  - `health_score` (numeric, 0-100)
  - `at_risk` (boolean)
  - `created_at`, `updated_at` (timestamps)

  ### 3. ticket_messages
  All messages/communications within a ticket thread
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, foreign key)
  - `sender_type` (text: customer, csr, system)
  - `sender_id` (uuid)
  - `message` (text)
  - `channel` (text)
  - `ai_reviewed` (boolean)
  - `ai_review_score` (numeric)
  - `ai_review_feedback` (jsonb)
  - `created_at` (timestamp)

  ### 4. response_templates
  AI-powered and manual response templates
  - `id` (uuid, primary key)
  - `name` (text)
  - `category` (text)
  - `tone` (text)
  - `template_text` (text)
  - `variables` (jsonb)
  - `usage_count` (integer)
  - `effectiveness_score` (numeric)
  - `created_by` (uuid)
  - `is_ai_generated` (boolean)
  - `created_at`, `updated_at` (timestamps)

  ### 5. escalations
  Escalation workflow tracking
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, foreign key)
  - `escalated_from` (uuid, foreign key to users)
  - `escalated_to` (uuid, foreign key to users)
  - `reason` (text)
  - `ai_detected` (boolean)
  - `resolved` (boolean)
  - `created_at`, `resolved_at` (timestamps)

  ### 6. knowledge_base_articles
  Searchable knowledge base content
  - `id` (uuid, primary key)
  - `title` (text)
  - `content` (text)
  - `category` (text)
  - `tags` (text[])
  - `author_id` (uuid)
  - `view_count` (integer)
  - `helpful_count` (integer)
  - `not_helpful_count` (integer)
  - `search_vector` (tsvector)
  - `created_from_ticket_id` (uuid, nullable)
  - `published` (boolean)
  - `created_at`, `updated_at` (timestamps)

  ### 7. ticket_follow_ups
  Automated and manual follow-up scheduling
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, foreign key)
  - `scheduled_for` (timestamp)
  - `follow_up_type` (text: check_in, resolution_confirm, satisfaction_survey)
  - `message_template` (text)
  - `completed` (boolean)
  - `completed_at` (timestamp)
  - `created_at` (timestamp)

  ### 8. channel_integrations
  Multi-channel message routing and tracking
  - `id` (uuid, primary key)
  - `channel_type` (text: email, slack, teams, twitter, facebook)
  - `external_id` (text)
  - `ticket_id` (uuid, foreign key)
  - `customer_id` (uuid, foreign key)
  - `raw_message` (jsonb)
  - `processed` (boolean)
  - `created_at` (timestamp)

  ### 9. sentiment_analytics
  Aggregated sentiment tracking over time
  - `id` (uuid, primary key)
  - `customer_id` (uuid, foreign key)
  - `period_start` (date)
  - `period_end` (date)
  - `avg_sentiment` (numeric)
  - `ticket_count` (integer)
  - `resolution_time_avg` (interval)
  - `satisfaction_score` (numeric)
  - `created_at` (timestamp)

  ### 10. csr_performance
  CSR metrics and performance tracking
  - `id` (uuid, primary key)
  - `csr_id` (uuid, foreign key to users)
  - `period_start` (date)
  - `period_end` (date)
  - `tickets_handled` (integer)
  - `avg_resolution_time` (interval)
  - `avg_response_time` (interval)
  - `customer_satisfaction` (numeric)
  - `quality_score` (numeric)
  - `created_at` (timestamp)

  ### 11. ticket_volume_forecast
  Predictive analytics for staffing
  - `id` (uuid, primary key)
  - `forecast_date` (date)
  - `predicted_volume` (integer)
  - `confidence_level` (numeric)
  - `factors` (jsonb)
  - `actual_volume` (integer, nullable)
  - `created_at` (timestamp)

  ### 12. users
  CSR and admin user management
  - `id` (uuid, primary key)
  - `email` (text, unique)
  - `name` (text)
  - `role` (text: csr, senior_csr, manager, admin)
  - `availability_status` (text: available, busy, offline)
  - `max_concurrent_tickets` (integer)
  - `specializations` (text[])
  - `created_at`, `updated_at` (timestamps)

  ## Security
  - Enable RLS on all tables
  - Authenticated users can view data based on role
  - CSRs can only update their assigned tickets
  - Managers and admins have broader access
  - Customers cannot access internal tables

  ## Indexes
  - Full-text search on knowledge base articles
  - Performance indexes on frequently queried columns
  - Composite indexes for dashboard queries
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'csr',
  availability_status text DEFAULT 'available',
  max_concurrent_tickets integer DEFAULT 5,
  specializations text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  company text,
  phone text,
  contract_tier text DEFAULT 'basic',
  contract_start_date date,
  contract_end_date date,
  account_value numeric DEFAULT 0,
  health_score numeric DEFAULT 75,
  at_risk boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  category text,
  subject text NOT NULL,
  description text,
  channel text DEFAULT 'email',
  sentiment_score numeric,
  ai_suggested_priority text,
  ai_suggested_category text,
  escalated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  closed_at timestamptz
);

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL,
  sender_id uuid,
  message text NOT NULL,
  channel text DEFAULT 'email',
  ai_reviewed boolean DEFAULT false,
  ai_review_score numeric,
  ai_review_feedback jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create response_templates table
CREATE TABLE IF NOT EXISTS response_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  tone text DEFAULT 'professional',
  template_text text NOT NULL,
  variables jsonb DEFAULT '{}',
  usage_count integer DEFAULT 0,
  effectiveness_score numeric DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create escalations table
CREATE TABLE IF NOT EXISTS escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  escalated_from uuid REFERENCES users(id) ON DELETE SET NULL,
  escalated_to uuid REFERENCES users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  ai_detected boolean DEFAULT false,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create knowledge_base_articles table
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  search_vector tsvector,
  created_from_ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ticket_follow_ups table
CREATE TABLE IF NOT EXISTS ticket_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  follow_up_type text NOT NULL,
  message_template text,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create channel_integrations table
CREATE TABLE IF NOT EXISTS channel_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type text NOT NULL,
  external_id text,
  ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  raw_message jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create sentiment_analytics table
CREATE TABLE IF NOT EXISTS sentiment_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  avg_sentiment numeric,
  ticket_count integer DEFAULT 0,
  resolution_time_avg interval,
  satisfaction_score numeric,
  created_at timestamptz DEFAULT now()
);

-- Create csr_performance table
CREATE TABLE IF NOT EXISTS csr_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_id uuid REFERENCES users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  tickets_handled integer DEFAULT 0,
  avg_resolution_time interval,
  avg_response_time interval,
  customer_satisfaction numeric,
  quality_score numeric,
  created_at timestamptz DEFAULT now()
);

-- Create ticket_volume_forecast table
CREATE TABLE IF NOT EXISTS ticket_volume_forecast (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date date NOT NULL,
  predicted_volume integer NOT NULL,
  confidence_level numeric,
  factors jsonb DEFAULT '{}',
  actual_volume integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_kb_search ON knowledge_base_articles USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled ON ticket_follow_ups(scheduled_for) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_channel_integrations_unprocessed ON channel_integrations(created_at) WHERE processed = false;

-- Create full-text search trigger for knowledge base
CREATE OR REPLACE FUNCTION update_kb_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.title || ' ' || NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_search_vector_update
  BEFORE INSERT OR UPDATE ON knowledge_base_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_search_vector();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE csr_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_volume_forecast ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

-- RLS Policies for tickets
CREATE POLICY "CSRs can view assigned or unassigned tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR assigned_to IS NULL OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "CSRs can update assigned tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Authenticated users can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages for accessible tickets"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (tickets.assigned_to = auth.uid() OR tickets.assigned_to IS NULL OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('manager', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can insert messages for accessible tickets"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (tickets.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('manager', 'admin')
        )
      )
    )
  );

-- RLS Policies for response_templates
CREATE POLICY "Users can view all templates"
  ON response_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create templates"
  ON response_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates"
  ON response_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for escalations
CREATE POLICY "Users can view relevant escalations"
  ON escalations FOR SELECT
  TO authenticated
  USING (
    escalated_from = auth.uid() OR escalated_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Users can create escalations"
  ON escalations FOR INSERT
  TO authenticated
  WITH CHECK (escalated_from = auth.uid());

-- RLS Policies for knowledge_base_articles
CREATE POLICY "Users can view published articles"
  ON knowledge_base_articles FOR SELECT
  TO authenticated
  USING (published = true OR author_id = auth.uid());

CREATE POLICY "Users can create articles"
  ON knowledge_base_articles FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own articles"
  ON knowledge_base_articles FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policies for ticket_follow_ups
CREATE POLICY "Users can view follow-ups for accessible tickets"
  ON ticket_follow_ups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_follow_ups.ticket_id
      AND (tickets.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('manager', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can manage follow-ups for accessible tickets"
  ON ticket_follow_ups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_follow_ups.ticket_id
      AND (tickets.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('manager', 'admin')
        )
      )
    )
  );

-- RLS Policies for channel_integrations
CREATE POLICY "Managers can view all channel integrations"
  ON channel_integrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "System can insert channel integrations"
  ON channel_integrations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for sentiment_analytics
CREATE POLICY "Users can view sentiment analytics"
  ON sentiment_analytics FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for csr_performance
CREATE POLICY "CSRs can view own performance"
  ON csr_performance FOR SELECT
  TO authenticated
  USING (
    csr_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

-- RLS Policies for ticket_volume_forecast
CREATE POLICY "Users can view forecasts"
  ON ticket_volume_forecast FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage forecasts"
  ON ticket_volume_forecast FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );
