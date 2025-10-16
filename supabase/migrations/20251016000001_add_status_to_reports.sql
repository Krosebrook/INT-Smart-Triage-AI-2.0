-- Add status column to reports table
-- Migration: Add status tracking to reports
-- Created: 2025-10-16

-- Add status column with default value 'new'
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'escalated', 'closed'));

-- Create index for status column for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Add comment to explain the column
COMMENT ON COLUMN reports.status IS 'Current status of the report: new, in_progress, resolved, escalated, or closed';

-- Update existing reports to have 'new' status if they don't have one
UPDATE reports 
SET status = 'new' 
WHERE status IS NULL;

