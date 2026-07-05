-- Team lead: create tasks on projects for teams they lead
-- Team lead: read profiles of members on teams they lead

CREATE POLICY "Team leads can create team project tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE public.user_leads_team(p.team_id)
    )
  );

CREATE POLICY "Team leads can read team member profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT tm.user_id
      FROM public.team_members tm
      INNER JOIN public.teams t ON t.id = tm.team_id
      WHERE t.lead_id = auth.uid()
    )
  );

-- Reliable profile fetch for team leads (works even when nested joins return null)
CREATE OR REPLACE FUNCTION public.get_team_member_profiles(p_team_id UUID)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  INNER JOIN public.team_members tm ON tm.user_id = p.id
  WHERE tm.team_id = p_team_id
    AND (
      public.is_admin()
      OR public.user_leads_team(p_team_id)
      OR p_team_id IN (SELECT public.user_team_ids())
    )
  ORDER BY p.full_name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_member_profiles(UUID) TO authenticated;
