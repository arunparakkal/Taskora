import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  FolderKanban,
  History,
  Lightbulb,
  RefreshCw,
  MessageSquareQuote,
  RotateCcw,
  User,
  UsersRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const dueAccent: Record<
  ReturnType<typeof getDueDateInfo>["status"],
  "red" | "orange" | "amber" | "green" | "teal" | "blue"
> = {
  none: "blue",
  overdue: "red",
  today: "orange",
  soon: "amber",
  on_track: "green",
  completed: "teal",
};

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 last:pb-0 first:pt-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  );
}

function PersonRow({
  name,
  email,
  badge,
}: {
  name: string;
  email?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <EntityAvatar name={name} size="sm" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-900">{name}</p>
          {badge}
        </div>
        {email && (
          <p className="truncate text-xs text-slate-500">{email}</p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ item }: { item: TaskActivityWithActor }) {
  const actorName =
    item.actor?.full_name || item.actor?.email || "Someone";
  const actionLabel = ACTIVITY_ACTION_LABELS[item.action] ?? item.action;
  const isRejection = item.action === "changes_requested";

  let detail: string | null = null;
  if (item.action === "status_changed" && item.from_status && item.to_status) {
    detail = `${TASK_STATUS_LABELS[item.from_status]} → ${TASK_STATUS_LABELS[item.to_status]}`;
  } else if (item.from_status && item.to_status) {
    detail = `${TASK_STATUS_LABELS[item.from_status]} → ${TASK_STATUS_LABELS[item.to_status]}`;
  }

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isRejection ? "bg-amber-100" : "bg-slate-100"
          )}
        >
          {isRejection ? (
            <RotateCcw className="h-4 w-4 text-amber-600" />
          ) : (
            <History className="h-4 w-4 text-slate-500" />
          )}
        </div>
        <div className="absolute top-8 h-full w-px bg-slate-200 last:hidden" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-medium text-slate-900">{actionLabel}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {actorName} · {formatDateTime(item.created_at)}
        </p>
        {detail && (
          <p className="mt-1.5 text-sm text-slate-600">{detail}</p>
        )}
        {item.comment && (
          <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              <MessageSquareQuote className="h-3 w-3" />
              Reviewer feedback
            </p>
            <p className="text-sm leading-relaxed text-amber-900">
              {item.comment}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

function RejectionFeedbackBanner({
  feedback,
}: {
  feedback: RejectionFeedback;
}) {
  const hasComment = !!feedback.comment;

  return (
    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/80 p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
          <RotateCcw className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-orange-950">
              Rework assigned
            </p>
            <StatusBadge status="rework" />
          </div>
          <p className="mt-1 text-xs text-orange-800/80">
            {feedback.actorName} assigned rework on{" "}
            {formatDateTime(feedback.createdAt)}. Move to In Progress when you
            start fixing, then mark Done when finished.
          </p>
          {hasComment ? (
            <div className="mt-3 rounded-lg border border-orange-200/80 bg-white/80 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-700">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                Reason from reviewer
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {feedback.comment}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-orange-800">
              No written comment was included. Check with your team lead if you
              need more detail.
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
}: {
  task: TaskDetail;
  activity: TaskActivityWithActor[];
  backHref?: string;
}) {
  const dueInfo = getDueDateInfo(task.due_date, task.status);
  const ageDays = getTaskAgeDays(task.created_at);
  const reworkFeedback =
    task.status === "rework" ? getLatestReworkFromActivity(activity) : null;
  const guide = MEMBER_STATUS_GUIDE[task.status];
  const showReworkHint = task.status === "rework";
  const project = task.project;
  const teamLead = project?.team?.lead ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={backHref}
          className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          ← Back to tasks
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {reworkFeedback && (
            <RejectionFeedbackBanner feedback={reworkFeedback} />
          )}

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <EntityAvatar name={task.title} size="lg" />
                  <div className="min-w-0">
                    {project?.key && (
                      <span className="mb-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                        [{project.key}]
                      </span>
                    )}
                    <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
                      {task.title}
                    </CardTitle>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} audience="member" />
                      <PriorityBadge priority={task.priority} />
                      {dueInfo.status === "overdue" && (
                        <Badge variant="urgent" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-auto sm:min-w-[11rem]">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Update status
                  </p>
                  <TaskStatusSelect
                    taskId={task.id}
                    currentStatus={task.status}
                    mode="member"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Description
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {task.description?.trim() ||
                    "No description provided for this task."}
                </p>
              </div>

              <div
                className={cn(
                  "rounded-xl border p-4",
                  showReworkHint
                    ? "border-orange-100 bg-orange-50/50"
                    : "border-teal-100 bg-teal-50/60"
                )}
              >
                <div className="flex gap-3">
                  <Lightbulb
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0",
                      showReworkHint ? "text-orange-600" : "text-teal-600"
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        showReworkHint ? "text-orange-950" : "text-teal-900"
                      )}
                    >
                      {guide.title}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        showReworkHint ? "text-orange-900" : "text-teal-800"
                      )}
                    >
                      {guide.hint}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <History className="h-4 w-4 text-slate-500" />
                Activity timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No activity recorded yet. Status changes and reviews will
                  appear here.
                </p>
              ) : (
                <ol className="mt-1">{activity.map((item) => (
                  <ActivityItem key={item.id} item={item} />
                ))}</ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <QuickStat
              icon={Calendar}
              label="Due date"
              value={task.due_date ? formatDate(task.due_date) : "Not set"}
              subtext={dueInfo.label}
              accent={dueAccent[dueInfo.status]}
            />
            <QuickStat
              icon={Clock}
              label="Age"
              value={ageDays === 0 ? "Today" : `${ageDays}d`}
              subtext={
                ageDays === 0
                  ? "Created today"
                  : `Open for ${ageDays} day${ageDays === 1 ? "" : "s"}`
              }
              accent="purple"
            />
            {task.completed_at && (
              <QuickStat
                icon={CheckCircle2}
                label="Completed"
                value={formatDate(task.completed_at)}
                subtext="Marked as done"
                accent="teal"
              />
            )}
            {(task.review_cycles > 0 || task.reopened_count > 0) && (
              <>
                {task.review_cycles > 0 && (
                  <QuickStat
                    icon={RefreshCw}
                    label="Review cycles"
                    value={String(task.review_cycles)}
                    subtext="Times sent for review"
                    accent="amber"
                  />
                )}
                {task.reopened_count > 0 && (
                  <QuickStat
                    icon={RotateCcw}
                    label="Reopened"
                    value={String(task.reopened_count)}
                    subtext="Sent back after completion"
                    accent="orange"
                  />
                )}
              </>
            )}
          </div>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <FolderKanban className="h-4 w-4 text-slate-500" />
                Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {project ? (
                <>
                  <MetaRow label="Name">
                    <span className="font-medium text-slate-900">
                      {project.name}
                    </span>
                  </MetaRow>
                  <MetaRow label="Key">
                    <span className="font-mono text-xs">{project.key}</span>
                  </MetaRow>
                  <MetaRow label="Status">
                    <Badge variant={project.status}>{project.status}</Badge>
                  </MetaRow>
                  {project.description && (
                    <MetaRow label="About">
                      <p className="leading-relaxed text-slate-600">
                        {project.description}
                      </p>
                    </MetaRow>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">Project unavailable</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <UsersRound className="h-4 w-4 text-slate-500" />
                Team & people
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <MetaRow label="Team">
                {project?.team?.name ?? "—"}
              </MetaRow>
              {teamLead && (
                <MetaRow label="Team lead">
                  <PersonRow
                    name={teamLead.full_name || teamLead.email}
                    email={teamLead.email}
                    badge={
                      <Badge variant="team_lead" className="gap-1">
                        <Crown className="h-3 w-3" />
                        Team Lead
                      </Badge>
                    }
                  />
                </MetaRow>
              )}
              <MetaRow label="Assigned to">
                {task.assignee ? (
                  <PersonRow
                    name={task.assignee.full_name || task.assignee.email}
                    email={task.assignee.email}
                    badge={
                      <Badge variant="member" className="gap-1">
                        <User className="h-3 w-3" />
                        You
                      </Badge>
                    }
                  />
                ) : (
                  "Unassigned"
                )}
              </MetaRow>
              {task.creator && (
                <MetaRow label="Created by">
                  <PersonRow
                    name={task.creator.full_name || task.creator.email}
                    email={task.creator.email}
                  />
                </MetaRow>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <MetaRow label="Created">{formatDateTime(task.created_at)}</MetaRow>
              <MetaRow label="Due">{formatDate(task.due_date)}</MetaRow>
              <MetaRow label="Completed">
                {formatDateTime(task.completed_at)}
              </MetaRow>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
  accent: keyof typeof accentBox;
}) {
  const styles = accentBox[accent];
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            styles.box
          )}
        >
          <Icon className={cn("h-4 w-4", styles.icon)} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
          {subtext && (
            <p className="mt-0.5 text-xs text-slate-400">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const accentBox = {
  red: { box: "bg-red-50", icon: "text-red-600" },
  orange: { box: "bg-orange-50", icon: "text-orange-600" },
  amber: { box: "bg-amber-50", icon: "text-amber-600" },
  green: { box: "bg-emerald-50", icon: "text-emerald-600" },
  teal: { box: "bg-teal-50", icon: "text-teal-600" },
  blue: { box: "bg-blue-50", icon: "text-blue-600" },
  purple: { box: "bg-violet-50", icon: "text-violet-600" },
};
