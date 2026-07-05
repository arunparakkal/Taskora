-- Org / project / team activity log (status changes, etc.)

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  detail TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_created ON activity_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_team ON activity_events (team_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_project ON activity_events (project_id);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read activity events" ON activity_events;
CREATE POLICY "Read activity events"
  ON activity_events FOR SELECT
  USING (
    public.is_admin()
    OR (
      team_id IS NOT NULL
      AND (
        public.user_leads_team(team_id)
        OR team_id IN (SELECT public.user_team_ids())
      )
    )
    OR (
      project_id IS NOT NULL
      AND project_id IN (
        SELECT p.id FROM public.projects p
        WHERE public.user_leads_team(p.team_id)
          OR p.team_id IN (SELECT public.user_team_ids())
      )
    )
  );

DROP POLICY IF EXISTS "Insert activity events" ON activity_events;
CREATE POLICY "Insert activity events"
  ON activity_events FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (team_id IS NOT NULL AND public.user_leads_team(team_id))
    OR (
      project_id IS NOT NULL
      AND public.user_leads_team(
        (SELECT team_id FROM public.projects WHERE id = project_id)
      )
    )
  );
