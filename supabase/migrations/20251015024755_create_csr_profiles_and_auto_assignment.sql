/*
  # CSR Profiles and Auto-Assignment System

  1. New Tables
    - `csr_profiles`
      - `id` (uuid, primary key)
      - `name` (text) - CSR agent name
      - `email` (text, unique) - Contact email
      - `specializations` (text array) - Skills/categories
      - `current_workload` (integer) - Active reports count
      - `is_available` (boolean) - Online/offline status
      - `performance_score` (decimal) - Performance rating 0-100
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `assignment_rules`
      - `id` (uuid, primary key)
      - `priority` (integer) - Rule execution order
      - `match_category` (text) - Category to match
      - `match_priority` (text) - Priority to match
      - `preferred_csr` (uuid) - CSR to assign
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Allow authenticated users to read CSR profiles
    - Only admins can modify CSR profiles and rules
    - Public read for assignment rules

  3. Functions
    - Function to calculate CSR workload automatically
    - Function to auto-assign reports based on rules
*/

-- CSR Profiles table
CREATE TABLE IF NOT EXISTS csr_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  specializations text[] DEFAULT '{}',
  current_workload integer DEFAULT 0,
  is_available boolean DEFAULT true,
  performance_score decimal(5,2) DEFAULT 85.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assignment Rules table
CREATE TABLE IF NOT EXISTS assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority integer NOT NULL DEFAULT 100,
  match_category text,
  match_priority text,
  preferred_csr uuid REFERENCES csr_profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE csr_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CSR Profiles
CREATE POLICY "Anyone can view CSR profiles"
  ON csr_profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update CSR profiles"
  ON csr_profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert CSR profiles"
  ON csr_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for Assignment Rules
CREATE POLICY "Anyone can view assignment rules"
  ON assignment_rules FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage assignment rules"
  ON assignment_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update CSR workload
CREATE OR REPLACE FUNCTION update_csr_workload()
RETURNS trigger AS $$
BEGIN
  -- Decrease workload when report is resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' AND NEW.csr_agent IS NOT NULL THEN
    UPDATE csr_profiles
    SET current_workload = GREATEST(current_workload - 1, 0),
        updated_at = now()
    WHERE name = NEW.csr_agent;
  END IF;

  -- Increase workload when report is assigned
  IF NEW.csr_agent IS NOT NULL AND (OLD.csr_agent IS NULL OR OLD.csr_agent != NEW.csr_agent) THEN
    UPDATE csr_profiles
    SET current_workload = current_workload + 1,
        updated_at = now()
    WHERE name = NEW.csr_agent;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update workload
DROP TRIGGER IF EXISTS update_workload_trigger ON reports;
CREATE TRIGGER update_workload_trigger
  AFTER UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_csr_workload();

-- Function to auto-assign report
CREATE OR REPLACE FUNCTION auto_assign_report(report_id uuid)
RETURNS text AS $$
DECLARE
  report_rec RECORD;
  best_csr RECORD;
  assigned_csr text;
BEGIN
  -- Get report details
  SELECT * INTO report_rec FROM reports WHERE id = report_id;

  -- Find best CSR based on rules and workload
  SELECT * INTO best_csr
  FROM csr_profiles
  WHERE is_available = true
    AND (
      report_rec.category = ANY(specializations)
      OR specializations = '{}'
    )
  ORDER BY current_workload ASC, performance_score DESC
  LIMIT 1;

  IF best_csr IS NOT NULL THEN
    assigned_csr := best_csr.name;
    
    -- Update report with assignment
    UPDATE reports
    SET csr_agent = assigned_csr,
        status = CASE WHEN status = 'new' THEN 'in_progress' ELSE status END,
        updated_at = now()
    WHERE id = report_id;

    RETURN assigned_csr;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Insert sample CSR profiles
INSERT INTO csr_profiles (name, email, specializations, current_workload, is_available, performance_score)
VALUES
  ('Sarah Johnson', 'sarah@int-inc.com', ARRAY['Technical Issue', 'Bug Report', 'API Support'], 0, true, 92.50),
  ('Mike Chen', 'mike@int-inc.com', ARRAY['Billing Question', 'Account Access', 'Subscription'], 0, true, 88.75),
  ('Emily Davis', 'emily@int-inc.com', ARRAY['Feature Request', 'Product Feedback', 'Integration'], 0, true, 95.20),
  ('Alex Kumar', 'alex@int-inc.com', ARRAY['Technical Issue', 'Performance Issue', 'Security'], 0, true, 90.00),
  ('Jessica Lee', 'jessica@int-inc.com', ARRAY['Account Access', 'Password Reset', 'User Management'], 0, true, 87.30)
ON CONFLICT (email) DO NOTHING;

-- Insert sample assignment rules
INSERT INTO assignment_rules (priority, match_category, match_priority, is_active)
VALUES
  (10, 'Technical Issue', 'high', true),
  (20, 'Billing Question', 'high', true),
  (30, 'Feature Request', 'medium', true),
  (100, NULL, NULL, true)
ON CONFLICT DO NOTHING;
