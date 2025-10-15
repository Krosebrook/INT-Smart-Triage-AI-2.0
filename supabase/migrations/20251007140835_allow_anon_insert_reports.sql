/*
  # Allow Anonymous Report Creation
  
  This migration adds a policy to allow the anon role to insert triage reports.
  This is needed for the triage form to work without authentication.
  
  ## Changes
  - Add policy to allow anon role to insert reports
  - Maintains read restrictions (only service_role can read)
*/

CREATE POLICY "Allow anon to insert reports" ON reports
    FOR INSERT
    TO anon
    WITH CHECK (true);
