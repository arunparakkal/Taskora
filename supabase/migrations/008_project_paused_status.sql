-- Add paused status for projects

ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'paused' BEFORE 'archived';
