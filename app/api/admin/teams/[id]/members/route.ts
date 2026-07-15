import { NextResponse } from "next/server";
import { logActivityEvent } from "@/lib/activity/log-event";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { id: teamId } = await params;
    const auth = await requireApiRole(["admin"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase, user } = auth;

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
  } catch (error) {
    return handleApiError(error, {
      route: "POST /api/admin/teams/[id]/members",
      requestId,
    });
  }
}
