import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  TaskActivity,
  TaskWithDetails,
  TeamWithDetails,
} from "@/types/database";

export interface TaskActivityWithActor extends TaskActivity {
  actor?: Pick<Profile, "full_name" | "email"> | null;
}

export interface TaskDetail extends TaskWithDetails {
  creator?: Profile | null;
  project?: TaskWithDetails["project"] & {
    team?: TeamWithDetails | null;
  } | null;
}

const TASK_DETAIL_SELECT = `
  *,
  project:projects(
    *,
    team:teams(*, lead:profiles!teams_lead_id_fkey(id, full_name, email, role))
  ),
  assignee:profiles!tasks_assignee_id_fkey(*),
  creator:profiles!tasks_created_by_fkey(id, full_name, email, role)
`;

export async function getTaskById(taskId: string): Promise<TaskDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_DETAIL_SELECT)
    .eq("id", taskId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const project = data.project as TaskDetail["project"];
  if (project?.team) {
    const team = project.team as TeamWithDetails & { lead?: Profile | null };
    project.team = {
      ...team,
      lead: (team.lead as Profile | null) ?? null,
    };
  }

  return {
    ...data,
    project,
    creator: (data.creator as Profile | null) ?? null,
  } as TaskDetail;
}

export async function getTaskActivity(
  taskId: string
): Promise<TaskActivityWithActor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_activity")
    .select(
      "*, actor:profiles!task_activity_actor_id_fkey(full_name, email)"
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as TaskActivityWithActor[];
}
