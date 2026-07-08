import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  FolderKanban,
  History,
  Lightbulb,
  RefreshCw,
  RotateCcw,
  UsersRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import {
  ACTIVITY_ACTION_LABELS,
  getDueDateInfo,
  getLatestReworkFromActivity,
  getTaskAgeDays,
  MEMBER_STATUS_GUIDE,
} from "@/lib/tasks/task-detail";
import type { RejectionFeedback } from "@/lib/tasks/task-detail";
import { TASK_STATUS_LABELS } from "@/lib/task-status";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TaskActivityWithActor, TaskDetail } from "@/lib/data/tasks";

function Property({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-3", className)}>
      <dt className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
        {children}
      </dd>
    </div>
  );
}

function PersonProperty({
  label,
  name,
  email,
  badge,
}: {
  label: string;
  name: string;
  email?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {name}
            </span>
            {badge}
          </div>
          {email && (
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">
              {email}
            </p>
          )}
        </div>
        <EntityAvatar name={name} size="sm" />
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        {Icon && (
          <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        )}
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </Card>
  );
}

function ActivityItem({
  item,
  isLast,
}: {
  item: TaskActivityWithActor;
  isLast: boolean;
}) {
  const actorName = item.actor?.full_name || item.actor?.email || "Someone";
  const actionLabel = ACTIVITY_ACTION_LABELS[item.action] ?? item.action;
  const isRejection = item.action === "changes_requested";

  let detail: string | null = null;
  if (item.from_status && item.to_status) {
    detail = `${TASK_STATUS_LABELS[item.from_status]} → ${TASK_STATUS_LABELS[item.to_status]}`;
  }

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      <div className="relative flex flex-col items-center pt-0.5">
        <div
          className={cn(
            "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isRejection
              ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          )}
        >
          {isRejection ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <History className="h-3.5 w-3.5" />
          )}
        </div>
        {!isLast && (
          <div className="absolute top-8 h-[calc(100%-8px)] w-px bg-slate-200 dark:bg-slate-700" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {actionLabel}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {actorName} · {formatDateTime(item.created_at)}
        </p>
        {detail && (
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
            {detail}
          </p>
        )}
        {item.comment && (
          <div className="mt-2 rounded-lg border border-amber-200/60 bg-amber-50/80 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="mb-1 text-xs font-medium text-amber-800 dark:text-amber-300">
              Feedback
            </p>
            <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-100">
              {item.comment}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

function RejectionBanner({ feedback }: { feedback: RejectionFeedback }) {
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3.5 dark:border-orange-500/25 dark:bg-orange-500/10">
      <div className="flex items-start gap-3">
        <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-orange-950 dark:text-orange-100">
              Rework required
            </p>
            <StatusBadge status="rework" />
          </div>
          <p className="mt-1 text-sm text-orange-800 dark:text-orange-200/90">
            {feedback.actorName} · {formatDateTime(feedback.createdAt)}
          </p>
          {feedback.comment ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {feedback.comment}
            </p>
          ) : (
            <p className="mt-2 text-sm text-orange-800/80 dark:text-orange-200/70">
              No comment provided. Contact your team lead for details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskDetailView({
  task,
  activity,
  backHref = "/member/tasks",
  variant = "member",
  statusDisabled = false,
}: {
  task: TaskDetail;
  activity: TaskActivityWithActor[];
  backHref?: string;
  variant?: "member" | "team_lead";
  statusDisabled?: boolean;
}) {
  const dueInfo = getDueDateInfo(task.due_date, task.status);
  const ageDays = getTaskAgeDays(task.created_at);
  const reworkFeedback =
    task.status === "rework" ? getLatestReworkFromActivity(activity) : null;
  const guide = MEMBER_STATUS_GUIDE[task.status];
  const showReworkHint = task.status === "rework";
  const isTeamLead = variant === "team_lead";
  const project = task.project;
  const teamLead = project?.team?.lead ?? null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {reworkFeedback && <RejectionBanner feedback={reworkFeedback} />}

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            {project && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                  {project.key}
                </span>
                <span className="mx-2 text-slate-300 dark:text-slate-600">
                  ·
                </span>
                {project.name}
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[1.65rem] sm:leading-tight">
              {task.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={task.status}
                audience={isTeamLead ? undefined : "member"}
              />
              <PriorityBadge priority={task.priority} />
              {dueInfo.status === "overdue" && (
                <Badge variant="urgent" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-52">
            <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              Status
            </p>
            <TaskStatusSelect
              taskId={task.id}
              currentStatus={task.status}
              mode={isTeamLead ? "full" : "member"}
              disabled={statusDisabled}
            />
          </div>
        </div>

        {/* Key facts strip */}
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800 sm:grid-cols-4 sm:divide-y-0">
          <FactCell
            icon={Calendar}
            label="Due date"
            value={task.due_date ? formatDate(task.due_date) : "Not set"}
            hint={dueInfo.label}
            highlight={dueInfo.status === "overdue"}
          />
          <FactCell
            icon={Clock}
            label="Age"
            value={ageDays === 0 ? "Today" : `${ageDays} days`}
            hint={ageDays === 0 ? "Created today" : "Since created"}
          />
          <FactCell
            icon={CheckCircle2}
            label="Completed"
            value={task.completed_at ? formatDate(task.completed_at) : "—"}
            hint={task.completed_at ? "Marked done" : "Not yet"}
          />
          <FactCell
            icon={RefreshCw}
            label="Reviews"
            value={String(task.review_cycles)}
            hint={task.reopened_count > 0 ? `${task.reopened_count} reopened` : "Review cycles"}
          />
        </div>
      </Card>

      {/* Content */}
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <Panel title="Description">
            <p className="py-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {task.description?.trim() ||
                "No description has been added for this task."}
            </p>
          </Panel>

          {!isTeamLead && (
            <div
              className={cn(
                "flex gap-3 rounded-xl border px-4 py-3.5",
                showReworkHint
                  ? "border-orange-200 bg-orange-50/50 dark:border-orange-500/20 dark:bg-orange-500/10"
                  : "border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40"
              )}
            >
              <Lightbulb
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  showReworkHint
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-slate-500 dark:text-slate-400"
                )}
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {guide.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {guide.hint}
                </p>
              </div>
            </div>
          )}

          <Panel title="Activity" icon={History}>
            {activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No activity yet.
              </p>
            ) : (
              <ol className="divide-y divide-slate-100 py-2 dark:divide-slate-800">
                {activity.map((item, i) => (
                  <div key={item.id} className="py-4 first:pt-2 last:pb-2">
                    <ActivityItem
                      item={item}
                      isLast={i === activity.length - 1}
                    />
                  </div>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          <Panel title="Details" icon={FolderKanban}>
            <dl className="divide-y divide-slate-100 dark:divide-slate-800">
              {project && (
                <>
                  <Property label="Project">{project.name}</Property>
                  <Property label="Key">
                    <span className="font-mono text-xs">{project.key}</span>
                  </Property>
                  <Property label="Project status">
                    <Badge variant={project.status}>{project.status}</Badge>
                  </Property>
                </>
              )}
              <Property label="Team">{project?.team?.name ?? "—"}</Property>
              <Property label="Created">
                {formatDateTime(task.created_at)}
              </Property>
              <Property label="Due">
                {task.due_date ? formatDate(task.due_date) : "—"}
              </Property>
              {task.completed_at && (
                <Property label="Completed">
                  {formatDateTime(task.completed_at)}
                </Property>
              )}
            </dl>
          </Panel>

          <Panel title="People" icon={UsersRound}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {teamLead && (
                <PersonProperty
                  label="Lead"
                  name={teamLead.full_name || teamLead.email}
                  email={teamLead.email}
                  badge={
                    <Crown className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                  }
                />
              )}
              {task.assignee ? (
                <PersonProperty
                  label="Assignee"
                  name={task.assignee.full_name || task.assignee.email}
                  email={task.assignee.email}
                  badge={
                    !isTeamLead ? (
                      <Badge variant="member" className="px-1.5 py-0 text-[10px]">
                        You
                      </Badge>
                    ) : undefined
                  }
                />
              ) : (
                <Property label="Assignee">Unassigned</Property>
              )}
              {task.creator && (
                <PersonProperty
                  label="Created by"
                  name={task.creator.full_name || task.creator.email}
                  email={task.creator.email}
                />
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function FactCell({
  icon: Icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 px-5 py-3.5">
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          highlight
            ? "bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p
          className={cn(
            "truncate text-sm font-semibold",
            highlight
              ? "text-red-700 dark:text-red-300"
              : "text-slate-900 dark:text-slate-100"
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
