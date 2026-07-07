import { getTelegramBotToken, isTelegramConfigured } from "@/lib/telegram/env";

export function escapeTelegramHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(
  chatId: number,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isTelegramConfigured()) {
    return { ok: false, error: "Telegram bot is not configured" };
  }

  const token = getTelegramBotToken();
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const json = (await res.json()) as {
    ok: boolean;
    description?: string;
  };

  if (!res.ok || !json.ok) {
    return { ok: false, error: json.description ?? "Failed to send message" };
  }

  return { ok: true };
}

export async function sendTelegramMessageToMany(
  chatIds: number[],
  text: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const chatId of chatIds) {
    const result = await sendTelegramMessage(chatId, text);
    if (result.ok) sent++;
    else failed++;
  }

  return { sent, failed };
}
