import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ApiAuthUser = {
  id: string;
  email?: string;
};

export type ApiAuthSuccess = {
  supabase: SupabaseServerClient;
  user: ApiAuthUser;
  role: AppRole;
};

export type ApiAuthFailure = {
  error: NextResponse;
};

export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

export function isApiAuthError(
  result: ApiAuthResult
): result is ApiAuthFailure {
  return "error" in result;
}

/**
 * Shared API-route auth check: verifies the caller is signed in and has one
 * of the allowed roles. Returns a discriminated union — call sites should
 * check `isApiAuthError(auth)` (or `"error" in auth`) before using the rest.
 *
 * Usage:
 *   const auth = await requireApiRole(["admin"]);
 *   if (isApiAuthError(auth)) return auth.error;
 *   const { supabase, user, role } = auth;
 */
export async function requireApiRole(
  roles: AppRole[]
): Promise<ApiAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !roles.includes(profile.role as AppRole)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    supabase,
    user: { id: user.id, email: user.email },
    role: profile.role as AppRole,
  };
}
