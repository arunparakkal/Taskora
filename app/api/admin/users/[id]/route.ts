import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateUsersList } from "@/lib/data/queries";
import {
  updateUserRoleSchema,
  updateUserSchema,
} from "@/lib/validations/schemas";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user };
}

async function ensureNotLastAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetId: string,
  nextRole: string
) {
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetId)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetProfile.role === "admin" && nextRole !== "admin") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last admin account" },
        { status: 400 }
      );
    }
  }

  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase } = auth;

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetProfile.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts cannot be edited" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Quick role-only update (from Change Role dropdown)
    if (body && typeof body.role === "string" && Object.keys(body).length === 1) {
      const parsed = updateUserRoleSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      const lastAdminError = await ensureNotLastAdmin(
        supabase,
        id,
        parsed.data.role
      );
      if (lastAdminError) return lastAdminError;

      const { error } = await supabase
        .from("profiles")
        .update({ role: parsed.data.role })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const adminClient = createAdminClient();
      await adminClient.auth.admin.updateUserById(id, {
        app_metadata: { role: parsed.data.role },
        user_metadata: { role: parsed.data.role },
      });

      revalidateUsersList();
      return NextResponse.json({ success: true });
    }

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { full_name, email, role, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = full_name.trim();

    const lastAdminError = await ensureNotLastAdmin(supabase, id, role);
    if (lastAdminError) return lastAdminError;

    const adminClient = createAdminClient();
    const authUpdate: {
      email?: string;
      password?: string;
      user_metadata: { full_name: string; role: string };
      app_metadata: { role: string };
    } = {
      email: normalizedEmail,
      user_metadata: { full_name: normalizedName, role },
      app_metadata: { role },
    };

    if (password?.trim()) {
      authUpdate.password = password;
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(
      id,
      authUpdate
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: normalizedName,
        email: normalizedEmail,
        role,
      })
      .eq("id", id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    revalidateUsersList();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user } = auth;

    if (user.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetProfile.role === "admin") {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin account" },
          { status: 400 }
        );
      }
    }

    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    revalidateUsersList();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
