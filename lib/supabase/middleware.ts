import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME } from "@/lib/auth/roles";
import {
  isAppRole,
  readRoleFromAuthUser,
  ROLE_COOKIE_NAME,
  ROLE_COOKIE_OPTIONS,
} from "@/lib/auth/role-cookie";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { AppRole } from "@/types/database";

function roleHome(role: AppRole) {
  return ROLE_HOME[role] ?? "/login";
}

function setRoleCookie(response: NextResponse, role: AppRole) {
  response.cookies.set(ROLE_COOKIE_NAME, role, ROLE_COOKIE_OPTIONS);
}

function clearRoleCookie(response: NextResponse) {
  response.cookies.set(ROLE_COOKIE_NAME, "", { ...ROLE_COOKIE_OPTIONS, maxAge: 0 });
}

async function resolveUserRole(
  supabase: ReturnType<typeof createServerClient>,
  user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>,
  request: NextRequest
): Promise<AppRole | undefined> {
  const fromJwt = readRoleFromAuthUser(user);
  if (fromJwt) return fromJwt;

  const cookieRole = request.cookies.get(ROLE_COOKIE_NAME)?.value;
  if (isAppRole(cookieRole)) return cookieRole;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as AppRole | undefined;
  return isAppRole(role) ? role : undefined;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login");
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/team-lead") ||
    pathname.startsWith("/member");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    clearRoleCookie(response);
    return response;
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && isProtectedRoute) {
    const role = await resolveUserRole(supabase, user, request);

    if (role) {
      const cookieRole = request.cookies.get(ROLE_COOKIE_NAME)?.value;
      if (cookieRole !== role) {
        setRoleCookie(supabaseResponse, role);
      }

      const onAdmin = pathname.startsWith("/admin");
      const onTeamLead = pathname.startsWith("/team-lead");
      const onMember = pathname.startsWith("/member");

      if (
        (onAdmin && role !== "admin") ||
        (onTeamLead && role !== "team_lead") ||
        (onMember && role !== "member")
      ) {
        const url = request.nextUrl.clone();
        url.pathname = roleHome(role);
        const response = NextResponse.redirect(url);
        setRoleCookie(response, role);
        return response;
      }
    }
  }

  if (!user) {
    clearRoleCookie(supabaseResponse);
  }

  return supabaseResponse;
}
