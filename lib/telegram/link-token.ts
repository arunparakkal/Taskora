import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export async function createTelegramLinkToken(userId: string) {
  const admin = createAdminClient();
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await admin.from("telegram_link_tokens").delete().eq("user_id", userId);

  const { error } = await admin.from("telegram_link_tokens").insert({
    token,
    user_id: userId,
    expires_at: expiresAt,
  });

  if (error) throw error;

  return { token, expiresAt };
}

export async function resolveTelegramLinkToken(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("telegram_link_tokens")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;

  if (new Date(data.expires_at) < new Date()) {
    await admin.from("telegram_link_tokens").delete().eq("token", token);
    return null;
  }

  return data.user_id as string;
}

export async function consumeTelegramLinkToken(token: string) {
  const userId = await resolveTelegramLinkToken(token);
  if (!userId) return null;

  const admin = createAdminClient();
  await admin.from("telegram_link_tokens").delete().eq("token", token);
  return userId;
}

export async function linkTelegramChat(input: {
  userId: string;
  chatId: number;
  username?: string | null;
}) {
  const admin = createAdminClient();

  await admin
    .from("profiles")
    .update({
      telegram_chat_id: null,
      telegram_username: null,
      telegram_linked_at: null,
    })
    .eq("telegram_chat_id", input.chatId)
    .neq("id", input.userId);

  const { error } = await admin
    .from("profiles")
    .update({
      telegram_chat_id: input.chatId,
      telegram_username: input.username ?? null,
      telegram_linked_at: new Date().toISOString(),
      telegram_notify_enabled: true,
    })
    .eq("id", input.userId);

  if (error) throw error;
}

export async function unlinkTelegramChat(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      telegram_chat_id: null,
      telegram_username: null,
      telegram_linked_at: null,
      telegram_notify_enabled: true,
    })
    .eq("id", userId);

  if (error) throw error;
}

export async function setTelegramNotifyEnabled(userId: string, enabled: boolean) {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ telegram_notify_enabled: enabled })
    .eq("id", userId);
}
