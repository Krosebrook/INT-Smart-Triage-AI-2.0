/*
  # Ensure status, assignee, and SLA due tracking on reports

  1. Adds missing lifecycle tracking columns on reports:
     - `status` with lifecycle constraint and default `new`
     - `assignee` to persist the primary CSR owner
     - `sla_due` timestamp to track contractual due dates
  2. Backfills assignee values from legacy `assigned_to`
  3. Indexes new fields for faster filtering in history views
*/

BEGIN;

-- Ensure status column exists with constraint and default
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'status'
  ) THEN
    ALTER TABLE reports
      ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'new'
      CHECK (status IN ('new', 'in_progress', 'resolved', 'blocked', 'escalated'));
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.constraint_column_usage ccu
      JOIN information_schema.table_constraints tc
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'reports'
        AND ccu.column_name = 'status'
        AND tc.constraint_type = 'CHECK'
    ) INTO constraint_exists;

    IF constraint_exists THEN
      ALTER TABLE reports
        DROP CONSTRAINT IF EXISTS reports_status_check;
    END IF;

    ALTER TABLE reports
      ALTER COLUMN status SET DEFAULT 'new';

    ALTER TABLE reports
      ADD CONSTRAINT reports_status_check
        CHECK (status IN ('new', 'in_progress', 'resolved', 'blocked', 'escalated'));
  END IF;
END $$;

-- Add assignee column when missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'assignee'
  ) THEN
    ALTER TABLE reports
      ADD COLUMN assignee TEXT;
  END IF;
END $$;

-- Add sla_due column when missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'sla_due'
  ) THEN
    ALTER TABLE reports
      ADD COLUMN sla_due TIMESTAMPTZ;
  END IF;
END $$;

-- Backfill assignee from legacy assigned_to column when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'assigned_to'
  ) THEN
    UPDATE reports
      SET assignee = COALESCE(assignee, assigned_to)
    WHERE assigned_to IS NOT NULL
      AND (assignee IS DISTINCT FROM assigned_to OR assignee IS NULL);
  END IF;
END $$;

-- Indexes to support filtering
CREATE INDEX IF NOT EXISTS idx_reports_status_lifecycle ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_assignee ON reports(assignee);
CREATE INDEX IF NOT EXISTS idx_reports_sla_due ON reports(sla_due DESC NULLS LAST);

COMMIT;
