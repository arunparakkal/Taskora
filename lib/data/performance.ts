import { createClient } from "@/lib/supabase/server";
import { fetchTeamMemberProfiles } from "@/lib/data/team-members";
import { getLedTeams } from "@/lib/data/team-lead";
import { getTeams, getUsers } from "@/lib/data/queries";
import { canJoinTeam } from "@/lib/auth/roles";
import {
  buildTeamPerformance,
  computeMemberPerformance,
  type MemberPerformance,
  type PerformanceTaskInput,
} from "@/lib/performance/calculate-performance";
import {
  resolvePeriod,
  type PerformancePeriod,
} from "@/lib/performance/periods";
import type { Profile } from "@/types/database";

const TASK_PERF_COLUMNS =
  "id, assignee_id, status, priority, due_date, created_at, completed_at, review_cycles, reopened_count, project_id";

export interface MemberPerformanceEntry {
  profile: Profile;
  teamName: string;
  performance: MemberPerformance;
}

export interface PerformanceSummary {
  members: number;
  avgOverall: number;
  excellent: number;
  atRisk: number;
  completedTasks: number;
}

export interface TeamPerformanceSummary {
  teamId: string;
  teamName: string;
  memberCount: number;
  avgOverall: number;
  excellent: number;
  atRisk: number;
}

export interface TeamLeadPerformance {
  periodLabel: string;
  period: PerformancePeriod;
  entries: MemberPerformanceEntry[];
  summary: PerformanceSummary;
}

export interface AdminPerformance extends TeamLeadPerformance {
  teamSummaries: TeamPerformanceSummary[];
  summary: PerformanceSummary & { teams: number };
}

function summarizeEntries(entries: MemberPerformanceEntry[]): PerformanceSummary {
  const completedTasks = entries.reduce(
    (sum, e) => sum + e.performance.stats.completed,
    0
  );
  const avgOverall =
    entries.length > 0
      ? Math.round(
          (entries.reduce((s, e) => s + e.performance.overall, 0) /
            entries.length) *
            10
        ) / 10
      : 0;

  return {
    members: entries.length,
    avgOverall,
    excellent: entries.filter((e) => e.performance.level === "excellent")
      .length,
    atRisk: entries.filter((e) => e.performance.level === "at_risk").length,
    completedTasks,
  };
}

function buildEntriesFromTasks(
  memberIds: string[],
  profilesById: Map<string, Profile>,
  teamNameByMember: Map<string, string>,
  tasksByMember: Map<string, PerformanceTaskInput[]>,
  periodStart: Date,
  periodEnd: Date
): MemberPerformanceEntry[] {
  const perfByMember = buildTeamPerformance(
    memberIds,
    tasksByMember,
    periodStart,
    periodEnd
  );

  const entries: MemberPerformanceEntry[] = memberIds.map((id) => ({
    profile: profilesById.get(id)!,
    teamName: teamNameByMember.get(id) ?? "",
    performance: perfByMember.get(id)!,
  }));

  entries.sort((a, b) => b.performance.overall - a.performance.overall);
  return entries;
}

async function fetchTasksForProjects(
  projectIds: string[]
): Promise<(PerformanceTaskInput & { project_id: string })[]> {
  if (projectIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(TASK_PERF_COLUMNS)
    .in("project_id", projectIds);
  return (data ?? []) as (PerformanceTaskInput & { project_id: string })[];
}

async function fetchAllPerformanceTasks(): Promise<PerformanceTaskInput[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select(TASK_PERF_COLUMNS);
  return (data ?? []) as PerformanceTaskInput[];
}

export async function getTeamLeadPerformance(
  userId: string,
  period: PerformancePeriod = "month"
): Promise<TeamLeadPerformance> {
  const resolved = resolvePeriod(period);
  const teams = await getLedTeams(userId);

  const empty: TeamLeadPerformance = {
    periodLabel: resolved.label,
    period: resolved.period,
    entries: [],
    summary: {
      members: 0,
      avgOverall: 0,
      excellent: 0,
      atRisk: 0,
      completedTasks: 0,
    },
  };

  if (teams.length === 0) return empty;

  const supabase = await createClient();
  const teamIds = teams.map((t) => t.id);

  const { data: projectRows } = await supabase
    .from("projects")
    .select("id, team_id")
    .in("team_id", teamIds);

  const projects = projectRows ?? [];
  const allTasks = await fetchTasksForProjects(projects.map((p) => p.id));

  // Gather member profiles across all led teams (dedup by id)
  const profilesById = new Map<string, Profile>();
  const teamNameByMember = new Map<string, string>();
  for (const team of teams) {
    const members = await fetchTeamMemberProfiles(team.id);
    for (const m of members) {
      if (!profilesById.has(m.id)) {
        profilesById.set(m.id, m);
        teamNameByMember.set(m.id, team.name);
      }
    }
  }

  const memberIds = [...profilesById.keys()];
  const tasksByMember = new Map<string, PerformanceTaskInput[]>();
  for (const id of memberIds) tasksByMember.set(id, []);
  for (const task of allTasks) {
    if (task.assignee_id && tasksByMember.has(task.assignee_id)) {
      tasksByMember.get(task.assignee_id)!.push(task);
    }
  }

  const entries = buildEntriesFromTasks(
    memberIds,
    profilesById,
    teamNameByMember,
    tasksByMember,
    resolved.start,
    resolved.end
  );

  return {
    periodLabel: resolved.label,
    period: resolved.period,
    entries,
    summary: summarizeEntries(entries),
  };
}

function buildTeamSummaries(
  teams: { id: string; name: string }[],
  memberIdsByTeam: Map<string, Set<string>>,
  entries: MemberPerformanceEntry[]
): TeamPerformanceSummary[] {
  const entryByUser = new Map(entries.map((e) => [e.profile.id, e]));

  return teams
    .map((team) => {
      const memberIds = memberIdsByTeam.get(team.id) ?? new Set<string>();
      const teamEntries = [...memberIds]
        .map((id) => entryByUser.get(id))
        .filter((e): e is MemberPerformanceEntry => e != null);

      const avgOverall =
        teamEntries.length > 0
          ? Math.round(
              (teamEntries.reduce((s, e) => s + e.performance.overall, 0) /
                teamEntries.length) *
                10
            ) / 10
          : 0;

      return {
        teamId: team.id,
        teamName: team.name,
        memberCount: teamEntries.length,
        avgOverall,
        excellent: teamEntries.filter(
          (e) => e.performance.level === "excellent"
        ).length,
        atRisk: teamEntries.filter((e) => e.performance.level === "at_risk")
          .length,
      };
    })
    .filter((t) => t.memberCount > 0)
    .sort((a, b) => b.avgOverall - a.avgOverall);
}

/** Organization-wide performance for admins — all teams and non-admin users. */
export async function getAdminPerformance(
  period: PerformancePeriod = "month",
  teamId?: string
): Promise<AdminPerformance> {
  const resolved = resolvePeriod(period);

  const empty: AdminPerformance = {
    periodLabel: resolved.label,
    period: resolved.period,
    entries: [],
    teamSummaries: [],
    summary: {
      members: 0,
      teams: 0,
      avgOverall: 0,
      excellent: 0,
      atRisk: 0,
      completedTasks: 0,
    },
  };

  const [users, teams] = await Promise.all([getUsers(), getTeams()]);
  const eligibleUsers = users.filter((u) => canJoinTeam(u.role));

  if (eligibleUsers.length === 0) return empty;

  const supabase = await createClient();
  const teamIds = teamId ? [teamId] : teams.map((t) => t.id);
  const scopedTeams = teamId
    ? teams.filter((t) => t.id === teamId)
    : teams;

  const memberIdsByTeam = new Map<string, Set<string>>();
  const teamNamesByMember = new Map<string, string[]>();
  const memberIdsSet = new Set<string>();

  if (teamIds.length > 0) {
    const { data: membershipRows } = await supabase
      .from("team_members")
      .select("team_id, user_id")
      .in("team_id", teamIds);

    for (const row of membershipRows ?? []) {
      if (!eligibleUsers.some((u) => u.id === row.user_id)) continue;
      memberIdsSet.add(row.user_id);

      if (!memberIdsByTeam.has(row.team_id)) {
        memberIdsByTeam.set(row.team_id, new Set());
      }
      memberIdsByTeam.get(row.team_id)!.add(row.user_id);

      const team = teams.find((t) => t.id === row.team_id);
      if (team) {
        const names = teamNamesByMember.get(row.user_id) ?? [];
        if (!names.includes(team.name)) names.push(team.name);
        teamNamesByMember.set(row.user_id, names);
      }
    }
  }

  let allTasks = await fetchAllPerformanceTasks();

  if (teamId) {
    const { data: projectRows } = await supabase
      .from("projects")
      .select("id")
      .eq("team_id", teamId);
    const projectIds = new Set((projectRows ?? []).map((p) => p.id));
    allTasks = allTasks.filter((t) =>
      projectIds.has((t as PerformanceTaskInput & { project_id: string }).project_id)
    );
  }

  // Include assignees with tasks even if not on a team roster
  for (const task of allTasks) {
    if (
      task.assignee_id &&
      eligibleUsers.some((u) => u.id === task.assignee_id)
    ) {
      memberIdsSet.add(task.assignee_id);
    }
  }

  const profilesById = new Map(
    eligibleUsers
      .filter((u) => memberIdsSet.has(u.id))
      .map((u) => [u.id, u])
  );
  const memberIds = [...profilesById.keys()];

  if (memberIds.length === 0) return empty;

  const teamNameByMember = new Map<string, string>();
  for (const id of memberIds) {
    const names = teamNamesByMember.get(id);
    teamNameByMember.set(id, names?.length ? names.join(", ") : "Unassigned");
  }

  const tasksByMember = new Map<string, PerformanceTaskInput[]>();
  for (const id of memberIds) tasksByMember.set(id, []);
  for (const task of allTasks) {
    if (task.assignee_id && tasksByMember.has(task.assignee_id)) {
      tasksByMember.get(task.assignee_id)!.push(task);
    }
  }

  const entries = buildEntriesFromTasks(
    memberIds,
    profilesById,
    teamNameByMember,
    tasksByMember,
    resolved.start,
    resolved.end
  );

  const teamSummaries = buildTeamSummaries(
    scopedTeams.map((t) => ({ id: t.id, name: t.name })),
    memberIdsByTeam,
    entries
  );

  const summary = summarizeEntries(entries);

  return {
    periodLabel: resolved.label,
    period: resolved.period,
    entries,
    teamSummaries,
    summary: {
      ...summary,
      teams: teamSummaries.length,
    },
  };
}

export interface MemberSelfPerformance {
  periodLabel: string;
  period: PerformancePeriod;
  performance: MemberPerformance;
}

export async function getMemberSelfPerformance(
  userId: string,
  period: PerformancePeriod = "month"
): Promise<MemberSelfPerformance> {
  const resolved = resolvePeriod(period);
  const supabase = await createClient();

  const { data } = await supabase
    .from("tasks")
    .select(TASK_PERF_COLUMNS)
    .eq("assignee_id", userId);

  const tasks = (data ?? []) as PerformanceTaskInput[];

  // For an individual we judge productivity against their own throughput,
  // so no team baseline is applied (baseline 0 => full credit for output).
  const performance = computeMemberPerformance(userId, tasks, {
    periodStart: resolved.start,
    periodEnd: resolved.end,
    teamThroughputBaseline: 0,
  });

  return {
    periodLabel: resolved.label,
    period: resolved.period,
    performance,
  };
}

export interface CompletedTaskSummary {
  id: string;
  title: string;
  projectKey: string | null;
  projectName: string | null;
  priority: string;
  dueDate: string | null;
  completedAt: string;
  onTime: boolean;
  firstPass: boolean;
}

export interface BestPerformerSnapshot {
  entry: MemberPerformanceEntry;
  periodLabel: string;
  completedTasks: CompletedTaskSummary[];
}

function dayDiffCompleted(completedAt: string, dueDate: string): number {
  const completed = new Date(completedAt);
  const due = new Date(dueDate);
  completed.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.floor((completed.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

async function fetchCompletedTasksForMember(
  userId: string,
  period: PerformancePeriod
): Promise<CompletedTaskSummary[]> {
  const resolved = resolvePeriod(period);
  const startMs = resolved.start.getTime();
  const endMs = resolved.end.getTime();

  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(
      "id, title, priority, due_date, completed_at, review_cycles, reopened_count, project:projects(key, name)"
    )
    .eq("assignee_id", userId)
    .eq("status", "done")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  return (data ?? [])
    .filter((t) => {
      if (!t.completed_at) return false;
      const c = new Date(t.completed_at).getTime();
      return c >= startMs && c <= endMs;
    })
    .map((t) => {
      const onTime =
        !t.due_date ||
        dayDiffCompleted(t.completed_at as string, t.due_date) <= 0;
      const firstPass =
        (t.review_cycles ?? 0) <= 0 && (t.reopened_count ?? 0) <= 0;
      const project = t.project as { key?: string; name?: string } | null;
      return {
        id: t.id,
        title: t.title,
        projectKey: project?.key ?? null,
        projectName: project?.name ?? null,
        priority: t.priority,
        dueDate: t.due_date,
        completedAt: t.completed_at as string,
        onTime,
        firstPass,
      };
    });
}

export async function getAdminBestPerformer(
  period: PerformancePeriod = "month"
): Promise<BestPerformerSnapshot | null> {
  const data = await getAdminPerformance(period);
  if (data.entries.length === 0) return null;

  const top = data.entries[0];
  const completedTasks = await fetchCompletedTasksForMember(
    top.profile.id,
    period
  );

  return {
    entry: top,
    periodLabel: data.periodLabel,
    completedTasks,
  };
}

export async function getTeamLeadBestPerformer(
  userId: string,
  period: PerformancePeriod = "month"
): Promise<BestPerformerSnapshot | null> {
  const data = await getTeamLeadPerformance(userId, period);
  if (data.entries.length === 0) return null;

  const top = data.entries[0];
  const completedTasks = await fetchCompletedTasksForMember(
    top.profile.id,
    period
  );

  return {
    entry: top,
    periodLabel: data.periodLabel,
    completedTasks,
  };
}
