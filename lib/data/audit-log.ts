import { createClient } from "@/lib/supabase/server";
import type { AdminAuditLogWithActor } from "@/types/database";

export const AUDIT_LOG_PAGE_SIZE = 25;

export interface AuditLogPage {
  items: AdminAuditLogWithActor[];
  total: number;
  pageSize: number;
}

/** Admin-only — RLS also enforces this at the DB level (see migration 019). */
export async function getAdminAuditLog(page = 1): Promise<AuditLogPage> {
  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * AUDIT_LOG_PAGE_SIZE;
  const to = from + AUDIT_LOG_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("admin_audit_log")
    .select(
      "*, actor:profiles!admin_audit_log_actor_id_fkey(id, full_name, email)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    items: (data ?? []) as AdminAuditLogWithActor[],
    total: count ?? 0,
    pageSize: AUDIT_LOG_PAGE_SIZE,
  };
}
