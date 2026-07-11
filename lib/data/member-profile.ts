import { createClient } from "@/lib/supabase/server";
import { getMemberTeamIds, getProjects, getTasks } from "@/lib/data/queries";
import { getLedTeamIds, getTeamMemberWorkloads } from "@/lib/data/team-lead";
import {
  computeMemberPerformance,
  type MemberPerformance,
  type PerformanceTaskInput,
} from "@/lib/performance/calculate-performance";
import {
  resolvePeriod,
  type PerformancePeriod,
} from "@/lib/performance/periods";
import {
  calculateMemberWorkload,
  type MemberWorkload,
} from "@/lib/workload/member-workload";
import {
  workloadToCapacityDisplay,
  type CapacityDisplay,
  type MemberLeaveStatus,
} from "@/lib/member/profile-display";
import type {
  Profile,
  ProjectWithDetails,
  TaskWithDetails,
} from "@/types/database";

const TASK_PERF_COLUMNS =
  "id, assignee_id, status, priority, due_date, created_at, completed_at, review_cycles, reopened_count, project_id";

export interface MemberTeamInfo {
  id: string;
  name: string;
  joined_at: string;
  leadName?: string | null;
}

export interface MemberProjectSummary {
  project: ProjectWithDetails;
  assignedTotal: number;
  completed: number;
  open: number;
  inProgress: number;
}

export interface MemberActivityItem {
  id: string;
  created_at: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  comment: string | null;
  taskId: string | null;
  taskTitle: string;
  projectName: string | null;
  projectKey: string | null;
}

export interface MemberCompletedTask {
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

export interface MemberProfileData {
  profile: Profile;
  teams: MemberTeamInfo[];
  period: PerformancePeriod;
  periodLabel: string;
  performance: MemberPerformance;
  workload: MemberWorkload;
  taskStats: {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
    rework: number;
    review: number;
    overdue: number;
  };
  projects: MemberProjectSummary[];
  activeTasks: TaskWithDetails[];
  completedTasks: MemberCompletedTask[];
  recentActivity: MemberActivityItem[];
  skills: string[];
  leaveStatus: MemberLeaveStatus;
  capacityDisplay: CapacityDisplay;
  averageCompletionDays: number | null;
}

function dayDiffCompleted(completedAt: string, dueDate: string): number {
  const completed = new Date(completedAt);
  const due = new Date(dueDate);
  completed.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.floor(
    (completed.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function isOverdueOpen(task: TaskWithDetails): boolean {
  if (!task.due_date || task.status === "done") return false;
  const due = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function computeAverageCompletionDays(tasks: TaskWithDetails[]): number | null {
  const completed = tasks.filter((t) => t.status === "done" && t.completed_at);
  if (completed.length === 0) return null;

  const totalDays = completed.reduce((sum, t) => {
    const ms =
      new Date(t.completed_at!).getTime() - new Date(t.created_at).getTime();
    return sum + ms / (1000 * 60 * 60 * 24);
  }, 0);

  return Math.round((totalDays / completed.length) * 10) / 10;
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function teamLeadCanViewMember(
  leadId: string,
  memberId: string
): Promise<boolean> {
  if (leadId === memberId) return true;
  const [ledTeamIds, memberTeamIds] = await Promise.all([
    getLedTeamIds(leadId),
    getMemberTeamIds(memberId),
  ]);
  return memberTeamIds.some((id) => ledTeamIds.includes(id));
}

export async function getMemberProfile(
  memberId: string,
  period: PerformancePeriod = "month"
): Promise<MemberProfileData | null> {
  const profile = await getProfileById(memberId);
  if (!profile) return null;

  const resolved = resolvePeriod(period);
  const supabase = await createClient();

  const [membershipsRes, perfTasksRes, allTasks, allProjects] =
    await Promise.all([
      supabase
        .from("team_members")
        .select("team_id, joined_at")
        .eq("user_id", memberId)
        .order("joined_at", { ascending: true }),
      supabase
        .from("tasks")
        .select(TASK_PERF_COLUMNS)
        .eq("assignee_id", memberId),
      getTasks({ forUserId: memberId }),
      getProjects(),
    ]);

  const membershipRows = membershipsRes.data ?? [];
  const teamIds = membershipRows.map((m) => m.team_id);

  let teams: MemberTeamInfo[] = [];
  if (teamIds.length > 0) {
    const { data: teamRows } = await supabase
      .from("teams")
      .select("id, name, lead:profiles!teams_lead_id_fkey(full_name)")
      .in("id", teamIds);

    const teamById = new Map<string, { id: string; name: string; leadName: string | null }>();
    for (const row of teamRows ?? []) {
      const lead = row.lead as { full_name: string | null } | { full_name: string | null }[] | null;
      const leadProfile = Array.isArray(lead) ? lead[0] : lead;
      teamById.set(row.id, {
        id: row.id,
        name: row.name,
        leadName: leadProfile?.full_name ?? null,
      });
    }

    teams = membershipRows.flatMap((m) => {
      const team = teamById.get(m.team_id);
      if (!team) return [];
      return [
        {
          id: team.id,
          name: team.name,
          joined_at: m.joined_at,
          leadName: team.leadName,
        },
      ];
    });
  }

  const perfTasks = (perfTasksRes.data ?? []) as PerformanceTaskInput[];
  const performance = computeMemberPerformance(memberId, perfTasks, {
    periodStart: resolved.start,
    periodEnd: resolved.end,
    teamThroughputBaseline: 0,
  });

  const workloadInputs = perfTasks.map((t) => ({
    assignee_id: t.assignee_id,
    status: t.status,
    priority: t.priority,
    due_date: t.due_date,
  }));

  let workload: MemberWorkload;
  if (teamIds.length > 0) {
    const teamWorkloads = await getTeamMemberWorkloads(teamIds[0]);
    workload =
      teamWorkloads[memberId] ??
      calculateMemberWorkload(workloadInputs, memberId);
  } else {
    workload = calculateMemberWorkload(workloadInputs, memberId);
  }

  const taskStats = {
    total: allTasks.length,
    done: allTasks.filter((t) => t.status === "done").length,
    inProgress: allTasks.filter((t) => t.status === "in_progress").length,
    todo: allTasks.filter((t) => t.status === "todo").length,
    rework: allTasks.filter((t) => t.status === "rework").length,
    review: allTasks.filter((t) => t.status === "review").length,
    overdue: allTasks.filter(isOverdueOpen).length,
  };

  const projectIdsFromTasks = new Set(allTasks.map((t) => t.project_id));

  const projects: MemberProjectSummary[] = allProjects
    .filter((p) => projectIdsFromTasks.has(p.id))
    .map((project) => {
      const memberTasks = allTasks.filter((t) => t.project_id === project.id);
      return {
        project,
        assignedTotal: memberTasks.length,
        completed: memberTasks.filter((t) => t.status === "done").length,
        open: memberTasks.filter((t) => t.status !== "done").length,
        inProgress: memberTasks.filter((t) => t.status === "in_progress")
          .length,
      };
    })
    .sort((a, b) => b.assignedTotal - a.assignedTotal);

  const activeTasks = allTasks
    .filter((t) => t.status !== "done")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 12);

  const startMs = resolved.start.getTime();
  const endMs = resolved.end.getTime();

  const completedTasks: MemberCompletedTask[] = allTasks
    .filter((t) => t.status === "done" && t.completed_at)
    .filter((t) => {
      const c = new Date(t.completed_at!).getTime();
      return c >= startMs && c <= endMs;
    })
    .sort(
      (a, b) =>
        new Date(b.completed_at!).getTime() -
        new Date(a.completed_at!).getTime()
    )
    .slice(0, 15)
    .map((t) => {
      const onTime =
        !t.due_date ||
        dayDiffCompleted(t.completed_at!, t.due_date) <= 0;
      const firstPass =
        (t.review_cycles ?? 0) <= 0 && (t.reopened_count ?? 0) <= 0;
      return {
        id: t.id,
        title: t.title,
        projectKey: t.project?.key ?? null,
        projectName: t.project?.name ?? null,
        priority: t.priority,
        dueDate: t.due_date,
        completedAt: t.completed_at!,
        onTime,
        firstPass,
      };
    });

  const taskIds = allTasks.map((t) => t.id);
  let recentActivity: MemberActivityItem[] = [];

  if (taskIds.length > 0) {
    const { data: activityRows } = await supabase
      .from("task_activity")
      .select(
        "id, created_at, action, from_status, to_status, comment, task_id, task:tasks(title, project:projects(name, key))"
      )
      .eq("actor_id", memberId)
      .in("task_id", taskIds)
      .order("created_at", { ascending: false })
      .limit(20);

    recentActivity = (activityRows ?? []).map((row) => {
      const task = row.task as {
        title?: string;
        project?: { name?: string; key?: string } | null;
      } | null;
      return {
        id: row.id,
        created_at: row.created_at,
        action: row.action,
        from_status: row.from_status,
        to_status: row.to_status,
        comment: row.comment,
        taskId: row.task_id ?? null,
        taskTitle: task?.title ?? "Task",
        projectName: task?.project?.name ?? null,
        projectKey: task?.project?.key ?? null,
      };
    });
  }

  return {
    profile,
    teams,
    period,
    periodLabel: resolved.label,
    performance,
    workload,
    taskStats,
    projects,
    activeTasks,
    completedTasks,
    recentActivity,
    skills: profile.skills ?? [],
    leaveStatus: profile.leave_status ?? "active",
    capacityDisplay: workloadToCapacityDisplay(workload.status),
    averageCompletionDays: computeAverageCompletionDays(allTasks),
  };
}
