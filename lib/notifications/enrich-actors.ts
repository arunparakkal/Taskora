import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationWithDetails } from "@/lib/data/notifications";

function actorIsMissing(notification: NotificationWithDetails) {
  return (
    !!notification.actor_id &&
    !notification.actor?.full_name &&
    !notification.actor?.email
  );
}

/** Backfill actor profiles when RLS blocks the nested join (e.g. members reading team-lead actors). */
export async function enrichNotificationActors(
  notifications: NotificationWithDetails[]
): Promise<NotificationWithDetails[]> {
  const missingIds = [
    ...new Set(
      notifications.filter(actorIsMissing).map((n) => n.actor_id as string)
    ),
  ];

  if (missingIds.length === 0) return notifications;

  try {
    const admin = createAdminClient();
    const { data: actors } = await admin
      .from("profiles")
      .select("id, full_name, email, role")
      .in("id", missingIds);

    const byId = new Map((actors ?? []).map((actor) => [actor.id, actor]));

    return notifications.map((notification) => {
      if (!actorIsMissing(notification)) return notification;
      const actor = byId.get(notification.actor_id as string);
      return actor ? { ...notification, actor } : notification;
    });
  } catch {
    return notifications;
  }
}
