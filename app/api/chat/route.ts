import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { isAiConfigured } from "@/lib/ai/env";
import { completeChat } from "@/lib/ai/llm-client";
import { buildUserContextCard } from "@/lib/ai/chat-context";
import {
  buildGuestSystemPrompt,
  buildUserSystemPrompt,
} from "@/lib/ai/chatbot-knowledge";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";
import { chatRequestSchema } from "@/lib/validations/schemas";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    if (!isAiConfigured()) {
      return NextResponse.json(
        {
          error:
            "Assistant is not configured. Add GROQ_API_KEY (or another AI key) to .env.local and restart the server.",
          aiConfigured: false,
          requestId,
        },
        { status: 503 }
      );
    }

    const profile = await getCurrentProfile();
    const ip = getClientIp(request);
    const rateKey = profile
      ? `chat:user:${profile.id}`
      : `chat:guest:${ip}`;

    const limited = await checkRateLimit(rateKey, {
      limit: profile ? 40 : 20,
      windowSeconds: 60 * 60,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many chat messages. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const last = parsed.data.messages[parsed.data.messages.length - 1];
    if (!last || last.role !== "user") {
      return NextResponse.json(
        { error: "The last message must be from the user." },
        { status: 400 }
      );
    }

    let system: string;
    if (profile) {
      const contextCard = await buildUserContextCard(profile);
      system = buildUserSystemPrompt(profile, contextCard);
    } else {
      system = buildGuestSystemPrompt();
    }

    const { content, provider } = await completeChat({
      system,
      messages: parsed.data.messages,
    });

    return NextResponse.json({
      reply: content.trim(),
      provider,
      mode: profile ? "assistant" : "guest",
      requestId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "AI_NOT_CONFIGURED") {
        return NextResponse.json(
          {
            error:
              "Assistant is not configured. Add GROQ_API_KEY to .env.local and restart.",
            aiConfigured: false,
            requestId,
          },
          { status: 503 }
        );
      }
      if (
        error.message.startsWith("AI provider") ||
        error.message.startsWith("Gemini error")
      ) {
        return NextResponse.json(
          { error: "The AI provider failed. Check your API key and try again.", requestId },
          { status: 502 }
        );
      }
    }
    return handleApiError(error, { route: "POST /api/chat", requestId });
  }
}
