/** ISO date string YYYY-MM-DD comparison (safe for DATE columns). */
export function isDateInRange(
  date: string,
  start: string | null | undefined,
  end: string | null | undefined
): boolean {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function validateTaskDueDateForProject(
  dueDate: string | null | undefined,
  projectStart: string | null | undefined,
  projectDue: string | null | undefined
): string | null {
  if (!dueDate?.trim()) return null;
  if (!projectStart || !projectDue) {
    return "This project has no date range set. Ask an admin to add start and due dates.";
  }
  if (!isDateInRange(dueDate, projectStart, projectDue)) {
    return `Task due date must be between ${projectStart} and ${projectDue}.`;
  }
  return null;
}

/** Team leads can only add tasks while today falls within the project period and project is active. */
export function isProjectOpenForNewTasks(
  startDate: string | null | undefined,
  dueDate: string | null | undefined,
  status: "active" | "paused" | "archived" = "active"
): boolean {
  if (status !== "active") return false;
  if (!startDate || !dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return today >= startDate && today <= dueDate;
}

export function projectPeriodLabel(
  startDate: string | null | undefined,
  dueDate: string | null | undefined
): string | null {
  if (!startDate || !dueDate) return null;
  return `${startDate} → ${dueDate}`;
}
