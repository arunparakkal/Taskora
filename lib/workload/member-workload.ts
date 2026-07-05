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
  score: number;
  capacity: number;
  availability: number;
  status: WorkloadStatus;
  statusLabel: string;
  recommendation: string;
};

export const DEFAULT_MEMBER_CAPACITY = 5;

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

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 0.5,
  medium: 1,
  high: 2,
  urgent: 3,
};

const STATUS_SCORE: Partial<Record<TaskStatus, number>> = {
  todo: 1,
  in_progress: 2,
  rework: 2,
  review: 1.5,
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

function resolveStatus(
  activeTasks: number,
  capacity: number
): WorkloadStatus {
  const availability = capacity - activeTasks;
  if (activeTasks > capacity) return "overloaded";
  const freeRatio = availability / capacity;
  if (freeRatio >= 0.4) return "available";
  if (freeRatio >= 0.2) return "moderate";
  return "at_capacity";
}

function recommendationFor(status: WorkloadStatus, availability: number) {
  switch (status) {
    case "available":
      return `Good fit for new tasks (${availability} slot${availability !== 1 ? "s" : ""} free)`;
    case "moderate":
      return "Can take work, but monitor load";
    case "at_capacity":
      return "At limit — assign only if urgent";
    case "overloaded":
      return "Overloaded — avoid new assignments";
  }
}

export function calculateMemberWorkload(
  tasks: WorkloadTaskInput[],
  memberId: string,
  capacity = DEFAULT_MEMBER_CAPACITY
): MemberWorkload {
  const memberTasks = tasks.filter(
    (t) => t.assignee_id === memberId && t.status !== "done"
  );

  let score = 0;
  let activeTasks = 0;
  let overdueTasks = 0;
  let dueThisWeek = 0;

  for (const task of memberTasks) {
    const priority = task.priority as TaskPriority;
    score += STATUS_SCORE[task.status as TaskStatus] ?? 1;
    score += PRIORITY_WEIGHT[priority] ?? 1;

    if (isActiveStatus(task.status)) activeTasks++;
    if (isOverdue(task.due_date, task.status)) {
      overdueTasks++;
      score += 2;
    }
    if (isDueThisWeek(task.due_date, task.status)) {
      dueThisWeek++;
      score += 1;
    }
  }

  const availability = capacity - activeTasks;
  const status = resolveStatus(activeTasks, capacity);

  return {
    openTasks: memberTasks.length,
    activeTasks,
    overdueTasks,
    dueThisWeek,
    score: Math.round(score * 10) / 10,
    capacity,
    availability,
    status,
    statusLabel: WORKLOAD_STATUS_LABELS[status],
    recommendation: recommendationFor(status, Math.max(availability, 0)),
  };
}

export function buildMemberWorkloads(
  tasks: WorkloadTaskInput[],
  memberIds: string[],
  capacity = DEFAULT_MEMBER_CAPACITY
): Record<string, MemberWorkload> {
  const workloads: Record<string, MemberWorkload> = {};
  for (const memberId of memberIds) {
    workloads[memberId] = calculateMemberWorkload(tasks, memberId, capacity);
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
    if (wb.availability !== wa.availability) {
      return wb.availability - wa.availability;
    }
    return wa.score - wb.score;
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
