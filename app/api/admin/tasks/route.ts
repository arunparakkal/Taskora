import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateTaskDueDateForProject } from "@/lib/projects/date-utils";
import { createTaskSchema, updateTaskStatusSchema } from "@/lib/validations/schemas";
import { logActivityEvent } from "@/lib/activity/log-event";
import { notifyTaskAssignedTelegram } from "@/lib/telegram/notify-task-assigned";

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
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { title, description, project_id, assignee_id, priority, due_date } =
      parsed.data;

    const { data: project } = await supabase
      .from("projects")
      .select("start_date, due_date, status, team_id, name, key")
      .eq("id", project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.status === "paused") {
      return NextResponse.json(
        { error: "This project is paused. Resume it before adding tasks." },
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

    await logActivityEvent(supabase, {
      eventType: "task_created",
      actorId: user.id,
      teamId: project.team_id,
      projectId: project_id,
      taskId: data.id,
      summary: `Task "${title}" created`,
      detail: project.name ? `In ${project.name}` : undefined,
    });

    if (assignee_id) {
      try {
        await notifyTaskAssignedTelegram({
          taskTitle: title,
          projectName: project.name,
          projectKey: project.key,
          priority,
          dueDate: due_date || null,
          assigneeId: assignee_id,
          assignedById: user.id,
        });
      } catch (err) {
        console.error("[telegram] task assigned notify failed:", err);
      }
    }

    return NextResponse.json({ success: true, task: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, ...rest } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin" && rest.title) {
      const { error } = await supabase
        .from("tasks")
        .update(rest)
        .eq("id", taskId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const parsed = updateTaskStatusSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: task } = await supabase
      .from("tasks")
      .select("assignee_id, status")
      .eq("id", taskId)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (profile?.role === "member") {
      if (task.assignee_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (parsed.data.status === "done") {
        return NextResponse.json(
          {
            error:
              "Only your team lead can mark this task as Done after review.",
          },
          { status: 403 }
        );
      }
      if (parsed.data.status === "rework") {
        return NextResponse.json(
          { error: "Only your team lead can assign Rework." },
          { status: 403 }
        );
      }
      if (task.status === "review" || task.status === "done") {
        return NextResponse.json(
          {
            error:
              task.status === "review"
                ? "This task is awaiting team lead review."
                : "This task is already completed.",
          },
          { status: 403 }
        );
      }
    } else if (task.status === "review") {
      if (parsed.data.status === "rework") {
        return NextResponse.json(
          {
            error: "Use the Rework option to assign rework from review.",
          },
          { status: 403 }
        );
      }
      if (parsed.data.status === "done") {
        return NextResponse.json(
          { error: "Use Approve to mark this task as Done." },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from("tasks")
      .update({ status: parsed.data.status })
      .eq("id", taskId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
