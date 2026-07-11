import type { TaskPriority, TaskStatus } from "@/types/database";

export type WorkloadStatus =
  | "available"
  | "moderate"
  | "at_capacity"
  | "overloaded";

export type MemberWorkload = {
  openTasks: number;
  activeTasks: number;
  overdueTasks: number;
  dueThisWeek: number;
  loadPoints: number;
  teamAverageLoad: number;
  loadVsTeamPercent: number | null;
  status: WorkloadStatus;
  statusLabel: string;
  recommendation: string;
};

export const WORKLOAD_STATUS_LABELS: Record<WorkloadStatus, string> = {
  available: "Available",
  moderate: "Moderate",
  at_capacity: "At capacity",
  overloaded: "Overloaded",
};

export type WorkloadTaskInput = {
  assignee_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
};

const STATUS_LOAD: Partial<Record<TaskStatus, number>> = {
  todo: 0.5,
  in_progress: 2,
  review: 1.5,
  rework: 1.5,
};

const PRIORITY_BONUS: Record<TaskPriority, number> = {
  low: 0,
  medium: 0,
  high: 0.75,
  urgent: 1.5,
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "done") return false;
  return startOfDay(new Date(dueDate)) < startOfDay(new Date());
}

function isDueThisWeek(dueDate: string | null, status: string) {
  if (!dueDate || status === "done") return false;
  const due = startOfDay(new Date(dueDate));
  const today = startOfDay(new Date());
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return due >= today && due <= weekEnd;
}

function isActiveStatus(status: string) {
  return status === "in_progress" || status === "review" || status === "rework";
}

function roundLoad(value: number) {
  return Math.round(value * 10) / 10;
}

export function taskLoadPoints(task: WorkloadTaskInput): number {
  const statusLoad = STATUS_LOAD[task.status as TaskStatus] ?? 0.5;
  const priorityBonus =
    PRIORITY_BONUS[task.priority as TaskPriority] ?? 0;
  let points = statusLoad + priorityBonus;
  if (isOverdue(task.due_date, task.status)) {
    points += 1;
  }
  return points;
}

function resolveStatus(
  loadPoints: number,
  teamAverageLoad: number
): WorkloadStatus {
  if (teamAverageLoad > 0) {
    const ratio = loadPoints / teamAverageLoad;
    if (ratio <= 0.8) return "available";
    if (ratio <= 1.2) return "moderate";
    if (ratio <= 1.5) return "at_capacity";
    return "overloaded";
  }

  if (loadPoints <= 4) return "available";
  if (loadPoints <= 8) return "moderate";
  if (loadPoints <= 12) return "at_capacity";
  return "overloaded";
}

function loadVsTeamPercent(
  loadPoints: number,
  teamAverageLoad: number
): number | null {
  if (teamAverageLoad <= 0) return null;
  return Math.round(((loadPoints - teamAverageLoad) / teamAverageLoad) * 100);
}

function recommendationFor(
  status: WorkloadStatus,
  loadPoints: number,
  teamAverageLoad: number,
  loadVsTeam: number | null
) {
  const loadLabel = `Load ${loadPoints}`;
  const teamLabel =
    teamAverageLoad > 0 ? ` · team avg ${teamAverageLoad}` : "";
  const comparison =
    loadVsTeam !== null
      ? loadVsTeam < 0
        ? ` (${Math.abs(loadVsTeam)}% below team avg)`
        : loadVsTeam > 0
          ? ` (${loadVsTeam}% above team avg)`
          : " (at team avg)"
      : "";

  switch (status) {
    case "available":
      return `${loadLabel}${teamLabel}${comparison} — good fit for new tasks`;
    case "moderate":
      return `${loadLabel}${teamLabel}${comparison} — can take work, monitor load`;
    case "at_capacity":
      return `${loadLabel}${teamLabel}${comparison} — assign only if urgent`;
    case "overloaded":
      return `${loadLabel}${teamLabel}${comparison} — avoid new assignments`;
  }
}

type RawMemberMetrics = {
  openTasks: number;
  activeTasks: number;
  overdueTasks: number;
  dueThisWeek: number;
  loadPoints: number;
};

function computeRawMetrics(
  tasks: WorkloadTaskInput[],
  memberId: string
): RawMemberMetrics {
  const memberTasks = tasks.filter(
    (t) => t.assignee_id === memberId && t.status !== "done"
  );

  let loadPoints = 0;
  let activeTasks = 0;
  let overdueTasks = 0;
  let dueThisWeek = 0;

  for (const task of memberTasks) {
    loadPoints += taskLoadPoints(task);

    if (isActiveStatus(task.status)) activeTasks++;
    if (isOverdue(task.due_date, task.status)) overdueTasks++;
    if (isDueThisWeek(task.due_date, task.status)) dueThisWeek++;
  }

  return {
    openTasks: memberTasks.length,
    activeTasks,
    overdueTasks,
    dueThisWeek,
    loadPoints: roundLoad(loadPoints),
  };
}

function finalizeWorkload(
  metrics: RawMemberMetrics,
  teamAverageLoad: number
): MemberWorkload {
  const loadVsTeam = loadVsTeamPercent(metrics.loadPoints, teamAverageLoad);
  const status = resolveStatus(metrics.loadPoints, teamAverageLoad);

  return {
    ...metrics,
    teamAverageLoad: roundLoad(teamAverageLoad),
    loadVsTeamPercent: loadVsTeam,
    status,
    statusLabel: WORKLOAD_STATUS_LABELS[status],
    recommendation: recommendationFor(
      status,
      metrics.loadPoints,
      roundLoad(teamAverageLoad),
      loadVsTeam
    ),
  };
}

export function calculateMemberWorkload(
  tasks: WorkloadTaskInput[],
  memberId: string,
  teamAverageLoad = 0
): MemberWorkload {
  const metrics = computeRawMetrics(tasks, memberId);
  return finalizeWorkload(metrics, teamAverageLoad);
}

export function buildMemberWorkloads(
  tasks: WorkloadTaskInput[],
  memberIds: string[]
): Record<string, MemberWorkload> {
  const rawByMember = new Map<string, RawMemberMetrics>();
  for (const memberId of memberIds) {
    rawByMember.set(memberId, computeRawMetrics(tasks, memberId));
  }

  const teamAverageLoad =
    memberIds.length > 0
      ? roundLoad(
          [...rawByMember.values()].reduce((sum, m) => sum + m.loadPoints, 0) /
            memberIds.length
        )
      : 0;

  const workloads: Record<string, MemberWorkload> = {};
  for (const memberId of memberIds) {
    const metrics = rawByMember.get(memberId)!;
    workloads[memberId] = finalizeWorkload(metrics, teamAverageLoad);
  }
  return workloads;
}

export function sortMembersByAvailability<T extends { id: string }>(
  members: T[],
  workloads: Record<string, MemberWorkload>
): T[] {
  return [...members].sort((a, b) => {
    const wa = workloads[a.id];
    const wb = workloads[b.id];
    if (!wa && !wb) return 0;
    if (!wa) return 1;
    if (!wb) return -1;
    if (wa.loadPoints !== wb.loadPoints) {
      return wa.loadPoints - wb.loadPoints;
    }
    if (wa.overdueTasks !== wb.overdueTasks) {
      return wa.overdueTasks - wb.overdueTasks;
    }
    return wa.activeTasks - wb.activeTasks;
  });
}

export function summarizeAvailability(
  workloads: Record<string, MemberWorkload>
) {
  const summary = {
    available: 0,
    moderate: 0,
    atCapacity: 0,
    overloaded: 0,
  };

  for (const workload of Object.values(workloads)) {
    if (workload.status === "available") summary.available++;
    else if (workload.status === "moderate") summary.moderate++;
    else if (workload.status === "at_capacity") summary.atCapacity++;
    else summary.overloaded++;
  }

  return summary;
}

export function formatLoadVsTeam(loadVsTeamPercent: number | null): string {
  if (loadVsTeamPercent === null) return "";
  if (loadVsTeamPercent < 0) {
    return `${Math.abs(loadVsTeamPercent)}% lighter than team avg`;
  }
  if (loadVsTeamPercent > 0) {
    return `${loadVsTeamPercent}% heavier than team avg`;
  }
  return "At team average";
}
