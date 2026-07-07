import { escapeTelegramHtml } from "@/lib/telegram/client";
import { formatDate } from "@/lib/utils";
import type { TaskPriority } from "@/types/database";

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function formatProjectCreatedMessage(input: {
  projectName: string;
  projectKey: string;
  teamName: string;
  startDate: string | null;
  dueDate: string | null;
  createdByName: string;
  description?: string | null;
}) {
  const lines = [
    "📁 <b>New project created</b>",
    "",
    `<b>[${escapeTelegramHtml(input.projectKey)}]</b> ${escapeTelegramHtml(input.projectName)}`,
    `Team: ${escapeTelegramHtml(input.teamName)}`,
  ];

  if (input.startDate || input.dueDate) {
    const start = input.startDate ? formatDate(input.startDate) : "—";
    const due = input.dueDate ? formatDate(input.dueDate) : "—";
    lines.push(`Dates: ${start} → ${due}`);
  }

  if (input.description?.trim()) {
    const desc = input.description.trim();
    const short = desc.length > 200 ? `${desc.slice(0, 197)}...` : desc;
    lines.push("", escapeTelegramHtml(short));
  }

  lines.push(
    "",
    `Created by: ${escapeTelegramHtml(input.createdByName)}`,
    "",
    "Open Taskora to view details."
  );

  return lines.join("\n");
}

export function formatTaskAssignedMessage(input: {
  taskTitle: string;
  projectName: string;
  projectKey?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  assignedByName: string;
}): string {
  const projectLabel = input.projectKey
    ? `[${input.projectKey}] ${input.projectName}`
    : input.projectName;

  const lines = [
    "📋 <b>New task assigned to you</b>",
    "",
    `<b>Task:</b> ${escapeTelegramHtml(input.taskTitle)}`,
    `<b>Project:</b> ${escapeTelegramHtml(projectLabel)}`,
    `<b>Priority:</b> ${PRIORITY_LABELS[input.priority]}`,
  ];

  if (input.dueDate) {
    lines.push(`<b>Due:</b> ${escapeTelegramHtml(formatDate(input.dueDate))}`);
  }

  lines.push(`<b>Assigned by:</b> ${escapeTelegramHtml(input.assignedByName)}`);

  return lines.join("\n");
}

export function formatProjectPausedMessage(input: {
  projectName: string;
  projectKey?: string | null;
  teamName: string;
  pausedByName: string;
}): string {
  const projectLabel = input.projectKey
    ? `[${input.projectKey}] ${input.projectName}`
    : input.projectName;

  return [
    "⏸ <b>Project paused</b>",
    "",
    `<b>Project:</b> ${escapeTelegramHtml(projectLabel)}`,
    `<b>Team:</b> ${escapeTelegramHtml(input.teamName)}`,
    `<b>Paused by:</b> ${escapeTelegramHtml(input.pausedByName)}`,
    "",
    "No new tasks can be added until the project is resumed.",
  ].join("\n");
}

export function formatProjectArchivedMessage(input: {
  projectName: string;
  projectKey?: string | null;
  teamName: string;
  archivedByName: string;
}): string {
  const projectLabel = input.projectKey
    ? `[${input.projectKey}] ${input.projectName}`
    : input.projectName;

  return [
    "📦 <b>Project archived</b>",
    "",
    `<b>Project:</b> ${escapeTelegramHtml(projectLabel)}`,
    `<b>Team:</b> ${escapeTelegramHtml(input.teamName)}`,
    `<b>Archived by:</b> ${escapeTelegramHtml(input.archivedByName)}`,
  ].join("\n");
}

export function formatProjectDueReminderMessage(input: {
  projectName: string;
  projectKey?: string | null;
  teamName: string;
  dueDate: string;
}): string {
  const projectLabel = input.projectKey
    ? `[${input.projectKey}] ${input.projectName}`
    : input.projectName;

  return [
    "⏰ <b>Project due date reminder</b>",
    "",
    "Your project will expire soon.",
    "",
    `<b>Project:</b> ${escapeTelegramHtml(projectLabel)}`,
    `<b>Team:</b> ${escapeTelegramHtml(input.teamName)}`,
    `<b>Due date:</b> tomorrow (${escapeTelegramHtml(formatDate(input.dueDate))})`,
    "",
    "Please review progress and complete remaining work.",
  ].join("\n");
}
