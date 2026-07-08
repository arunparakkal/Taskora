import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUnreadNotificationCount,
  type NotificationWithDetails,
} from "@/lib/data/notifications";
import { enrichNotificationActors } from "@/lib/notifications/enrich-actors";

const NOTIFICATION_SELECT = `
  *,
  actor:profiles!notifications_actor_id_fkey(id, full_name, email, role),
  task:tasks(id, title, status, priority, due_date, project:projects(id, key, name))
`;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit =
      limitParam !== null
        ? Math.min(50, Math.max(0, Number.parseInt(limitParam, 10) || 0))
        : 50;

    const unreadCount = await getUnreadNotificationCount();

    if (limit === 0) {
      return NextResponse.json({ notifications: [], unreadCount });
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(NOTIFICATION_SELECT)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const notifications = await enrichNotificationActors(
      (data ?? []) as unknown as NotificationWithDetails[]
    );

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body?.all) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (!body?.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", body.id)
      .eq("recipient_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
