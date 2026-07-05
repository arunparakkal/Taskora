import type { TaskStatus } from "@/types/database";

export type DueDateStatus =
  | "none"
  | "overdue"
  | "today"
  | "soon"
  | "on_track"
  | "completed";

export interface DueDateInfo {
  status: DueDateStatus;
  label: string;
  daysUntilDue: number | null;
}

export function getDueDateInfo(
  dueDate: string | null | undefined,
  taskStatus: TaskStatus
): DueDateInfo {
  if (!dueDate) {
    return { status: "none", label: "No due date", daysUntilDue: null };
  }

  if (taskStatus === "done") {
    return { status: "completed", label: "Completed", daysUntilDue: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff < 0) {
    const days = Math.abs(diff);
    return {
      status: "overdue",
      label: days === 1 ? "1 day overdue" : `${days} days overdue`,
      daysUntilDue: diff,
    };
  }
  if (diff === 0) {
    return { status: "today", label: "Due today", daysUntilDue: 0 };
  }
  if (diff <= 3) {
    return {
      status: "soon",
      label: diff === 1 ? "Due tomorrow" : `Due in ${diff} days`,
      daysUntilDue: diff,
    };
  }
  return {
    status: "on_track",
    label: `Due in ${diff} days`,
    daysUntilDue: diff,
  };
}

export function getTaskAgeDays(createdAt: string): number {
  const created = new Date(createdAt);
  created.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export const MEMBER_STATUS_GUIDE: Record<
  TaskStatus,
  { title: string; hint: string }
> = {
  todo: {
    title: "Ready to start",
    hint: "Move to In Progress when you begin working on this task.",
  },
  in_progress: {
    title: "Active work",
    hint: "Mark as Done when your work is complete. Your team lead will review it.",
  },
  review: {
    title: "Done — awaiting review",
    hint: "You marked this as done. Your team lead will approve or request changes.",
  },
  rework: {
    title: "Rework assigned",
    hint: "Fix the issues below, move to In Progress when you start, then mark Done when finished.",
  },
  done: {
    title: "Completed",
    hint: "This task is finished. Great work!",
  },
};

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  status_changed: "Status updated",
  approved: "Approved by team lead",
  changes_requested: "Changes requested",
  reopened: "Task reopened",
};

export interface RejectionFeedback {
  comment: string;
  actorName: string;
  createdAt: string;
}

/** Latest review → rework event (with optional written reason). */
export function getLatestReworkFromActivity(
  activity: Array<{
    action: string;
    comment: string | null;
    created_at: string;
    actor?: { full_name?: string; email?: string } | null;
  }>
): RejectionFeedback | null {
  const rework = activity.find((item) => item.action === "changes_requested");
  if (!rework) return null;

  return {
    comment: rework.comment?.trim() ?? "",
    actorName:
      rework.actor?.full_name || rework.actor?.email || "Your reviewer",
    createdAt: rework.created_at,
  };
}
