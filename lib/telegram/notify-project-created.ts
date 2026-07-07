import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendTelegramMessageToMany,
} from "@/lib/telegram/client";
import { formatProjectCreatedMessage } from "@/lib/telegram/messages";
import { getTeamTelegramRecipients } from "@/lib/telegram/recipients";
import { isTelegramConfigured } from "@/lib/telegram/env";

export async function notifyProjectCreatedTelegram(input: {
  projectId: string;
  projectName: string;
  projectKey: string;
  teamId: string;
  startDate: string | null;
  dueDate: string | null;
  description: string | null;
  createdById: string;
}) {
  if (!isTelegramConfigured()) return { sent: 0, skipped: true };

  const admin = createAdminClient();

  const [{ data: team }, { data: creator }] = await Promise.all([
    admin.from("teams").select("name").eq("id", input.teamId).single(),
    admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", input.createdById)
      .single(),
  ]);

  const recipients = await getTeamTelegramRecipients(input.teamId);
  if (recipients.length === 0) return { sent: 0, skipped: false };

  const text = formatProjectCreatedMessage({
    projectName: input.projectName,
    projectKey: input.projectKey,
    teamName: team?.name ?? "Team",
    startDate: input.startDate,
    dueDate: input.dueDate,
    createdByName: creator?.full_name || creator?.email || "Admin",
    description: input.description,
  });

  const chatIds = [...new Set(recipients.map((r) => r.chatId))];
  const { sent, failed } = await sendTelegramMessageToMany(chatIds, text);

  if (failed > 0) {
    console.warn(
      `[telegram] project ${input.projectId}: sent ${sent}, failed ${failed}`
    );
  }

  return { sent, skipped: false };
}
