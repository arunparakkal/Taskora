import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron/verify-request";
import { runProjectDueReminders } from "@/lib/telegram/run-project-due-reminders";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = generateRequestId();
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runProjectDueReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error, {
      route: "GET /api/cron/project-due-reminders",
      requestId,
    });
  }
}
