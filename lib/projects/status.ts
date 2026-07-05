import type { ProjectStatus } from "@/types/database";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export function getProjectCompletionRate(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}
