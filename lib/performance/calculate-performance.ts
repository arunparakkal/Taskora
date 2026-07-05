import type { TaskPriority, TaskStatus } from "@/types/database";

/**
 * Performance scoring engine.
 *
 * Design principles (see docs/PROJECT_PROGRESS.md):
 *  - Quality is the heaviest pillar (35). First-pass approvals score highest.
 *  - Delivery (25) rewards meeting deadlines; finishing early is only a small bonus.
 *  - Productivity (20) measures meaningful (priority-weighted) throughput, judged
 *    relative to the team so many easy tasks never beat fewer complex ones.
 *  - Reliability (15) penalises overdue / reopened / stale work.
 *  - Collaboration (5) is a placeholder pillar for now.
 * Every pillar is transparent and returns a human-readable breakdown.
 */

export const PILLAR_WEIGHTS = {
  quality: 35,
  delivery: 25,
  productivity: 20,
  reliability: 15,
  collaboration: 5,
} as const;

export type PerformanceLevel =
  | "excellent"
  | "very_good"
  | "good"
  | "needs_improvement"
  | "at_risk";

export const PERFORMANCE_LEVEL_LABELS: Record<PerformanceLevel, string> = {
  excellent: "Excellent",
  very_good: "Very Good",
  good: "Good",
  needs_improvement: "Needs Improvement",
  at_risk: "At Risk",
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export interface PerformanceTaskInput {
  id: string;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  review_cycles: number;
  reopened_count: number;
}

export interface PillarScore {
  /** 0-100 percentage the member achieved on this pillar. */
  percent: number;
  /** points earned out of the pillar weight. */
  points: number;
  /** max points for this pillar. */
  max: number;
}

export interface MemberPerformance {
  userId: string;
  overall: number;
  level: PerformanceLevel;
  pillars: {
    quality: PillarScore;
    delivery: PillarScore;
    productivity: PillarScore;
    reliability: PillarScore;
    collaboration: PillarScore;
  };
  stats: {
    completed: number;
    onTime: number;
    late: number;
    firstPassApprovals: number;
    reopened: number;
    overdueOpen: number;
    completionRate: number;
    onTimeRate: number;
    weightedThroughput: number;
  };
}

const DAY_MS = 1000 * 60 * 60 * 24;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function toLevel(overall: number): PerformanceLevel {
  if (overall >= 90) return "excellent";
  if (overall >= 80) return "very_good";
  if (overall >= 70) return "good";
  if (overall >= 60) return "needs_improvement";
  return "at_risk";
}

function pillar(percent: number, max: number): PillarScore {
  const p = clamp(percent);
  return { percent: round(p), points: round((p / 100) * max), max };
}

function dayDiff(from: string, to: string): number {
  return Math.floor(
    (new Date(from).setHours(0, 0, 0, 0) - new Date(to).setHours(0, 0, 0, 0)) /
      DAY_MS
  );
}

// --- Individual pillar percentages (0-100) ---

function qualityPercent(completed: PerformanceTaskInput[]): number {
  if (completed.length === 0) return 70; // neutral baseline with no signal
  const total = completed.reduce((sum, t) => {
    let score: number;
    if (t.review_cycles <= 0) score = 100;
    else if (t.review_cycles === 1) score = 85;
    else score = 70;
    score -= Math.min(t.reopened_count, 3) * 25;
    return sum + clamp(score);
  }, 0);
  return total / completed.length;
}

function deliveryPercent(completed: PerformanceTaskInput[]): number {
  const withDue = completed.filter((t) => t.due_date && t.completed_at);
  if (withDue.length === 0) return 85; // neutral when no deadlines set
  const total = withDue.reduce((sum, t) => {
    const diff = dayDiff(t.completed_at as string, t.due_date as string);
    let score: number;
    if (diff <= -2) score = 100;
    else if (diff <= 0) score = 95;
    else if (diff <= 3) score = 70;
    else if (diff <= 7) score = 50;
    else score = 25;
    return sum + score;
  }, 0);
  return total / withDue.length;
}

function reliabilityPercent(
  tasks: PerformanceTaskInput[],
  periodEnd: Date
): number {
  let score = 100;
  const endMs = periodEnd.getTime();
  for (const t of tasks) {
    const isDone = t.status === "done";
    // Overdue and still open
    if (!isDone && t.due_date) {
      const due = new Date(t.due_date).getTime();
      if (due < endMs) score -= 6;
    }
    // Completed after the deadline
    if (isDone && t.due_date && t.completed_at) {
      if (dayDiff(t.completed_at, t.due_date) > 0) score -= 3;
    }
    // Reopened work is a reliability hit
    score -= Math.min(t.reopened_count, 3) * 10;
    // Long-running unfinished tasks
    if (!isDone && t.status !== "todo") {
      const age = (endMs - new Date(t.created_at).getTime()) / DAY_MS;
      if (age > 14) score -= 5;
    }
  }
  return clamp(score);
}

function weightedThroughput(completed: PerformanceTaskInput[]): number {
  return completed.reduce((sum, t) => sum + PRIORITY_WEIGHT[t.priority], 0);
}

/**
 * Productivity is relative to the team's typical output so that grinding many
 * trivial tasks does not automatically beat fewer complex ones.
 */
function productivityPercent(
  memberThroughput: number,
  teamBaseline: number
): number {
  if (teamBaseline <= 0) return memberThroughput > 0 ? 100 : 50;
  return clamp((memberThroughput / teamBaseline) * 100);
}

function collaborationPercent(): number {
  // Placeholder pillar. Kept intentionally simple until comment / review
  // signals are wired in (see Future Improvements).
  return 75;
}

interface ComputeOptions {
  periodStart: Date;
  periodEnd: Date;
  /** Team baseline for productivity (e.g. team average weighted throughput). */
  teamThroughputBaseline: number;
}

export function computeMemberPerformance(
  userId: string,
  tasks: PerformanceTaskInput[],
  options: ComputeOptions
): MemberPerformance {
  const { periodStart, periodEnd, teamThroughputBaseline } = options;
  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();

  const completedInPeriod = tasks.filter((t) => {
    if (t.status !== "done" || !t.completed_at) return false;
    const c = new Date(t.completed_at).getTime();
    return c >= startMs && c <= endMs;
  });

  const onTime = completedInPeriod.filter(
    (t) =>
      !t.due_date ||
      (t.completed_at && dayDiff(t.completed_at, t.due_date) <= 0)
  ).length;
  const late = completedInPeriod.length - onTime;
  const firstPassApprovals = completedInPeriod.filter(
    (t) => t.review_cycles <= 0 && t.reopened_count <= 0
  ).length;
  const reopened = tasks.reduce(
    (sum, t) => sum + Math.min(t.reopened_count, 5),
    0
  );
  const overdueOpen = tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.due_date &&
      new Date(t.due_date).getTime() < endMs
  ).length;

  const throughput = weightedThroughput(completedInPeriod);

  const quality = pillar(
    qualityPercent(completedInPeriod),
    PILLAR_WEIGHTS.quality
  );
  const delivery = pillar(
    deliveryPercent(completedInPeriod),
    PILLAR_WEIGHTS.delivery
  );
  const productivity = pillar(
    productivityPercent(throughput, teamThroughputBaseline),
    PILLAR_WEIGHTS.productivity
  );
  const reliability = pillar(
    reliabilityPercent(tasks, periodEnd),
    PILLAR_WEIGHTS.reliability
  );
  const collaboration = pillar(
    collaborationPercent(),
    PILLAR_WEIGHTS.collaboration
  );

  const overall = round(
    quality.points +
      delivery.points +
      productivity.points +
      reliability.points +
      collaboration.points
  );

  const totalAssigned = tasks.length;
  const completionRate =
    totalAssigned > 0
      ? round((completedInPeriod.length / totalAssigned) * 100)
      : 0;
  const onTimeRate =
    completedInPeriod.length > 0
      ? round((onTime / completedInPeriod.length) * 100)
      : 0;

  return {
    userId,
    overall,
    level: toLevel(overall),
    pillars: { quality, delivery, productivity, reliability, collaboration },
    stats: {
      completed: completedInPeriod.length,
      onTime,
      late,
      firstPassApprovals,
      reopened,
      overdueOpen,
      completionRate,
      onTimeRate,
      weightedThroughput: throughput,
    },
  };
}

/**
 * Builds performance for every member of a team, computing the productivity
 * baseline from the group so scores are judged fairly against peers.
 */
export function buildTeamPerformance(
  memberIds: string[],
  tasksByMember: Map<string, PerformanceTaskInput[]>,
  periodStart: Date,
  periodEnd: Date
): Map<string, MemberPerformance> {
  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();

  const throughputs = memberIds.map((id) => {
    const tasks = tasksByMember.get(id) ?? [];
    const completed = tasks.filter((t) => {
      if (t.status !== "done" || !t.completed_at) return false;
      const c = new Date(t.completed_at).getTime();
      return c >= startMs && c <= endMs;
    });
    return weightedThroughput(completed);
  });

  const active = throughputs.filter((t) => t > 0);
  const baseline =
    active.length > 0
      ? active.reduce((sum, t) => sum + t, 0) / active.length
      : 0;

  const result = new Map<string, MemberPerformance>();
  for (const id of memberIds) {
    result.set(
      id,
      computeMemberPerformance(id, tasksByMember.get(id) ?? [], {
        periodStart,
        periodEnd,
        teamThroughputBaseline: baseline,
      })
    );
  }
  return result;
}
