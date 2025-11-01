-- INT Smart Triage AI 2.0 - Consolidated Row Level Security (RLS) policy definitions
-- This script enforces default-deny access controls across all exposed tables
-- and aligns multi-tenant access with the organization assigned to the current user.

BEGIN;

-- Helper to resolve the current user's organization id.  When executed by the service
-- role (which bypasses RLS) the function returns NULL.
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM user_profiles
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated;

-- Ensure RLS is active on critical tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports FORCE ROW LEVEL SECURITY;
ALTER TABLE report_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE csr_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE csr_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rules FORCE ROW LEVEL SECURITY;
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_history FORCE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log FORCE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE kb_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_searches FORCE ROW LEVEL SECURITY;
ALTER TABLE kb_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_feedback FORCE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences FORCE ROW LEVEL SECURITY;

-- Utility predicates
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_manager()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_manager() TO authenticated;

-----------------------------------------------------------------------
-- Organizations
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can manage their organization" ON organizations;
DROP POLICY IF EXISTS "Service role can manage organizations" ON organizations;

CREATE POLICY "Deny public access to organizations"
  ON organizations FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Service role manages organizations"
  ON organizations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Members view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IS NOT DISTINCT FROM public.current_user_org_id()
  );

CREATE POLICY "Admins manage their organization"
  ON organizations FOR ALL
  TO authenticated
  USING (
    id IS NOT DISTINCT FROM public.current_user_org_id()
    AND public.is_current_user_admin()
  )
  WITH CHECK (
    id IS NOT DISTINCT FROM public.current_user_org_id()
    AND public.is_current_user_admin()
  );

-----------------------------------------------------------------------
-- User Profiles
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Service role manages user profiles" ON user_profiles;

CREATE POLICY "Deny public access to user profiles"
  ON user_profiles FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Service role manages user profiles"
  ON user_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Members read organization profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT DISTINCT FROM public.current_user_org_id()
  );

CREATE POLICY "Users update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Managers manage organization profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    AND public.is_current_user_manager()
  )
  WITH CHECK (
    organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    AND public.is_current_user_manager()
  );

-----------------------------------------------------------------------
-- Audit Logs
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view audit logs in their organization" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "Deny public access to audit logs"
  ON audit_logs FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Service role manages audit logs"
  ON audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Members view organization audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT DISTINCT FROM public.current_user_org_id()
  );

CREATE POLICY "Admins insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_current_user_admin()
    AND organization_id IS NOT DISTINCT FROM public.current_user_org_id()
  );

-----------------------------------------------------------------------
-- Reports
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Deny all public access" ON reports;
DROP POLICY IF EXISTS "Allow service role access" ON reports;
DROP POLICY IF EXISTS "Allow authenticated insert reports" ON reports;
DROP POLICY IF EXISTS "Users can view reports in their organization" ON reports;
DROP POLICY IF EXISTS "Users can manage reports in their organization" ON reports;

CREATE POLICY "Deny public access to reports"
  ON reports FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Service role full access to reports"
  ON reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Members read organization reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT DISTINCT FROM public.current_user_org_id()
  );

CREATE POLICY "Users create reports for their organization"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IS NOT DISTINCT FROM public.current_user_org_id()
  );

CREATE POLICY "Managers update organization reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    AND public.is_current_user_manager()
  )
  WITH CHECK (
    organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    AND public.is_current_user_manager()
  );

CREATE POLICY "Admins delete organization reports"
  ON reports FOR DELETE
  TO authenticated
  USING (
    organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    AND public.is_current_user_admin()
  );

-----------------------------------------------------------------------
-- Report Notes
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read report notes" ON report_notes;
DROP POLICY IF EXISTS "Anyone can create report notes" ON report_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON report_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON report_notes;

CREATE POLICY "Deny public access to report notes"
  ON report_notes FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Service role manages report notes"
  ON report_notes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Members read organization report notes"
  ON report_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM reports
      WHERE reports.report_id = report_notes.report_id
        AND reports.organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    )
  );

CREATE POLICY "Users create notes for organization reports"
  ON report_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM reports
      WHERE reports.report_id = report_notes.report_id
        AND reports.organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    )
  );

CREATE POLICY "Users update own notes"
  ON report_notes FOR UPDATE
  TO authenticated
  USING (
    csr_agent = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM reports
      WHERE reports.report_id = report_notes.report_id
        AND reports.organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    )
  )
  WITH CHECK (
    csr_agent = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM reports
      WHERE reports.report_id = report_notes.report_id
        AND reports.organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    )
  );

CREATE POLICY "Admins delete organization notes"
  ON report_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM reports
      WHERE reports.report_id = report_notes.report_id
        AND reports.organization_id IS NOT DISTINCT FROM public.current_user_org_id()
    )
    AND public.is_current_user_admin()
  );

-----------------------------------------------------------------------
-- Operational tables without tenant metadata rely on trusted service role access.
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view CSR profiles" ON csr_profiles;
DROP POLICY IF EXISTS "Authenticated users can update CSR profiles" ON csr_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert CSR profiles" ON csr_profiles;
DROP POLICY IF EXISTS "Service role can manage CSR profiles" ON csr_profiles;

CREATE POLICY "Service role manages CSR profiles"
  ON csr_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Managers view CSR profiles"
  ON csr_profiles FOR SELECT
  TO authenticated
  USING (public.is_current_user_manager());

DROP POLICY IF EXISTS "Anyone can view assignment rules" ON assignment_rules;
DROP POLICY IF EXISTS "Authenticated users can manage assignment rules" ON assignment_rules;

CREATE POLICY "Service role manages assignment rules"
  ON assignment_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins manage assignment rules"
  ON assignment_rules FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Service role can manage assignment history" ON assignment_history;
CREATE POLICY "Service role manages assignment history"
  ON assignment_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage customer profiles" ON customer_profiles;
CREATE POLICY "Service role manages customer profiles"
  ON customer_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage customer notes" ON customer_notes;
CREATE POLICY "Service role manages customer notes"
  ON customer_notes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage communication log" ON communication_log;
CREATE POLICY "Service role manages communication log"
  ON communication_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage chat messages" ON chat_messages;
CREATE POLICY "Service role manages chat messages"
  ON chat_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage KB searches" ON kb_searches;
CREATE POLICY "Service role manages KB searches"
  ON kb_searches FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage KB feedback" ON kb_feedback;
CREATE POLICY "Service role manages KB feedback"
  ON kb_feedback FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage user preferences" ON user_preferences;
CREATE POLICY "Service role manages user preferences"
  ON user_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users manage their preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

COMMIT;
