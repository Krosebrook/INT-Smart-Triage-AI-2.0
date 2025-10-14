/*
  # Create Assignment System

  1. Changes
    - Add `assigned_to` column to reports table
    - Add `assigned_at` timestamp
    - Add indexes for better query performance

  2. Notes
    - Simple assignment by CSR name (string)
    - Can filter by assigned agent
    - Tracks when assignment happened
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE reports ADD COLUMN assigned_to VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'assigned_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN assigned_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reports_assigned_to ON reports(assigned_to);
