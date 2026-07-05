import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProjectStatusSchema } from "@/lib/validations/schemas";
import { logActivityEvent } from "@/lib/activity/log-event";
import { projectStatusDetail } from "@/lib/activity/build-feed";

async function requireAdmin() {
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

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const auth = await requireAdmin();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user } = auth;

    const body = await request.json();
    const parsed = updateProjectStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, name, status, team_id")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("projects")
      .update({ status: parsed.data.status })
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (project.status !== parsed.data.status) {
      await logActivityEvent(supabase, {
        eventType: "project_status_changed",
        actorId: user.id,
        teamId: project.team_id,
        projectId: project.id,
        summary: `Project "${project.name}" status changed`,
        detail: projectStatusDetail(project.status, parsed.data.status),
        metadata: { from: project.status, to: parsed.data.status },
      });
    }

    return NextResponse.json({ success: true, project: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const auth = await requireAdmin();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user } = auth;

    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      project: { id: project.id, name: project.name },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
