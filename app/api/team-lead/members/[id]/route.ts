import { NextResponse } from "next/server";
import { teamLeadCanViewMember } from "@/lib/data/member-profile";
import { z } from "zod";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

const updateMemberMetaSchema = z.object({
  skills: z.array(z.string().max(80)).max(20).optional(),
  leave_status: z.enum(["active", "on_leave", "partial"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { id: memberId } = await params;
    const auth = await requireApiRole(["team_lead", "admin"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase, user } = auth;

    const canView = await teamLeadCanViewMember(user.id, memberId);
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateMemberMetaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.skills !== undefined) {
      updates.skills = parsed.data.skills;
    }
    if (parsed.data.leave_status !== undefined) {
      updates.leave_status = parsed.data.leave_status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", memberId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    return handleApiError(error, {
      route: "PATCH /api/team-lead/members/[id]",
      requestId,
    });
  }
}
