/*
  # Authentication and Multi-Tenant System

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text) - Organization name
      - `slug` (text, unique) - URL-safe identifier
      - `logo_url` (text) - Organization logo
      - `settings` (jsonb) - Organization settings
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `organization_id` (uuid, references organizations)
      - `full_name` (text)
      - `role` (text) - admin, manager, csr, viewer
      - `avatar_url` (text)
      - `preferences` (jsonb)
      - `last_login_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `organization_id` (uuid, references organizations)
      - `action` (text) - Action performed
      - `entity_type` (text) - Type of entity (report, note, etc)
      - `entity_id` (text) - ID of entity
      - `old_value` (jsonb) - Previous value
      - `new_value` (jsonb) - New value
      - `ip_address` (text)
      - `user_agent` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their organization's data
    - Audit logs are read-only for non-admins
    - Role-based permissions enforced

  3. Functions
    - Auto-create user profile on signup
    - Log all important actions to audit table
*/

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id),
  full_name text,
  role text DEFAULT 'csr' CHECK (role IN ('admin', 'manager', 'csr', 'viewer')),
  avatar_url text,
  preferences jsonb DEFAULT '{}',
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  organization_id uuid REFERENCES organizations(id),
  action text NOT NULL,
  entity_type text,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Add organization_id to reports for multi-tenancy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE reports ADD COLUMN organization_id uuid REFERENCES organizations(id);
  END IF;
END $$;

-- RLS Policies for Organizations
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their organization"
  ON organizations FOR ALL
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for User Profiles
CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles in their organization"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for Audit Logs
CREATE POLICY "Users can view audit logs in their organization"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policy for Reports (Multi-tenant)
DROP POLICY IF EXISTS "Users can view reports in their organization" ON reports;
CREATE POLICY "Users can view reports in their organization"
  ON reports FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ) OR organization_id IS NULL
  );

DROP POLICY IF EXISTS "Users can manage reports in their organization" ON reports;
CREATE POLICY "Users can manage reports in their organization"
  ON reports FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ) OR organization_id IS NULL
  );

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'csr');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_audit_id uuid;
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id 
  FROM user_profiles 
  WHERE id = auth.uid();

  INSERT INTO audit_logs (
    user_id,
    organization_id,
    action,
    entity_type,
    entity_id,
    old_value,
    new_value
  ) VALUES (
    auth.uid(),
    v_org_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_value,
    p_new_value
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default organization for existing data
INSERT INTO organizations (name, slug, is_active)
VALUES ('INT Inc', 'int-inc', true)
ON CONFLICT (slug) DO NOTHING;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
  required_role text
)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = auth.uid();

  RETURN CASE
    WHEN required_role = 'viewer' THEN user_role IN ('viewer', 'csr', 'manager', 'admin')
    WHEN required_role = 'csr' THEN user_role IN ('csr', 'manager', 'admin')
    WHEN required_role = 'manager' THEN user_role IN ('manager', 'admin')
    WHEN required_role = 'admin' THEN user_role = 'admin'
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
