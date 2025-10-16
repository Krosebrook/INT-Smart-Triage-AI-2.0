-- Create report_notes table
-- Migration: Add notes system for report annotations
-- Created: 2025-10-16

-- Create report_notes table
CREATE TABLE IF NOT EXISTS report_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL,
  note TEXT NOT NULL,
  added_by TEXT DEFAULT 'CSR_USER',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups by report_id
CREATE INDEX IF NOT EXISTS idx_report_notes_report_id ON report_notes(report_id);

-- Create index for created_at for ordering
CREATE INDEX IF NOT EXISTS idx_report_notes_created_at ON report_notes(created_at DESC);

-- Add foreign key constraint if reports table exists
-- Note: We use report_id (TEXT) not a UUID foreign key since reports table uses TEXT for report_id
COMMENT ON TABLE report_notes IS 'Stores internal notes and annotations for triage reports';
COMMENT ON COLUMN report_notes.report_id IS 'Reference to the report (reports.report_id)';
COMMENT ON COLUMN report_notes.note IS 'The note content/text';
COMMENT ON COLUMN report_notes.added_by IS 'CSR agent who added the note';

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_report_notes_updated_at
  BEFORE UPDATE ON report_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_report_notes_updated_at();

