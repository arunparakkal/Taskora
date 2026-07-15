import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewTaskSchema } from "@/lib/validations/schemas";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

/**
 * Approve or reject a task awaiting review.
 * Delegates to the review_task() Postgres function so the status update,
 * activity-log comment, and assignee notification happen atomically.
 */
export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { taskId, decision, comment } = parsed.data;

    const { data, error } = await supabase.rpc("review_task", {
      p_task_id: taskId,
      p_decision: decision,
      p_comment: comment?.trim() || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, task: data });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/tasks/review", requestId });
  }
}
