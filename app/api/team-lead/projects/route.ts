import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProjectSchema } from "@/lib/validations/schemas";
import { generateProjectKey } from "@/lib/utils";
import { logActivityEvent } from "@/lib/activity/log-event";

async function requireTeamLead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "team_lead" && profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user, role: profile?.role };
}

export async function POST(request: Request) {
  try {
    const auth = await requireTeamLead();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user, role } = auth;

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", parsed.data.team_id)
      .eq("lead_id", user.id)
      .maybeSingle();

    if (!team && role !== "admin") {
      return NextResponse.json(
        { error: "You can only create projects for teams you lead" },
        { status: 403 }
      );
    }

    const { name, description, team_id, start_date, due_date } = parsed.data;
    const key = parsed.data.key || generateProjectKey(name);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        key: key.toUpperCase(),
        description: description || null,
        team_id,
        start_date,
        due_date,
        created_by: user.id,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logActivityEvent(supabase, {
      eventType: "project_created",
      actorId: user.id,
      teamId: team_id,
      projectId: data.id,
      summary: `Project "${name}" created`,
      detail: key.toUpperCase(),
    });

    return NextResponse.json({ success: true, project: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
