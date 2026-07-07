import type { ProjectStatus } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActorDisplayName } from "./actor-name";
import { sendTelegramMessageToMany } from "./client";
import { isTelegramConfigured } from "./env";
import {
  formatProjectArchivedMessage,
  formatProjectPausedMessage,
} from "./messages";
import { getTeamTelegramRecipients } from "./recipients";

async function getTeamName(teamId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from("teams").select("name").eq("id", teamId).single();
  return data?.name?.trim() || "Team";
}

export async function notifyProjectStatusTelegram(input: {
  projectName: string;
  projectKey?: string | null;
  teamId: string;
  status: Extract<ProjectStatus, "paused" | "archived">;
  actorId: string;
}): Promise<void> {
  if (!isTelegramConfigured()) return;

  const recipients = await getTeamTelegramRecipients(input.teamId);
  if (recipients.length === 0) return;

  const [actorName, teamName] = await Promise.all([
    getActorDisplayName(input.actorId),
    getTeamName(input.teamId),
  ]);

  const text =
    input.status === "paused"
      ? formatProjectPausedMessage({
          projectName: input.projectName,
          projectKey: input.projectKey,
          teamName,
          pausedByName: actorName,
        })
      : formatProjectArchivedMessage({
          projectName: input.projectName,
          projectKey: input.projectKey,
          teamName,
          archivedByName: actorName,
        });

  await sendTelegramMessageToMany(
    recipients.map((r) => r.chatId),
    text
  );
}
