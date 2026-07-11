import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/habits/date-utils";
import { usesProgressCounter } from "@/lib/habits/constants";

async function requireMember() {
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

  if (!profile || profile.role !== "member") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user } = auth as { supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } };
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
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
