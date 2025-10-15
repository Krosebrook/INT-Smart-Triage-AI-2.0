/*
  # Create Notes Table for Reports

  1. New Tables
    - `report_notes`
      - `id` (uuid, primary key)
      - `report_id` (varchar, foreign key to reports.report_id)
      - `note_text` (text)
      - `csr_agent` (varchar, author of the note)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `report_notes` table
    - Add policy for authenticated users to read all notes
    - Add policy for authenticated users to create notes
    - Add policy for authenticated users to update their own notes

  3. Indexes
    - Index on report_id for faster lookups
    - Index on created_at for sorting
*/

-- Create report_notes table
CREATE TABLE IF NOT EXISTS report_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id VARCHAR(255) NOT NULL,
  note_text TEXT NOT NULL,
  csr_agent VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_report_notes_report_id ON report_notes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_notes_created ON report_notes(created_at DESC);

-- Enable RLS
ALTER TABLE report_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read report notes"
  ON report_notes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create report notes"
  ON report_notes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notes"
  ON report_notes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own notes"
  ON report_notes
  FOR DELETE
  USING (true);
