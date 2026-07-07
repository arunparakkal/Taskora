import { createAdminClient } from "@/lib/supabase/admin";
import { isTelegramConfigured } from "@/lib/telegram/env";

export interface TelegramRecipient {
  userId: string;
  chatId: number;
  fullName: string;
}

/** Team lead + all team members who linked Telegram and opted in. */
export async function getTelegramRecipientsForUsers(
  userIds: string[]
): Promise<TelegramRecipient[]> {
  if (!isTelegramConfigured() || userIds.length === 0) return [];

  const uniqueIds = [...new Set(userIds)];
  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, full_name, telegram_chat_id, telegram_notify_enabled")
    .in("id", uniqueIds);

  if (error) {
    console.error("[telegram] profiles lookup failed:", error.message);
    return [];
  }

  return (profiles ?? [])
    .filter(
      (p) =>
        p.telegram_notify_enabled !== false &&
        p.telegram_chat_id != null &&
        String(p.telegram_chat_id).trim() !== ""
    )
    .map((p) => ({
      userId: p.id,
      chatId: Number(p.telegram_chat_id),
      fullName: p.full_name,
    }));
}

export async function getTeamTelegramRecipients(
  teamId: string
): Promise<TelegramRecipient[]> {
  const admin = createAdminClient();

  const { data: team } = await admin
    .from("teams")
    .select("lead_id, name")
    .eq("id", teamId)
    .single();

  if (!team) return [];

  const userIds = new Set<string>();
  if (team.lead_id) userIds.add(team.lead_id);

  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId);

  for (const row of members ?? []) {
    userIds.add(row.user_id);
  }

  if (userIds.size === 0) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email, telegram_chat_id, telegram_notify_enabled")
    .in("id", [...userIds]);

  const recipients: TelegramRecipient[] = [];

  for (const profile of profiles ?? []) {
    if (
      profile.telegram_chat_id &&
      profile.telegram_notify_enabled !== false
    ) {
      recipients.push({
        userId: profile.id,
        chatId: profile.telegram_chat_id,
        fullName: profile.full_name || profile.email,
      });
    }
  }

  return recipients;
}

/** Team lead only, when linked Telegram and opted in. */
export async function getTeamLeadTelegramRecipient(
  teamId: string
): Promise<TelegramRecipient[]> {
  const admin = createAdminClient();

  const { data: team } = await admin
    .from("teams")
    .select("lead_id")
    .eq("id", teamId)
    .single();

  if (!team?.lead_id) return [];

  return getTelegramRecipientsForUsers([team.lead_id]);
}
