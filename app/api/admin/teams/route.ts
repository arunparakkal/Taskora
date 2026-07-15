import { NextResponse } from "next/server";
import { createTeamSchema } from "@/lib/validations/schemas";
import { logActivityEvent } from "@/lib/activity/log-event";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    const auth = await requireApiRole(["admin"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase, user } = auth;

    const body = await request.json();
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, description, lead_id } = parsed.data;

    if (lead_id) {
      const { data: leadProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", lead_id)
        .single();

      if (!leadProfile || leadProfile.role !== "team_lead") {
        return NextResponse.json(
          { error: "Team lead must be a user with the Team Lead role" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from("teams")
      .insert({
        name,
        description: description || null,
        lead_id: lead_id || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logActivityEvent(supabase, {
      eventType: "team_created",
      actorId: user.id,
      teamId: data.id,
      summary: `Team "${data.name}" created`,
    });

    return NextResponse.json({ success: true, team: data });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/admin/teams", requestId });
  }
}
