import { createClient } from "@/lib/supabase/server";
import { fetchTeamMemberProfiles } from "@/lib/data/team-members";
import {
  buildMemberWorkloads,
  sortMembersByAvailability,
  summarizeAvailability,
  type MemberWorkload,
  type WorkloadTaskInput,
} from "@/lib/workload/member-workload";
import type {
  Profile,
  ProjectWithDetails,
  TaskWithDetails,
  TeamWithDetails,
} from "@/types/database";

export type TeamLeadAvailability = {
  summary: {
    available: number;
    moderate: number;
    atCapacity: number;
    overloaded: number;
  };
  members: Array<{
    profile: Profile;
    teamName: string;
    workload: MemberWorkload;
  }>;
};

export type TeamLeadDashboardStats = {
  teams: number;
  members: number;
  projects: { total: number; active: number };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    inReview: number;
    overdue: number;
    unassigned: number;
    recent: TaskWithDetails[];
    reviewQueue: TaskWithDetails[];
  };
};

export type TeamLeadTeamOverview = {
  team: TeamWithDetails;
  members: Profile[];
  projectCount: number;
  taskCount: number;
  openTasks: number;
  memberTaskCounts: Record<string, { total: number; open: number }>;
  memberWorkloads: Record<string, MemberWorkload>;
};

/** Teams where the user is assigned as lead */
export async function getLedTeamIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("id")
    .eq("lead_id", userId);

  return (data ?? []).map((t) => t.id);
}

export async function getProjectById(
  projectId: string
): Promise<ProjectWithDetails | null> {
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("*, team:teams(*, lead:profiles!teams_lead_id_fkey(*))")
    .eq("id", projectId)
    .single();

  if (error || !project) return null;

  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const team = project.team as TeamWithDetails | null;

  return {
    ...project,
    team: team
      ? { ...team, lead: (team.lead as Profile | null) ?? null }
      : null,
    task_count: count ?? 0,
  } as ProjectWithDetails;
}

export async function getProjectTasks(projectId: string): Promise<TaskWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "*, project:projects(key, name, team_id), assignee:profiles!tasks_assignee_id_fkey(full_name, email)"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as TaskWithDetails[];
}

export async function userLeadsProjectTeam(
  userId: string,
  projectId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("team_id")
    .eq("id", projectId)
    .single();

  if (!project) return false;

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", project.team_id)
    .eq("lead_id", userId)
    .maybeSingle();

  return !!team;
}

export async function isTeamMember(
  teamId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

export async function getTeamMembersForProject(
  teamId: string
): Promise<Profile[]> {
  return fetchTeamMemberProfiles(teamId);
}

export async function getLedTeams(userId: string): Promise<TeamWithDetails[]> {
  const supabase = await createClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .eq("lead_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;

  const withCounts = await Promise.all(
    (teams ?? []).map(async (team) => {
      const { count } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_id", team.id);

      return {
        ...team,
        member_count: count ?? 0,
      } as TeamWithDetails;
    })
  );

  return withCounts;
}

export async function getTeamLeadDashboardStats(
  userId: string
): Promise<TeamLeadDashboardStats> {
  const supabase = await createClient();
  const teamIds = await getLedTeamIds(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (teamIds.length === 0) {
    return {
      teams: 0,
      members: 0,
      projects: { total: 0, active: 0 },
      tasks: {
        total: 0,
        byStatus: { todo: 0, in_progress: 0, review: 0, done: 0 },
        inReview: 0,
        overdue: 0,
        unassigned: 0,
        recent: [],
        reviewQueue: [],
      },
    };
  }

  const [teamsRes, projectsRes, tasksRes, memberRowsRes] = await Promise.all([
    supabase.from("teams").select("id").eq("lead_id", userId),
    supabase.from("projects").select("id, status, team_id").in("team_id", teamIds),
    supabase
      .from("tasks")
      .select(
        "*, project:projects(key, name, team_id), assignee:profiles!tasks_assignee_id_fkey(full_name, email)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("team_members").select("user_id").in("team_id", teamIds),
  ]);

  const projects = (projectsRes.data ?? []).filter((p) =>
    teamIds.includes(p.team_id)
  );
  const tasks = ((tasksRes.data ?? []) as TaskWithDetails[]).filter((task) =>
    task.project?.team_id ? teamIds.includes(task.project.team_id) : false
  );

  const memberIds = new Set((memberRowsRes.data ?? []).map((m) => m.user_id));

  const byStatus: Record<string, number> = {
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };
  let overdue = 0;
  let unassigned = 0;

  for (const task of tasks) {
    byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
    if (!task.assignee_id) unassigned++;
    if (task.due_date && task.status !== "done") {
      const due = new Date(task.due_date);
      if (due < today) overdue++;
    }
  }

  const reviewQueue = tasks.filter((t) => t.status === "review").slice(0, 5);

  return {
    teams: teamsRes.data?.length ?? 0,
    members: memberIds.size,
    projects: {
      total: projects.length,
      active: projects.filter((p) => p.status === "active").length,
    },
    tasks: {
      total: tasks.length,
      byStatus,
      inReview: byStatus.review ?? 0,
      overdue,
      unassigned,
      recent: tasks.slice(0, 5),
      reviewQueue,
    },
  };
}

export async function getTeamMemberWorkloads(
  teamId: string
): Promise<Record<string, MemberWorkload>> {
  const members = await fetchTeamMemberProfiles(teamId);
  const tasks = await fetchWorkloadTasksForTeam(teamId);
  return buildMemberWorkloads(
    tasks,
    members.map((m) => m.id)
  );
}

export async function getTeamLeadAvailability(
  userId: string
): Promise<TeamLeadAvailability> {
  const overviews = await getLedTeamsOverview(userId);
  const members: TeamLeadAvailability["members"] = [];

  for (const overview of overviews) {
    for (const member of overview.members) {
      const workload = overview.memberWorkloads[member.id];
      if (workload) {
        members.push({
          profile: member,
          teamName: overview.team.name,
          workload,
        });
      }
    }
  }

  members.sort((a, b) => {
    if (b.workload.availability !== a.workload.availability) {
      return b.workload.availability - a.workload.availability;
    }
    return a.workload.score - b.workload.score;
  });

  const allWorkloads = Object.fromEntries(
    members.map((m) => [m.profile.id, m.workload])
  );

  return {
    summary: summarizeAvailability(allWorkloads),
    members,
  };
}

async function fetchWorkloadTasksForTeam(
  teamId: string
): Promise<WorkloadTaskInput[]> {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("team_id", teamId);

  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length === 0) return [];

  const { data } = await supabase
    .from("tasks")
    .select("assignee_id, status, priority, due_date")
    .in("project_id", projectIds);

  return (data ?? []) as WorkloadTaskInput[];
}

export async function getLedTeamsOverview(
  userId: string
): Promise<TeamLeadTeamOverview[]> {
  const teams = await getLedTeams(userId);
  if (teams.length === 0) return [];

  const supabase = await createClient();
  const teamIds = teams.map((t) => t.id);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, team_id")
    .in("team_id", teamIds);

  const projectIds = (projects ?? []).map((p) => p.id);

  let tasks: Array<{
    id: string;
    status: string;
    project_id: string;
    assignee_id: string | null;
    priority: string;
    due_date: string | null;
  }> = [];
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("tasks")
      .select("id, status, project_id, assignee_id, priority, due_date")
      .in("project_id", projectIds);
    tasks = data ?? [];
  }

  return Promise.all(
    teams.map(async (team) => {
      const members = await fetchTeamMemberProfiles(team.id);
      const teamProjectIds = (projects ?? [])
        .filter((p) => p.team_id === team.id)
        .map((p) => p.id);
      const teamTasks = tasks.filter((t) =>
        teamProjectIds.includes(t.project_id)
      );

      const memberTaskCounts: Record<string, { total: number; open: number }> =
        {};
      for (const task of teamTasks) {
        if (!task.assignee_id) continue;
        if (!memberTaskCounts[task.assignee_id]) {
          memberTaskCounts[task.assignee_id] = { total: 0, open: 0 };
        }
        memberTaskCounts[task.assignee_id].total++;
        if (task.status !== "done") {
          memberTaskCounts[task.assignee_id].open++;
        }
      }

      const memberWorkloads = buildMemberWorkloads(
        teamTasks,
        members.map((m) => m.id)
      );
      const membersByAvailability = sortMembersByAvailability(
        members,
        memberWorkloads
      );

      return {
        team,
        members: membersByAvailability,
        projectCount: teamProjectIds.length,
        taskCount: teamTasks.length,
        openTasks: teamTasks.filter((t) => t.status !== "done").length,
        memberTaskCounts,
        memberWorkloads,
      };
    })
  );
}
