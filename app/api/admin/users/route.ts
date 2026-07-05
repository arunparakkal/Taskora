import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateUsersList } from "@/lib/data/queries";
import { createUserSchema } from "@/lib/validations/schemas";

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
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, full_name, role } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = full_name.trim();
    const adminClient = createAdminClient();

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: normalizedName, role },
        app_metadata: { role },
      });

    if (createError) {
      console.error("Create user failed:", {
        message: createError.message,
        code: createError.code,
        status: createError.status,
        normalizedEmail,
      });
      const keyHint =
        createError.message.toLowerCase().includes("bearer token") ||
        createError.message.toLowerCase().includes("invalid jwt")
          ? " Supabase admin user creation requires the LEGACY service API key (service_role JWT), not sb_secret. In Supabase, copy 'service API key (legacy)' and set SUPABASE_SERVICE_ROLE_KEY."
          : "";
      return NextResponse.json(
        { error: `${createError.message}${keyHint}` },
        { status: 400 }
      );
    }

    if (newUser.user) {
      const { error: profileError } = await adminClient.from("profiles").upsert(
        {
          id: newUser.user.id,
          email: normalizedEmail,
          full_name: normalizedName,
          role,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Profile upsert failed:", {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
          userId: newUser.user.id,
          normalizedEmail,
        });
        return NextResponse.json(
          { error: `User created but profile sync failed: ${profileError.message}` },
          { status: 500 }
        );
      }
    }

    revalidateUsersList();
    return NextResponse.json({ success: true, userId: newUser.user?.id });
  } catch (error) {
    console.error("Create user route crashed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
