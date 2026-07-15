import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminAuditEventType } from "@/types/database";

export interface LogAdminActionInput {
  eventType: AdminAuditEventType;
  actorId: string;
  targetType: "user" | "team";
  targetId?: string;
  summary: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records a security-relevant admin action (user CRUD, role changes, team
 * deletion) to `admin_audit_log`. Unlike `logActivityEvent`, failures are
 * always logged rather than swallowed — this is the audit trail, so a
 * silent failure here would be worse than a noisy one.
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  event: LogAdminActionInput
): Promise<void> {
  const { error } = await supabase.from("admin_audit_log").insert({
    event_type: event.eventType,
    actor_id: event.actorId,
    target_type: event.targetType,
    target_id: event.targetId ?? null,
    summary: event.summary,
    detail: event.detail ?? null,
    metadata: event.metadata ?? {},
  });

  if (error) {
    console.error("[audit] failed to record admin action:", {
      eventType: event.eventType,
      targetType: event.targetType,
      targetId: event.targetId,
      message: error.message,
    });
  }
}
