import { NextResponse } from "next/server";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";
import { aiAutofillTaskSchema } from "@/lib/validations/schemas";
import { isAiConfigured, parseTaskFromText } from "@/lib/ai/parse-task";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    const auth = await requireApiRole(["team_lead", "admin"]);
    if (isApiAuthError(auth)) return auth.error;
    const { user } = auth;

    if (!isAiConfigured()) {
      return NextResponse.json(
        {
          error:
            "Real AI is not configured. Add GROQ_API_KEY (free) to .env.local, then restart npm run dev. Get a key at https://console.groq.com/keys",
          aiConfigured: false,
          requestId,
        },
        { status: 503 }
      );
    }

    const limited = await checkRateLimit(`ai:autofill:${user.id}`, {
      limit: 30,
      windowSeconds: 60 * 60,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many AI Autofill requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const parsed = aiAutofillTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const result = await parseTaskFromText({
      text: parsed.data.text,
      projectStartDate: parsed.data.project_start_date || null,
      projectDueDate: parsed.data.project_due_date || null,
      requireLlm: true,
      assignees: (parsed.data.assignees ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email || null,
        openTasks: a.open_tasks,
        loadPoints: a.load_points,
        workloadStatus: a.workload_status,
        performanceScore: a.performance_score ?? null,
      })),
    });

    return NextResponse.json({
      title: result.title,
      description: result.description,
      priority: result.priority,
      due_date: result.due_date,
      assignee_id: result.assignee_id,
      assignee_reason: result.assignee_reason,
      source: result.source,
      provider: result.provider ?? null,
      aiConfigured: result.aiConfigured,
      requestId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "AI_NOT_CONFIGURED") {
        return NextResponse.json(
          {
            error:
              "Real AI is not configured. Add GROQ_API_KEY to .env.local and restart the server.",
            aiConfigured: false,
            requestId,
          },
          { status: 503 }
        );
      }
      if (error.message === "AI_PROVIDER_FAILED") {
        return NextResponse.json(
          {
            error:
              "AI provider failed. Check that GROQ_API_KEY is valid, then try again.",
            requestId,
          },
          { status: 502 }
        );
      }
      if (error.message.includes("Type a short")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.startsWith("AI provider")) {
        return NextResponse.json({ error: error.message }, { status: 502 });
      }
    }
    return handleApiError(error, {
      route: "POST /api/ai/autofill-task",
      requestId,
    });
  }
}
