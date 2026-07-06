import type { WorkloadStatus } from "@/lib/workload/member-workload";

export type CapacityDisplay = "available" | "busy" | "overloaded";

export const CAPACITY_DISPLAY_LABELS: Record<CapacityDisplay, string> = {
  available: "Available",
  busy: "Busy",
  overloaded: "Overloaded",
};

export function workloadToCapacityDisplay(
  status: WorkloadStatus
): CapacityDisplay {
  if (status === "available") return "available";
  if (status === "overloaded") return "overloaded";
  return "busy";
}

export type MemberLeaveStatus = "active" | "on_leave" | "partial";

export const LEAVE_STATUS_LABELS: Record<MemberLeaveStatus, string> = {
  active: "Available for work",
  on_leave: "On leave",
  partial: "Partial availability",
};

export function formatAverageCompletionDays(days: number | null): string {
  if (days == null) return "—";
  if (days < 1) {
    const hours = Math.round(days * 24);
    return hours <= 1 ? "< 1 hour" : `${hours} hours`;
  }
  if (days < 10) return `${days.toFixed(1)} days`;
  return `${Math.round(days)} days`;
}
