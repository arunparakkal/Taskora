import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveHabitDays } from "@/lib/data/habits";
import { createHabitSchema } from "@/lib/validations/schemas";

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

export async function POST(request: Request) {
  try {
    const auth = await requireMember();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user } = auth as { supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } };

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
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
