import { createClient } from "@/lib/supabase/server";
import { enrichNotificationActors } from "@/lib/notifications/enrich-actors";
import type { AppNotification, Profile } from "@/types/database";

export interface NotificationWithDetails extends AppNotification {
  actor?: Pick<Profile, "id" | "full_name" | "email" | "role"> | null;
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    project?: { id: string; key: string; name: string } | null;
  } | null;
}

const NOTIFICATION_SELECT = `
  *,
  actor:profiles!notifications_actor_id_fkey(id, full_name, email, role),
  task:tasks(id, title, status, priority, due_date, project:projects(id, key, name))
`;

export async function getMyNotifications(
  limit = 50
): Promise<NotificationWithDetails[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return enrichNotificationActors(
    (data ?? []) as unknown as NotificationWithDetails[]
  );
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}
