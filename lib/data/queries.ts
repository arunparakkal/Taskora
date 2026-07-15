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

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Escapes PostgREST `ilike`/`or` special characters in user-supplied search text. */
function escapeIlikeTerm(term: string) {
  return term.replace(/[%_,]/g, (char) => `\\${char}`);
}

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

const USERS_PAGE_SIZE = 20;

const APP_ROLES = ["admin", "team_lead", "member"] as const;

/** Map free-text search to an exact app_role enum value, or null. */
function resolveRoleSearch(search: string): (typeof APP_ROLES)[number] | null {
  const normalized = search.toLowerCase().trim().replace(/\s+/g, "_");
  if ((APP_ROLES as readonly string[]).includes(normalized)) {
    return normalized as (typeof APP_ROLES)[number];
  }
  if (normalized === "lead" || normalized === "teamlead") return "team_lead";
  return null;
}

/**
 * Server-paginated + server-searched user list for the Users table.
 * Unlike `getUsers()`, this is not cached (search/page vary per request)
 * and is meant for the list UI only — dashboards/stat cards should keep
 * using `getUsers()`.
 */
export async function getUsersPage(
  opts: { page?: number; pageSize?: number; search?: string } = {}
): Promise<PagedResult<Profile>> {
  const supabase = await createClient();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? USERS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("profiles")
    .select(USER_LIST_COLUMNS, { count: "exact" });

  const search = opts.search?.trim();
  if (search) {
    // `role` is an enum (app_role) — Postgres has no ILIKE for enums (error 42883).
    // Search name/email with ILIKE; match role only with exact enum equality.
    const term = escapeIlikeTerm(search);
    const filters = [
      `full_name.ilike.%${term}%`,
      `email.ilike.%${term}%`,
    ];
    const role = resolveRoleSearch(search);
    if (role) filters.push(`role.eq.${role}`);
    query = query.or(filters.join(","));
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    items: (data ?? []) as Profile[],
    total: count ?? 0,
    page,
    pageSize,
  };
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

/** Lightweight counts for the Active/Archived tab labels (not affected by search/page). */
export async function getProjectStatusCounts(): Promise<{
  active: number;
  archived: number;
}> {
  const supabase = await createClient();
  const [activeRes, archivedRes] = await Promise.all([
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .neq("status", "archived"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "archived"),
  ]);

  return {
    active: activeRes.count ?? 0,
    archived: archivedRes.count ?? 0,
  };
}

const PROJECTS_PAGE_SIZE = 20;

/** Server-paginated + server-searched project list for the Projects table. */
export async function getProjectsPage(
  opts: {
    page?: number;
    pageSize?: number;
    search?: string;
    archived?: boolean;
  } = {}
): Promise<PagedResult<ProjectWithDetails>> {
  const supabase = await createClient();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? PROJECTS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("projects")
    .select("*, team:teams(*)", { count: "exact" });

  if (opts.archived === true) {
    query = query.eq("status", "archived");
  } else if (opts.archived === false) {
    query = query.neq("status", "archived");
  }

  const search = opts.search?.trim();
  if (search) {
    const term = escapeIlikeTerm(search);
    query = query.or(
      `name.ilike.%${term}%,key.ilike.%${term}%,description.ilike.%${term}%`
    );
  }

  const { data: projects, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

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

  return {
    items: withCounts as ProjectWithDetails[],
    total: count ?? 0,
    page,
    pageSize,
  };
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

const TASKS_PAGE_SIZE = 25;

/**
 * Server-paginated + server-searched task list. `teamIds` (if provided)
 * scopes results to projects on those teams — resolved to project IDs first
 * since PostgREST can't filter+range on a nested table's column in one query.
 */
export async function getTasksPage(
  filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    projectId?: string;
    assigneeId?: string;
    status?: string;
    teamIds?: string[];
    forUserId?: string;
  } = {}
): Promise<PagedResult<TaskWithDetails>> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? TASKS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let scopedProjectIds: string[] | null = null;

  if (filters.teamIds) {
    if (filters.teamIds.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }

    const { data: teamProjects } = await supabase
      .from("projects")
      .select("id")
      .in("team_id", filters.teamIds);

    const teamProjectIds = (teamProjects ?? []).map((p) => p.id);
    if (teamProjectIds.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }

    if (filters.projectId && !teamProjectIds.includes(filters.projectId)) {
      return { items: [], total: 0, page, pageSize };
    }

    scopedProjectIds = filters.projectId ? [filters.projectId] : teamProjectIds;
  }

  let query = supabase
    .from("tasks")
    .select(
      "*, project:projects(*, team:teams(*)), assignee:profiles!tasks_assignee_id_fkey(*)",
      { count: "exact" }
    );

  if (scopedProjectIds) {
    query = query.in("project_id", scopedProjectIds);
  } else if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters.assigneeId) query = query.eq("assignee_id", filters.assigneeId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.forUserId) query = query.eq("assignee_id", filters.forUserId);

  const search = filters.search?.trim();
  if (search) {
    const term = escapeIlikeTerm(search);
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    items: (data ?? []) as TaskWithDetails[],
    total: count ?? 0,
    page,
    pageSize,
  };
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
