import { NextResponse } from "next/server";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { logAdminAction } from "@/lib/audit/log-admin-action";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { id: teamId } = await params;
    const auth = await requireApiRole(["admin"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase, user } = auth;

    const { data: team, error: fetchError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("id", teamId)
      .single();

    if (fetchError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    await logAdminAction(supabase, {
      eventType: "team.deleted",
      actorId: user.id,
      targetType: "team",
      targetId: team.id,
      summary: `Team "${team.name}" deleted`,
    });

    return NextResponse.json({ success: true, team: { id: team.id, name: team.name } });
  } catch (error) {
    return handleApiError(error, {
      route: "DELETE /api/admin/teams/[id]",
      requestId,
    });
  }
}
