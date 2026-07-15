import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import {
  ROLE_COOKIE_NAME,
  ROLE_COOKIE_OPTIONS,
} from "@/lib/auth/role-cookie";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

const LOGIN_RATE_LIMIT = { limit: 5, windowSeconds: 15 * 60 };

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(
      `login:${ip}:${normalizedEmail}`,
      LOGIN_RATE_LIMIT
    );

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const response = NextResponse.json({
      userId: data.user.id,
      email: data.user.email,
    });

    if (profile?.role === "admin" || profile?.role === "team_lead" || profile?.role === "member") {
      response.cookies.set(ROLE_COOKIE_NAME, profile.role, ROLE_COOKIE_OPTIONS);
    }

    return response;
  } catch (error) {
    return handleApiError(error, { route: "POST /api/auth/login", requestId });
  }
}
