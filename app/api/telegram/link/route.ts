import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createTelegramLinkToken,
  unlinkTelegramChat,
  setTelegramNotifyEnabled,
} from "@/lib/telegram/link-token";
import {
  getTelegramBotLink,
  getTelegramBotUsername,
  isTelegramConfigured,
} from "@/lib/telegram/env";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

export async function GET() {
  const requestId = generateRequestId();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "telegram_chat_id, telegram_username, telegram_linked_at, telegram_notify_enabled"
      )
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      botConfigured: isTelegramConfigured(),
      botUsername: getTelegramBotUsername() || null,
      linked: Boolean(profile?.telegram_chat_id),
      username: profile?.telegram_username ?? null,
      linkedAt: profile?.telegram_linked_at ?? null,
      notifyEnabled: profile?.telegram_notify_enabled !== false,
    });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/telegram/link", requestId });
  }
}

export async function POST() {
  const requestId = generateRequestId();
  try {
    if (!isTelegramConfigured()) {
      return NextResponse.json(
        { error: "Telegram bot is not configured on the server" },
        { status: 503 }
      );
    }

    const botUsername = getTelegramBotUsername();
    if (!botUsername) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not set" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, expiresAt } = await createTelegramLinkToken(user.id);
    const linkUrl = getTelegramBotLink(token);

    if (!linkUrl) {
      return NextResponse.json(
        { error: "Could not build Telegram link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ linkUrl, expiresAt });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/telegram/link", requestId });
  }
}

export async function DELETE() {
  const requestId = generateRequestId();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await unlinkTelegramChat(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { route: "DELETE /api/telegram/link", requestId });
  }
}

export async function PATCH(request: Request) {
  const requestId = generateRequestId();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body?.notifyEnabled !== "boolean") {
      return NextResponse.json({ error: "notifyEnabled is required" }, { status: 400 });
    }

    await setTelegramNotifyEnabled(user.id, body.notifyEnabled);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { route: "PATCH /api/telegram/link", requestId });
  }
}
