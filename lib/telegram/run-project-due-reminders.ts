import { shouldSendProjectDueReminder } from "@/lib/projects/due-reminder";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { isTelegramConfigured } from "@/lib/telegram/env";
import { formatProjectDueReminderMessage } from "@/lib/telegram/messages";
import { getTeamLeadTelegramRecipient } from "@/lib/telegram/recipients";

async function getTeamName(teamId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from("teams").select("name").eq("id", teamId).single();
  return data?.name?.trim() || "Team";
}

export async function runProjectDueReminders(now: Date = new Date()) {
  if (!isTelegramConfigured()) {
    return { checked: 0, sent: 0, skipped: true };
  }

  const admin = createAdminClient();

  const { data: projects, error } = await admin
    .from("projects")
    .select(
      "id, name, key, due_date, team_id, status, telegram_due_reminder_sent_at"
    )
    .eq("status", "active")
    .not("due_date", "is", null)
    .is("telegram_due_reminder_sent_at", null);

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;
  let eligible = 0;

  for (const project of projects ?? []) {
    if (!project.due_date) continue;
    if (!shouldSendProjectDueReminder(project.due_date, now)) continue;

    eligible += 1;

    const recipients = await getTeamLeadTelegramRecipient(project.team_id);
    const lead = recipients[0];
    if (!lead) continue;

    const teamName = await getTeamName(project.team_id);
    const text = formatProjectDueReminderMessage({
      projectName: project.name,
      projectKey: project.key,
      teamName,
      dueDate: project.due_date,
    });

    const result = await sendTelegramMessage(lead.chatId, text);
    if (!result.ok) {
      console.warn(
        `[telegram] due reminder for project ${project.id} failed:`,
        result.error
      );
      continue;
    }

    const { error: updateError } = await admin
      .from("projects")
      .update({ telegram_due_reminder_sent_at: now.toISOString() })
      .eq("id", project.id);

    if (updateError) {
      console.warn(
        `[telegram] due reminder sent but flag not saved for ${project.id}:`,
        updateError.message
      );
      continue;
    }

    sent += 1;
  }

  return {
    checked: projects?.length ?? 0,
    eligible,
    sent,
    skipped: false,
  };
}
