-- Project timeline: start and due dates for task scheduling bounds

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_date_range_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_date_range_check
  CHECK (
    start_date IS NULL
    OR due_date IS NULL
    OR start_date <= due_date
  );
