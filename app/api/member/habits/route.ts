import { NextResponse } from "next/server";
import { resolveHabitDays } from "@/lib/data/habits";
import { createHabitSchema } from "@/lib/validations/schemas";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    const auth = await requireApiRole(["member"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase, user } = auth;

    const body = await request.json();
    const parsed = createHabitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      icon,
      color,
      frequency,
      days_of_week,
      target_value,
      target_unit,
    } = parsed.data;

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        icon,
        color,
        frequency,
        days_of_week: resolveHabitDays(frequency, days_of_week),
        target_value: target_value ?? null,
        target_unit: target_unit || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, habit: data });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/member/habits", requestId });
  }
}
