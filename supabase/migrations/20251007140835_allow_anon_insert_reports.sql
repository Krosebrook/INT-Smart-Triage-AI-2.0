/*
  # Harden report insertion access

  This migration revokes anonymous write access and limits report creation to
  authenticated users and the service role. This keeps the original migration
  idempotent for existing environments while enforcing the updated security
  posture.

  ## Changes
  - Drop the insecure anon insert policy if it exists
  - Allow authenticated users with a valid JWT to insert reports
  - Allow the service role to continue performing privileged inserts
*/

DROP POLICY IF EXISTS "Allow anon to insert reports" ON reports;

CREATE POLICY "Allow authenticated users to insert reports" ON reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow service role to insert reports" ON reports
    FOR INSERT
    TO service_role
    WITH CHECK (true);
