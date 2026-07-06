import { createClient } from "@/lib/supabase/server";
import {
  ACTIVITY_EVENT_LABELS,
  type ActivityEventType,
} from "@/lib/activity/types";
import { getAdminDashboardStats, type AdminDashboardStats } from "@/lib/data/admin-dashboard";
import { getProfileById } from "@/lib/data/member-profile";
import {
  resolvePeriod,
  type PerformancePeriod,
} from "@/lib/performance/periods";
import type { Profile, Project, Task, Team } from "@/types/database";

export interface AdminActivityItem {
  id: string;
  eventType: ActivityEventType;
  created_at: string;
  summary: string;
  detail: string | null;
  projectId?: string | null;
  projectName?: string | null;
  projectKey?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
}

export interface AdminProfileData {
  profile: Profile;
  period: PerformancePeriod;
  periodLabel: string;
  stats: {
    teamsCreated: number;
    projectsCreated: number;
    tasksCreated: number;
    membersAdded: number;
    statusChanges: number;
    actionsInPeriod: number;
  };
  teamsCreated: Team[];
  projectsCreated: (Project & { team?: { name: string } | null })[];
  tasksCreated: (Task & {
    project?: { key: string; name: string } | null;
    assignee?: { full_name: string; email: string } | null;
  })[];
  recentActivity: AdminActivityItem[];
  orgSnapshot?: AdminDashboardStats;
}

export async function getAdminProfile(
  adminId: string,
  period: PerformancePeriod = "month",
  options?: { includeOrgSnapshot?: boolean }
): Promise<AdminProfileData | null> {
  const profile = await getProfileById(adminId);
  if (!profile || profile.role !== "admin") return null;

  const resolved = resolvePeriod(period);
  const startMs = resolved.start.getTime();
  const endMs = resolved.end.getTime();
  const supabase = await createClient();

  const [
    teamsRes,
    projectsRes,
    tasksCountRes,
    tasksRes,
    eventsRes,
    orgSnapshot,
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("*")
      .eq("created_by", adminId)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*, team:teams(name)")
      .eq("created_by", adminId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("created_by", adminId),
    supabase
      .from("tasks")
      .select(
        "*, project:projects(key, name), assignee:profiles!tasks_assignee_id_fkey(full_name, email)"
      )
      .eq("created_by", adminId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("activity_events")
      .select(
        "*, project:projects(name, key), team:teams(name), task:tasks(title)"
      )
      .eq("actor_id", adminId)
      .order("created_at", { ascending: false })
      .limit(50),
    options?.includeOrgSnapshot ? getAdminDashboardStats() : Promise.resolve(undefined),
  ]);

  const teamsCreated = (teamsRes.data ?? []) as Team[];
  const projectsCreated = (projectsRes.data ?? []) as AdminProfileData["projectsCreated"];
  const tasksCreated = (tasksRes.data ?? []) as AdminProfileData["tasksCreated"];

  const allEvents = eventsRes.data ?? [];
  const eventsInPeriod = allEvents.filter((e) => {
    const t = new Date(e.created_at).getTime();
    return t >= startMs && t <= endMs;
  });

  const membersAdded = allEvents.filter(
    (e) => e.event_type === "member_added"
  ).length;
  const statusChanges = allEvents.filter(
    (e) => e.event_type === "project_status_changed"
  ).length;

  const recentActivity: AdminActivityItem[] = eventsInPeriod
    .slice(0, 25)
    .map((row) => {
      const project = row.project as { name?: string; key?: string } | null;
      const team = row.team as { name?: string } | null;
      const task = row.task as { title?: string } | null;
      return {
        id: row.id,
        eventType: row.event_type as ActivityEventType,
        created_at: row.created_at,
        summary: row.summary,
        detail: row.detail,
        projectId: row.project_id,
        projectName: project?.name ?? null,
        projectKey: project?.key ?? null,
        teamId: row.team_id,
        teamName: team?.name ?? null,
        taskId: row.task_id,
        taskTitle: task?.title ?? null,
      };
    });

  return {
    profile,
    period,
    periodLabel: resolved.label,
    stats: {
      teamsCreated: teamsCreated.length,
      projectsCreated: projectsCreated.length,
      tasksCreated: tasksCountRes.count ?? 0,
      membersAdded,
      statusChanges,
      actionsInPeriod: eventsInPeriod.length,
    },
    teamsCreated,
    projectsCreated,
    tasksCreated,
    recentActivity,
    orgSnapshot,
  };
}

export function adminActivityTypeLabel(eventType: ActivityEventType) {
  return ACTIVITY_EVENT_LABELS[eventType] ?? eventType;
}
