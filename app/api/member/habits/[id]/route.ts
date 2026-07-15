import { NextResponse } from "next/server";
import { resolveHabitDays } from "@/lib/data/habits";
import { updateHabitSchema } from "@/lib/validations/schemas";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const auth = await requireApiRole(["member"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase, user } = auth;
    const { id } = await params;

    const body = await request.json();
    const parsed = updateHabitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.frequency || parsed.data.days_of_week) {
      updates.days_of_week = resolveHabitDays(
        parsed.data.frequency ?? "daily",
        parsed.data.days_of_week
      );
    }

    const { data, error } = await supabase
      .from("habits")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, habit: data });
  } catch (error) {
    return handleApiError(error, {
      route: "PATCH /api/member/habits/[id]",
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
    const auth = await requireApiRole(["member"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase, user } = auth;
    const { id } = await params;

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, {
      route: "DELETE /api/member/habits/[id]",
      requestId,
    });
  }
}
