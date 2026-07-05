import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { ROLE_COOKIE_NAME, ROLE_COOKIE_OPTIONS } from "@/lib/auth/role-cookie";

export async function POST() {
  const cookieStore = await cookies();

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ROLE_COOKIE_NAME, "", { ...ROLE_COOKIE_OPTIONS, maxAge: 0 });

  return response;
}
