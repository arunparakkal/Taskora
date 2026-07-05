import { createClient } from "@/lib/supabase/server";
import { getProjectCompletionRate } from "@/lib/projects/status";
import { fetchTeamMemberProfiles } from "@/lib/data/team-members";
import { getLedTeamIds } from "@/lib/data/team-lead";
import type { TeamLeadProjectItem } from "@/types/database";

export async function getTeamLeadManagedProjects(
  userId: string
): Promise<TeamLeadProjectItem[]> {
  const supabase = await createClient();
  const ledTeamIds = await getLedTeamIds(userId);

  if (ledTeamIds.length === 0) return [];

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, team:teams(*, lead:profiles!teams_lead_id_fkey(*))")
    .in("team_id", ledTeamIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const enriched = await Promise.all(
    (projects ?? []).map(async (row) => {
      const project = row as Record<string, unknown>;
      const team = project.team as TeamLeadProjectItem["team"];

      const [members, tasksRes, doneRes, latestTaskRes] = await Promise.all([
        fetchTeamMemberProfiles(String(project.team_id)),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", String(project.id)),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", String(project.id))
          .eq("status", "done"),
        supabase
          .from("tasks")
          .select("created_at")
          .eq("project_id", String(project.id))
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const task_count = tasksRes.count ?? 0;
      const done_count = doneRes.count ?? 0;
      const taskUpdated = latestTaskRes.data?.created_at as string | undefined;
      const createdAt = String(project.created_at);
      const last_updated =
        taskUpdated && taskUpdated > createdAt ? taskUpdated : createdAt;

      return {
        ...(project as Omit<TeamLeadProjectItem, "members" | "last_updated">),
        team,
        task_count,
        done_count,
        completion_rate: getProjectCompletionRate(done_count, task_count),
        members,
        last_updated,
      } satisfies TeamLeadProjectItem;
    })
  );

  return enriched;
}

export async function getLedTeamsForUser(userId: string) {
  const supabase = await createClient();
  const ledTeamIds = await getLedTeamIds(userId);
  if (ledTeamIds.length === 0) return [];

  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .in("id", ledTeamIds)
    .order("name");

  if (error) throw error;
  return data ?? [];
}
