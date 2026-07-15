import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * Lightweight uptime/monitoring endpoint. No auth required — point an
 * external monitor (UptimeRobot, Vercel Monitoring, etc.) at this URL.
 * Checks that the app can reach Supabase; never throws.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    const dbLatencyMs = Date.now() - startedAt;

    if (error) {
      logger.error("Health check: database query failed", {
        route: "GET /api/health",
        error: error.message,
      });
      return NextResponse.json(
        {
          status: "error",
          timestamp: new Date().toISOString(),
          checks: { database: { ok: false, error: error.message } },
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: { database: { ok: true, latencyMs: dbLatencyMs } },
    });
  } catch (error) {
    logger.exception("Health check: unexpected failure", error, {
      route: "GET /api/health",
    });
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        checks: { database: { ok: false } },
      },
      { status: 503 }
    );
  }
}
