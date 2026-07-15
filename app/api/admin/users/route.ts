import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateUsersList } from "@/lib/data/queries";
import { createUserSchema } from "@/lib/validations/schemas";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { logAdminAction } from "@/lib/audit/log-admin-action";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";
import { uploadUserAvatar } from "@/lib/avatars/upload";

async function parseCreateUserRequest(request: Request): Promise<{
  fields: Record<string, unknown>;
  avatarFile: File | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const avatar = form.get("avatar");
    return {
      fields: {
        full_name: String(form.get("full_name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        role: String(form.get("role") ?? ""),
      },
      avatarFile: avatar instanceof File && avatar.size > 0 ? avatar : null,
    };
  }

  const body = (await request.json()) as Record<string, unknown>;
  return { fields: body, avatarFile: null };
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    const auth = await requireApiRole(["admin"]);
    if (isApiAuthError(auth)) return auth.error;
    const { supabase, user } = auth;

    const { fields, avatarFile } = await parseCreateUserRequest(request);
    const parsed = createUserSchema.safeParse(fields);

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

    if (!newUser.user) {
      return NextResponse.json(
        { error: "User creation returned no user" },
        { status: 500 }
      );
    }

    let avatarUrl: string | null = null;
    if (avatarFile) {
      const uploaded = await uploadUserAvatar(
        adminClient,
        newUser.user.id,
        avatarFile
      );
      if ("error" in uploaded) {
        return NextResponse.json(
          {
            error: `User created but photo upload failed: ${uploaded.error}`,
          },
          { status: 500 }
        );
      }
      avatarUrl = uploaded.url;
    }

    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: newUser.user.id,
        email: normalizedEmail,
        full_name: normalizedName,
        role,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
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

    revalidateUsersList();

    await logAdminAction(supabase, {
      eventType: "user.created",
      actorId: user.id,
      targetType: "user",
      targetId: newUser.user.id,
      summary: `User "${normalizedName}" created`,
      detail: `${normalizedEmail} · ${role}`,
    });

    return NextResponse.json({ success: true, userId: newUser.user.id });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/admin/users", requestId });
  }
}
