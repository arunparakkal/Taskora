import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTeamSchema } from "@/lib/validations/schemas";
import { logActivityEvent } from "@/lib/activity/log-event";

export async function POST(request: Request) {
  try {
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
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
