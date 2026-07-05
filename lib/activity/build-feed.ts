import { createClient } from "@/lib/supabase/server";
import {
  ACTIVITY_EVENT_LABELS,
  taskActivityToEventType,
  type ActivityFeedItem,
  type ActivityEventType,
} from "@/lib/activity/types";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import { TASK_STATUS_LABELS } from "@/lib/task-status";
import type { Profile, TaskStatus } from "@/types/database";

export interface ActivityFeedScope {
  orgWide?: boolean;
  teamIds?: string[];
  projectIds?: string[];
}

function sortAndLimit(items: ActivityFeedItem[], limit: number) {
  return items
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

async function resolveScope(scope: ActivityFeedScope) {
  const supabase = await createClient();
  let teamIds = scope.teamIds ?? [];
  let projectIds = scope.projectIds ?? [];

  if (scope.orgWide) {
    const { data: teams } = await supabase.from("teams").select("id");
    teamIds = (teams ?? []).map((t) => t.id);
  }

  if (projectIds.length === 0 && teamIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .in("team_id", teamIds);
    projectIds = (projects ?? []).map((p) => p.id);
  }

  return { supabase, teamIds, projectIds };
}

export async function buildActivityFeed(
  scope: ActivityFeedScope,
  limit = 80
): Promise<ActivityFeedItem[]> {
  const { supabase, teamIds, projectIds } = await resolveScope(scope);
  if (!scope.orgWide && teamIds.length === 0 && projectIds.length === 0) {
    return [];
  }

  const items: ActivityFeedItem[] = [];

  const { data: teamRows } =
    teamIds.length > 0
      ? await supabase.from("teams").select("id, name").in("id", teamIds)
      : { data: [] as { id: string; name: string }[] };
  const teamMap = new Map((teamRows ?? []).map((t) => [t.id, t.name]));

  const { data: projectRows } =
    projectIds.length > 0
      ? await supabase
          .from("projects")
          .select("id, name, key, team_id, created_at")
          .in("id", projectIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] as { id: string; name: string; key: string; team_id: string; created_at: string }[] };
  const projectMap = new Map(
    (projectRows ?? []).map((p) => [p.id, p])
  );

  const { data: tasks } =
    projectIds.length > 0
      ? await supabase
          .from("tasks")
          .select("id, title, project_id, assignee_id, created_at, created_by")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(30)
      : { data: [] };

  const taskList = tasks ?? [];
  const taskMap = new Map(taskList.map((t) => [t.id, t]));
  const taskIds = taskList.map((t) => t.id);

  if (taskIds.length > 0) {
    const { data: taskActivity } = await supabase
      .from("task_activity")
      .select(
        "*, actor:profiles!task_activity_actor_id_fkey(full_name, email)"
      )
      .in("task_id", taskIds)
      .order("created_at", { ascending: false })
      .limit(50);

    for (const row of taskActivity ?? []) {
      const task = taskMap.get(row.task_id);
      const project = task ? projectMap.get(task.project_id) : undefined;
      const eventType = taskActivityToEventType(row.action);
      let detail: string | null = null;
      if (row.from_status && row.to_status) {
        detail = `${TASK_STATUS_LABELS[row.from_status as TaskStatus]} → ${TASK_STATUS_LABELS[row.to_status as TaskStatus]}`;
      }

      items.push({
        id: row.id,
        eventType,
        created_at: row.created_at,
        actor: row.actor as Pick<Profile, "full_name" | "email"> | null,
        task_id: row.task_id,
        taskTitle: task?.title ?? "Task",
        projectId: task?.project_id,
        projectName: project?.name,
        projectKey: project?.key,
        teamId: project?.team_id,
        teamName: project?.team_id
          ? teamMap.get(project.team_id)
          : undefined,
        assigneeId: task?.assignee_id ?? null,
        summary: ACTIVITY_EVENT_LABELS[eventType],
        detail,
        comment: row.comment,
        from_status: row.from_status,
        to_status: row.to_status,
      });
    }
  }

  if (scope.orgWide || teamIds.length > 0) {
    let eventsQuery = supabase
      .from("activity_events")
      .select(
        "*, actor:profiles!activity_events_actor_id_fkey(full_name, email)"
      )
      .order("created_at", { ascending: false })
      .limit(40);

    if (!scope.orgWide && teamIds.length > 0) {
      eventsQuery = eventsQuery.in("team_id", teamIds);
    }

    const { data: orgEvents } = await eventsQuery;

    for (const row of orgEvents ?? []) {
      const project = row.project_id
        ? projectMap.get(row.project_id)
        : undefined;
      const eventType = row.event_type as ActivityEventType;

      items.push({
        id: row.id,
        eventType,
        created_at: row.created_at,
        actor: row.actor as Pick<Profile, "full_name" | "email"> | null,
        task_id: row.task_id,
        taskTitle: row.task_id ? taskMap.get(row.task_id)?.title : undefined,
        projectId: row.project_id ?? undefined,
        projectName: project?.name,
        projectKey: project?.key,
        teamId: row.team_id ?? project?.team_id,
        teamName: row.team_id
          ? teamMap.get(row.team_id)
          : project?.team_id
            ? teamMap.get(project.team_id)
            : undefined,
        summary: row.summary,
        detail: row.detail,
      });
    }
  }

  const creatorIds = [
    ...new Set(
      taskList.map((t) => t.created_by).filter(Boolean) as string[]
    ),
  ];
  const creatorMap = new Map<string, Pick<Profile, "full_name" | "email">>();
  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", creatorIds);
    for (const c of creators ?? []) {
      creatorMap.set(c.id, c);
    }
  }

  for (const task of taskList.slice(0, 20)) {
    const project = projectMap.get(task.project_id);
    const creator = task.created_by
      ? creatorMap.get(task.created_by)
      : null;
    items.push({
      id: `task-created-${task.id}`,
      eventType: "task_created",
      created_at: task.created_at,
      actor: creator ?? null,
      task_id: task.id,
      taskTitle: task.title,
      projectId: task.project_id,
      projectName: project?.name,
      projectKey: project?.key,
      teamId: project?.team_id,
      teamName: project?.team_id
        ? teamMap.get(project.team_id)
        : undefined,
      assigneeId: task.assignee_id,
      summary: ACTIVITY_EVENT_LABELS.task_created,
      detail: project?.name ? `In ${project.name}` : null,
    });
  }

  if (teamIds.length > 0) {
    const { data: members } = await supabase
      .from("team_members")
      .select("team_id, user_id, joined_at")
      .in("team_id", teamIds)
      .order("joined_at", { ascending: false })
      .limit(25);

    const memberUserIds = [...new Set((members ?? []).map((m) => m.user_id))];
    const { data: memberProfiles } =
      memberUserIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", memberUserIds)
        : { data: [] };

    const profileMap = new Map(
      (memberProfiles ?? []).map((p) => [p.id, p])
    );

    for (const m of members ?? []) {
      const profile = profileMap.get(m.user_id);
      items.push({
        id: `member-${m.team_id}-${m.user_id}`,
        eventType: "member_added",
        created_at: m.joined_at,
        actor: null,
        teamId: m.team_id,
        teamName: teamMap.get(m.team_id),
        summary: ACTIVITY_EVENT_LABELS.member_added,
        detail: profile
          ? `${profile.full_name || profile.email} joined ${teamMap.get(m.team_id) ?? "team"}`
          : undefined,
      });
    }
  }

  for (const project of projectRows ?? []) {
    items.push({
      id: `project-created-${project.id}`,
      eventType: "project_created",
      created_at: project.created_at,
      projectId: project.id,
      projectName: project.name,
      projectKey: project.key,
      teamId: project.team_id,
      teamName: teamMap.get(project.team_id),
      summary: ACTIVITY_EVENT_LABELS.project_created,
      detail: project.name,
    });
  }

  if (scope.orgWide || teamIds.length > 0) {
    let teamsQuery = supabase
      .from("teams")
      .select("id, name, created_at, created_by")
      .order("created_at", { ascending: false })
      .limit(15);

    if (!scope.orgWide && teamIds.length > 0) {
      teamsQuery = teamsQuery.in("id", teamIds);
    }

    const { data: teamsCreated } = await teamsQuery;
    for (const team of teamsCreated ?? []) {
      items.push({
        id: `team-created-${team.id}`,
        eventType: "team_created",
        created_at: team.created_at,
        teamId: team.id,
        teamName: team.name,
        summary: ACTIVITY_EVENT_LABELS.team_created,
        detail: team.name,
      });
    }
  }

  const deduped = new Map<string, ActivityFeedItem>();
  for (const item of items) {
    if (!deduped.has(item.id)) deduped.set(item.id, item);
  }

  return sortAndLimit([...deduped.values()], limit);
}

export function projectStatusDetail(
  fromStatus: string,
  toStatus: string
) {
  const from =
    PROJECT_STATUS_LABELS[fromStatus as keyof typeof PROJECT_STATUS_LABELS] ??
    fromStatus;
  const to =
    PROJECT_STATUS_LABELS[toStatus as keyof typeof PROJECT_STATUS_LABELS] ??
    toStatus;
  return `${from} → ${to}`;
}
