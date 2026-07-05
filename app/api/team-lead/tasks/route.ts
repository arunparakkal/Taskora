import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeamMember, userLeadsProjectTeam } from "@/lib/data/team-lead";
import {
  isProjectOpenForNewTasks,
  validateTaskDueDateForProject,
} from "@/lib/projects/date-utils";
import { createTaskSchema } from "@/lib/validations/schemas";

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

    if (profile?.role !== "team_lead" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { title, description, project_id, assignee_id, priority, due_date } =
      parsed.data;

    const canLead = await userLeadsProjectTeam(user.id, project_id);
    if (!canLead && profile?.role !== "admin") {
      return NextResponse.json(
        { error: "You can only add tasks to projects on teams you lead" },
        { status: 403 }
      );
    }

    const { data: project } = await supabase
      .from("projects")
      .select("team_id, start_date, due_date")
      .eq("id", project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (
      profile?.role === "team_lead" &&
      !isProjectOpenForNewTasks(project.start_date, project.due_date)
    ) {
      return NextResponse.json(
        {
          error:
            "Tasks can only be added during the project period (between start and due date).",
        },
        { status: 403 }
      );
    }

    const dateError = validateTaskDueDateForProject(
      due_date,
      project.start_date,
      project.due_date
    );
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    if (assignee_id) {
      const member = await isTeamMember(project.team_id, assignee_id);
      if (!member) {
        return NextResponse.json(
          { error: "Assignee must be a member of this project's team" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title,
        description: description || null,
        project_id,
        assignee_id: assignee_id || null,
        priority,
        due_date: due_date || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, task: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
