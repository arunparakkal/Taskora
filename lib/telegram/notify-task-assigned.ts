import type { TaskPriority } from "@/types/database";
import { getActorDisplayName } from "./actor-name";
import { sendTelegramMessageToMany } from "./client";
import { isTelegramConfigured } from "./env";
import { formatTaskAssignedMessage } from "./messages";
import { getTelegramRecipientsForUsers } from "./recipients";

export async function notifyTaskAssignedTelegram(input: {
  taskTitle: string;
  projectName: string;
  projectKey?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  assigneeId: string;
  assignedById: string;
}): Promise<void> {
  if (!isTelegramConfigured()) return;

  const recipients = await getTelegramRecipientsForUsers([input.assigneeId]);
  if (recipients.length === 0) return;

  const assignedByName = await getActorDisplayName(input.assignedById);
  const text = formatTaskAssignedMessage({
    taskTitle: input.taskTitle,
    projectName: input.projectName,
    projectKey: input.projectKey,
    priority: input.priority,
    dueDate: input.dueDate,
    assignedByName,
  });

  await sendTelegramMessageToMany(
    recipients.map((r) => r.chatId),
    text
  );
}
