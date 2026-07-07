import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProjectSchema } from "@/lib/validations/schemas";
import { generateProjectKey } from "@/lib/utils";
import { logActivityEvent } from "@/lib/activity/log-event";
import { notifyProjectCreatedTelegram } from "@/lib/telegram/notify-project-created";

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
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
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
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logActivityEvent(supabase, {
      eventType: "project_created",
      actorId: user.id,
      teamId: data.team_id,
      projectId: data.id,
      summary: `Project "${data.name}" created`,
      detail: data.key,
    });

    try {
      await notifyProjectCreatedTelegram({
        projectId: data.id,
        projectName: data.name,
        projectKey: data.key,
        teamId: data.team_id,
        startDate: data.start_date,
        dueDate: data.due_date,
        description: data.description,
        createdById: user.id,
      });
    } catch (err) {
      console.error("[telegram] project created notify failed:", err);
    }

    return NextResponse.json({ success: true, project: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
