import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitOptions {
  /** Max allowed hits within the window. */
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface IncrementRateLimitRow {
  current_count: number;
  window_start: string;
}

/**
 * Storage-backed rate limiter (Postgres `rate_limits` table + atomic RPC —
 * see supabase/migrations/018_rate_limits.sql). Safe across serverless
 * instances since state lives in the DB, not process memory.
 *
 * Fails open: if the DB check itself errors, the request is allowed through
 * rather than locking users out because of an infra hiccup.
 */
export async function checkRateLimit(
  key: string,
  { limit, windowSeconds }: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .rpc("increment_rate_limit", {
        p_key: key,
        p_window_seconds: windowSeconds,
      })
      .single<IncrementRateLimitRow>();

    if (error || !data) {
      console.error("[rate-limit] check failed, allowing request:", error);
      return { ok: true, remaining: limit, retryAfterSeconds: 0 };
    }

    const windowStartMs = new Date(data.window_start).getTime();
    const elapsedSeconds = (Date.now() - windowStartMs) / 1000;
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil(windowSeconds - elapsedSeconds)
    );

    return {
      ok: data.current_count <= limit,
      remaining: Math.max(0, limit - data.current_count),
      retryAfterSeconds,
    };
  } catch (error) {
    console.error("[rate-limit] unexpected error, allowing request:", error);
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Best-effort client IP from headers set by Vercel's edge network. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}
