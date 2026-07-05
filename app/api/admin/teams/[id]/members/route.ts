import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivityEvent } from "@/lib/activity/log-event";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userIds } = await request.json();

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: "userIds must be an array" }, { status: 400 });
    }

    let memberIds = userIds as string[];
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, role")
        .in("id", memberIds);

      memberIds = (profiles ?? [])
        .filter((p) => p.role !== "admin")
        .map((p) => p.id);
    }

    await supabase.from("team_members").delete().eq("team_id", teamId);

    if (memberIds.length > 0) {
      const rows = memberIds.map((userId: string) => ({
        team_id: teamId,
        user_id: userId,
      }));

      const { error } = await supabase.from("team_members").insert(rows);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      for (const memberId of memberIds) {
        const { data: memberProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", memberId)
          .single();

        await logActivityEvent(supabase, {
          eventType: "member_added",
          actorId: user.id,
          teamId,
          summary: "Member added to team",
          detail: memberProfile
            ? `${memberProfile.full_name || memberProfile.email} joined the team`
            : undefined,
          metadata: { user_id: memberId },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
