import { NextResponse } from "next/server";
import {
  consumeTelegramLinkToken,
  linkTelegramChat,
  setTelegramNotifyEnabled,
} from "@/lib/telegram/link-token";
import { sendTelegramMessage } from "@/lib/telegram/client";
import {
  getTelegramWebhookSecret,
  isTelegramConfigured,
} from "@/lib/telegram/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logging/logger";
import { generateRequestId } from "@/lib/api/handle-error";

const WEBHOOK_RATE_LIMIT = { limit: 120, windowSeconds: 60 };

interface TelegramUpdate {
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; username?: string; first_name?: string };
    text?: string;
  };
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    if (!isTelegramConfigured()) {
      return NextResponse.json({ ok: true });
    }

    const secret = getTelegramWebhookSecret();
    if (secret) {
      const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
      if (headerSecret !== secret) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`telegram:${ip}`, WEBHOOK_RATE_LIMIT);
    if (!rateLimit.ok) {
      // Telegram expects a 200 or it will keep retrying — just drop the update.
      return NextResponse.json({ ok: true });
    }

    let update: TelegramUpdate;
    try {
      update = await request.json();
    } catch {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    if (!message?.text || !message.from) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from.username ?? null;

    if (text === "/stop" || text.startsWith("/stop@")) {
      const admin = createAdminClient();
      await admin
        .from("profiles")
        .update({ telegram_notify_enabled: false })
        .eq("telegram_chat_id", chatId);

      await sendTelegramMessage(
        chatId,
        "🔕 Taskora notifications paused. Send /start again after linking from your profile to re-enable."
      );
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      const token = parts[1];

      if (!token) {
        await sendTelegramMessage(
          chatId,
          "👋 Welcome to Taskora alerts.\n\nOpen your Taskora profile and tap <b>Connect Telegram</b> to link this chat."
        );
        return NextResponse.json({ ok: true });
      }

      const userId = await consumeTelegramLinkToken(token);
      if (!userId) {
        await sendTelegramMessage(
          chatId,
          "❌ This link expired or is invalid.\n\nGo back to Taskora → My Profile → Connect Telegram and try again."
        );
        return NextResponse.json({ ok: true });
      }

      try {
        await linkTelegramChat({ userId, chatId, username });
        await setTelegramNotifyEnabled(userId, true);
        await sendTelegramMessage(
          chatId,
          "✅ <b>Taskora linked!</b>\n\nYou will receive alerts here when new projects are created on your team and when tasks are assigned to you."
        );
      } catch {
        await sendTelegramMessage(
          chatId,
          "❌ Could not link your account. Please try again from Taskora."
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Telegram expects a 200 or it will keep retrying the same update forever.
    logger.exception("Unhandled telegram webhook error", error, {
      route: "POST /api/telegram/webhook",
      requestId,
    });
    return NextResponse.json({ ok: true });
  }
}
