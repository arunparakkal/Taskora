import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityEventType } from "@/lib/activity/types";

export async function logActivityEvent(
  supabase: SupabaseClient,
  event: {
    eventType: ActivityEventType;
    actorId: string;
    summary: string;
    detail?: string;
    teamId?: string;
    projectId?: string;
    taskId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("activity_events").insert({
      event_type: event.eventType,
      actor_id: event.actorId,
      team_id: event.teamId ?? null,
      project_id: event.projectId ?? null,
      task_id: event.taskId ?? null,
      summary: event.summary,
      detail: event.detail ?? null,
      metadata: event.metadata ?? {},
    });
  } catch {
    // Table may not exist until migration 010 is applied.
  }
}
