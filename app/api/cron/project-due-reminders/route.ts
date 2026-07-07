import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron/verify-request";
import { runProjectDueReminders } from "@/lib/telegram/run-project-due-reminders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runProjectDueReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[cron] project due reminders failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
