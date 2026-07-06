import { cache } from "react";
import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchTeamMemberProfiles } from "@/lib/data/team-members";
import { getProjectCompletionRate } from "@/lib/projects/status";
import type {
  Profile,
  ProjectWithDetails,
  TaskWithDetails,
  TeamWithDetails,
} from "@/types/database";

const USER_LIST_COLUMNS =
  "id, email, full_name, role, avatar_url, created_at" as const;

export { USER_LIST_COLUMNS };

export const USERS_LIST_CACHE_TAG = "users-list";

async function fetchUsersList(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(USER_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

const getCachedUsersList = unstable_cache(fetchUsersList, ["admin-users-list"], {
  revalidate: 60,
  tags: [USERS_LIST_CACHE_TAG],
});

/** Cached user list — invalidated when users are created, updated, or deleted. */
export const getUsers = cache(async (): Promise<Profile[]> => getCachedUsersList());

export function revalidateUsersList() {
  revalidateTag(USERS_LIST_CACHE_TAG, "max");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function getTeams(): Promise<TeamWithDetails[]> {
  const supabase = await createClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*, lead:profiles!teams_lead_id_fkey(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const teamsWithCount = await Promise.all(
    (teams ?? []).map(async (team) => {
      const { count } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_id", team.id);

      return {
        ...team,
        lead: team.lead as Profile | null,
        member_count: count ?? 0,
      };
    })
  );

  return teamsWithCount as TeamWithDetails[];
}

export async function getTeamMembers(teamId: string): Promise<Profile[]> {
  return fetchTeamMemberProfiles(teamId);
}

export async function getProjects(): Promise<ProjectWithDetails[]> {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, team:teams(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const withCounts = await Promise.all(
    (projects ?? []).map(async (project) => {
      const [totalRes, doneRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("status", "done"),
      ]);

      const task_count = totalRes.count ?? 0;
      const done_count = doneRes.count ?? 0;

      return {
        ...project,
        team: project.team,
        task_count,
        done_count,
        completion_rate: getProjectCompletionRate(done_count, task_count),
      };
    })
  );

  return withCounts as ProjectWithDetails[];
}

export async function getTasks(filters?: {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  teamId?: string;
  forUserId?: string;
}): Promise<TaskWithDetails[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select(
      "*, project:projects(*, team:teams(*)), assignee:profiles!tasks_assignee_id_fkey(*)"
    );

  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  if (filters?.assigneeId) query = query.eq("assignee_id", filters.assigneeId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.forUserId) query = query.eq("assignee_id", filters.forUserId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  let tasks = data ?? [];

  if (filters?.teamId) {
    tasks = tasks.filter((task) => task.project?.team_id === filters.teamId);
  }

  return tasks as TaskWithDetails[];
}

export async function getTeamLeadTeamIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("id")
    .eq("lead_id", userId);

  const leadTeams = (data ?? []).map((t) => t.id);

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  const memberTeams = (memberships ?? []).map((m) => m.team_id);
  return [...new Set([...leadTeams, ...memberTeams])];
}

export async function getMemberTeamIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  return (memberships ?? []).map((m) => m.team_id);
}

/** Projects on the member's team(s) or with tasks assigned to them. */
export async function getMemberProjects(
  userId: string
): Promise<ProjectWithDetails[]> {
  const [teamIds, allProjects, tasks] = await Promise.all([
    getMemberTeamIds(userId),
    getProjects(),
    getTasks({ forUserId: userId }),
  ]);

  const projectIdsFromTasks = new Set(tasks.map((t) => t.project_id));

  return allProjects.filter(
    (p) => teamIds.includes(p.team_id) || projectIdsFromTasks.has(p.id)
  );
}
