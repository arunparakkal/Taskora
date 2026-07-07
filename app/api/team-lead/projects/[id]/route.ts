import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userLeadsProjectTeam } from "@/lib/data/team-lead";
import {
  teamLeadArchiveProjectSchema,
  updateProjectSchema,
} from "@/lib/validations/schemas";
import { logActivityEvent } from "@/lib/activity/log-event";
import { projectStatusDetail } from "@/lib/activity/build-feed";
import { notifyProjectStatusTelegram } from "@/lib/telegram/notify-project-status";

async function requireProjectLead(projectId: string) {
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

  const canManage =
    profile?.role === "admin" ||
    (await userLeadsProjectTeam(user.id, projectId));

  if (!canManage) {
    return {
      error: NextResponse.json(
        { error: "You can only manage projects on teams you lead" },
        { status: 403 }
      ),
    };
  }

  return { supabase, user };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const auth = await requireProjectLead(projectId);
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user } = auth;

    const body = await request.json();

    if (body.action === "archive") {
      const parsed = teamLeadArchiveProjectSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid action" },
          { status: 400 }
        );
      }

      const { data: existingProject } = await supabase
        .from("projects")
        .select("name, key, status, team_id")
        .eq("id", projectId)
        .single();

      const { data, error } = await supabase
        .from("projects")
        .update({ status: "archived" })
        .eq("id", projectId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (existingProject) {
        await logActivityEvent(supabase, {
          eventType: "project_status_changed",
          actorId: user.id,
          teamId: existingProject.team_id,
          projectId,
          summary: `Project "${existingProject.name}" archived`,
          detail: projectStatusDetail(existingProject.status, "archived"),
        });

        void notifyProjectStatusTelegram({
          projectName: existingProject.name,
          projectKey: existingProject.key,
          teamId: existingProject.team_id,
          status: "archived",
          actorId: user.id,
        }).catch((err) => {
          console.error("[telegram] project archived notify failed:", err);
        });
      }

      return NextResponse.json({ success: true, project: data });
    }

    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("projects")
      .select("status")
      .eq("id", projectId)
      .single();

    if (existing?.status === "archived") {
      return NextResponse.json(
        { error: "This project is archived. Contact an admin to unarchive it." },
        { status: 403 }
      );
    }

    const patch: Record<string, string | null> = {};
    if (parsed.data.name) patch.name = parsed.data.name;
    if (parsed.data.description !== undefined) {
      patch.description = parsed.data.description || null;
    }
    if (parsed.data.start_date) patch.start_date = parsed.data.start_date;
    if (parsed.data.due_date) {
      patch.due_date = parsed.data.due_date;
      patch.telegram_due_reminder_sent_at = null;
    }

    const { data, error } = await supabase
      .from("projects")
      .update(patch)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, project: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
