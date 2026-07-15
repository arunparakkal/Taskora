import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";

/** One ID per request — include it in the JSON response so users can quote it when reporting issues. */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Centralized `catch` handler for API routes: logs the error with full
 * context (route, request ID, stack) and returns a generic 500 response
 * that never leaks internals to the client.
 */
export function handleApiError(
  error: unknown,
  context: { route: string; requestId: string; [key: string]: unknown }
): NextResponse {
  logger.exception("Unhandled API error", error, context);

  return NextResponse.json(
    { error: "Internal server error", requestId: context.requestId },
    { status: 500, headers: { "X-Request-Id": context.requestId } }
  );
}
