import { NextResponse } from "next/server";
import { updateProjectStatusSchema } from "@/lib/validations/schemas";
import { logActivityEvent } from "@/lib/activity/log-event";
import { projectStatusDetail } from "@/lib/activity/build-feed";
import { notifyProjectStatusTelegram } from "@/lib/telegram/notify-project-status";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { id: projectId } = await params;
    const auth = await requireApiRole(["admin"]);
    if (isApiAuthError(auth)) return auth.error;
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
      .select("id, name, key, status, team_id")
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

      if (
        parsed.data.status === "paused" ||
        parsed.data.status === "archived"
      ) {
        try {
          await notifyProjectStatusTelegram({
            projectName: project.name,
            projectKey: project.key,
            teamId: project.team_id,
            status: parsed.data.status,
            actorId: user.id,
          });
        } catch (err) {
          console.error("[telegram] project status notify failed:", err);
        }
      }
    }

    return NextResponse.json({ success: true, project: data });
  } catch (error) {
    return handleApiError(error, {
      route: "PATCH /api/admin/projects/[id]",
      requestId,
    });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { id: projectId } = await params;
    const auth = await requireApiRole(["admin"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase } = auth;

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
  } catch (error) {
    return handleApiError(error, {
      route: "DELETE /api/admin/projects/[id]",
      requestId,
    });
  }
}
