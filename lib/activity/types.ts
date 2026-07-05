import type { Profile, TaskStatus } from "@/types/database";

export type ActivityEventType =
  | "task_status_changed"
  | "task_approved"
  | "task_rework"
  | "task_reopened"
  | "task_created"
  | "project_created"
  | "project_status_changed"
  | "team_created"
  | "member_added";

export type ActivityFilterType = "all" | ActivityEventType;

export const ACTIVITY_EVENT_LABELS: Record<ActivityEventType, string> = {
  task_status_changed: "Task status updated",
  task_approved: "Task approved",
  task_rework: "Changes requested",
  task_reopened: "Task reopened",
  task_created: "New task",
  project_created: "New project",
  project_status_changed: "Project status changed",
  team_created: "New team",
  member_added: "Member added to team",
};

export const ACTIVITY_FILTER_OPTIONS: { value: ActivityFilterType; label: string }[] =
  [
    { value: "all", label: "All types" },
    { value: "task_status_changed", label: "Task updates" },
    { value: "task_approved", label: "Task approved" },
    { value: "task_rework", label: "Rework requested" },
    { value: "task_created", label: "New tasks" },
    { value: "project_status_changed", label: "Project status" },
    { value: "project_created", label: "New projects" },
    { value: "member_added", label: "Members added" },
    { value: "team_created", label: "New teams" },
    { value: "task_reopened", label: "Task reopened" },
  ];

export interface ActivityFeedItem {
  id: string;
  eventType: ActivityEventType;
  created_at: string;
  actor?: Pick<Profile, "full_name" | "email"> | null;
  task_id?: string | null;
  taskTitle?: string;
  projectId?: string;
  projectName?: string;
  projectKey?: string;
  teamId?: string;
  teamName?: string;
  assigneeId?: string | null;
  summary: string;
  detail?: string | null;
  comment?: string | null;
  from_status?: TaskStatus | null;
  to_status?: TaskStatus | null;
}

export function taskActivityToEventType(
  action: string
): ActivityEventType {
  switch (action) {
    case "approved":
      return "task_approved";
    case "changes_requested":
      return "task_rework";
    case "reopened":
      return "task_reopened";
    default:
      return "task_status_changed";
  }
}
