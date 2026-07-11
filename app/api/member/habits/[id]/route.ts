import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveHabitDays } from "@/lib/data/habits";
import { updateHabitSchema } from "@/lib/validations/schemas";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user } = auth as { supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } };
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
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user } = auth as { supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } };
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
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
