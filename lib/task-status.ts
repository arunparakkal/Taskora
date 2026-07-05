import type { TaskStatus } from "@/types/database";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  rework: "Rework",
  done: "Done",
};

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: TASK_STATUS_LABELS.todo },
  { value: "in_progress", label: TASK_STATUS_LABELS.in_progress },
  { value: "review", label: TASK_STATUS_LABELS.review },
  { value: "rework", label: TASK_STATUS_LABELS.rework },
  { value: "done", label: TASK_STATUS_LABELS.done },
];

/** Member-facing label: "Review" is shown as "Done" (still submits for team lead review). */
export function getMemberStatusLabel(status: TaskStatus): string {
  if (status === "review") return "Done";
  return TASK_STATUS_LABELS[status];
}

/** Members: To Do → In Progress → Done (Done = submit for review). */
export const MEMBER_TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: TASK_STATUS_LABELS.todo },
  { value: "in_progress", label: TASK_STATUS_LABELS.in_progress },
  { value: "review", label: "Done" },
];

export function isMemberStatusLocked(status: TaskStatus): boolean {
  return status === "review" || status === "done";
}

/** Dropdown options for members (shows current Rework as read-only when assigned). */
export function getMemberStatusOptions(currentStatus: TaskStatus) {
  const opts = [...MEMBER_TASK_STATUS_OPTIONS];
  if (
    currentStatus === "rework" &&
    !opts.some((o) => o.value === "rework")
  ) {
    opts.splice(2, 0, { value: "rework", label: TASK_STATUS_LABELS.rework });
  }
  return opts;
}
