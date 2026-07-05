import type { AppRole, TaskStatus } from "@/types/database";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { TASK_STATUS_LABELS, getMemberStatusLabel } from "@/lib/task-status";
import { Badge } from "@/components/ui/badge";

const roleVariant: Record<AppRole, "admin" | "team_lead" | "member"> = {
  admin: "admin",
  team_lead: "team_lead",
  member: "member",
};

export function RoleBadge({ role }: { role: AppRole }) {
  return <Badge variant={roleVariant[role]}>{ROLE_LABELS[role]}</Badge>;
}

export function StatusBadge({
  status,
  audience,
}: {
  status: string;
  audience?: "member";
}) {
  const variants = ["todo", "in_progress", "review", "rework", "done"] as const;
  const variant = variants.includes(status as TaskStatus)
    ? (status as TaskStatus)
    : "todo";
  const label =
    audience === "member"
      ? getMemberStatusLabel(variant)
      : TASK_STATUS_LABELS[variant];
  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variants = ["low", "medium", "high", "urgent"] as const;
  const variant = variants.includes(priority as typeof variants[number])
    ? (priority as typeof variants[number])
    : "medium";
  return <Badge variant={variant} className="capitalize">{priority}</Badge>;
}
