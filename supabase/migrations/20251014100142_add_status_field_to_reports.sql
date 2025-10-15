/*
  # Add Status Field to Reports Table

  1. Changes
    - Add `status` column to `reports` table
    - Default value: 'new'
    - Allowed values: 'new', 'in_progress', 'resolved'
    - Add `resolved_at` timestamp column
    - Add index on status for faster queries

  2. Notes
    - Existing reports will default to 'new' status
    - Resolved_at will be null until status changes to 'resolved'
    - Status tracking enables complete lifecycle management
*/

-- Add status column with check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'status'
  ) THEN
    ALTER TABLE reports ADD COLUMN status VARCHAR(20) DEFAULT 'new' NOT NULL
      CHECK (status IN ('new', 'in_progress', 'resolved'));
  END IF;
END $$;

-- Add resolved_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Add index for filtering by status and date
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);
