import type { TaskStatus } from "@/types/database";

export interface ProjectTaskInput {
  status: TaskStatus;
  due_date: string | null;
  assignee_id: string | null;
}

export interface ProjectSummary {
  total: number;
  open: number;
  todo: number;
  inProgress: number;
  review: number;
  rework: number;
  done: number;
  overdue: number;
  unassigned: number;
  completionRate: number;
}

export function buildProjectSummary(tasks: ProjectTaskInput[]): ProjectSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todo = 0;
  let inProgress = 0;
  let review = 0;
  let rework = 0;
  let done = 0;
  let overdue = 0;
  let unassigned = 0;

  for (const task of tasks) {
    if (task.status === "todo") todo++;
    else if (task.status === "in_progress") inProgress++;
    else if (task.status === "review") review++;
    else if (task.status === "rework") rework++;
    else if (task.status === "done") done++;

    if (!task.assignee_id) unassigned++;
    if (task.status !== "done" && task.due_date) {
      const due = new Date(task.due_date);
      if (due < today) overdue++;
    }
  }

  const total = tasks.length;
  const open = total - done;
  const completionRate =
    total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    total,
    open,
    todo,
    inProgress,
    review,
    rework,
    done,
    overdue,
    unassigned,
    completionRate,
  };
}
