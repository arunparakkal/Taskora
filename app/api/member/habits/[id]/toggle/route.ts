import { NextResponse } from "next/server";
import { toDateKey } from "@/lib/habits/date-utils";
import { usesProgressCounter } from "@/lib/habits/constants";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const auth = await requireApiRole(["member"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase, user } = auth;
    const { id: habitId } = await params;

    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select("id, target_value, target_unit")
      .eq("id", habitId)
      .eq("user_id", user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const today = toDateKey(new Date());
    const body = await request.json().catch(() => ({}));
    const increment = Boolean(body?.increment);
    const isProgressHabit = usesProgressCounter(habit);

    const { data: existing } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("habit_id", habitId)
      .eq("completed_on", today)
      .maybeSingle();

    // Countable habits only (e.g. glasses). Time habits always one-click complete.
    if (isProgressHabit && increment) {
      const nextValue = (existing?.current_value ?? 0) + 1;
      if (nextValue > (habit.target_value ?? 1)) {
        return NextResponse.json(
          { error: "Target already reached for today" },
          { status: 400 }
        );
      }

      if (existing) {
        const { data, error } = await supabase
          .from("habit_completions")
          .update({ current_value: nextValue })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          completed: nextValue >= (habit.target_value ?? 1),
          completion: data,
        });
      }

      const { data, error } = await supabase
        .from("habit_completions")
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_on: today,
          current_value: nextValue,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        completed: nextValue >= (habit.target_value ?? 1),
        completion: data,
      });
    }

    if (existing) {
      const { error } = await supabase
        .from("habit_completions")
        .delete()
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, completed: false });
    }

    const { data, error } = await supabase
      .from("habit_completions")
      .insert({
        habit_id: habitId,
        user_id: user.id,
        completed_on: today,
        current_value: 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, completed: true, completion: data });
  } catch (error) {
    return handleApiError(error, {
      route: "POST /api/member/habits/[id]/toggle",
      requestId,
    });
  }
}
