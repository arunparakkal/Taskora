import Link from "next/link";
import { History, MessageSquareQuote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACTIVITY_EVENT_LABELS,
  type ActivityFeedItem,
} from "@/lib/activity/types";
import { formatDateTime } from "@/lib/utils";

function ProjectActivityRow({
  item,
  taskHrefPrefix,
}: {
  item: ActivityFeedItem;
  taskHrefPrefix: string;
}) {
  const actorName =
    item.actor?.full_name || item.actor?.email || "Someone";
  const label = ACTIVITY_EVENT_LABELS[item.eventType] ?? item.summary;

  return (
    <li className="flex gap-3 border-b border-slate-100 py-3 last:border-0 last:pb-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
        <History className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
          {label}
        </span>
        <p className="mt-1 text-sm text-slate-900">
          <span className="font-medium">{actorName}</span>{" "}
          <span className="text-slate-600">{item.summary.toLowerCase()}</span>
        </p>
        {item.task_id && item.taskTitle && (
          <Link
            href={`${taskHrefPrefix}/${item.task_id}`}
            className="mt-0.5 block truncate text-sm font-medium text-blue-600 hover:underline"
          >
            {item.taskTitle}
          </Link>
        )}
        {item.detail && (
          <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
        )}
        {item.comment && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-800">
            <MessageSquareQuote className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">{item.comment}</span>
          </p>
        )}
        <p className="mt-1 text-[11px] text-slate-400">
          {formatDateTime(item.created_at)}
        </p>
      </div>
    </li>
  );
}

export function ProjectRecentActivity({
  activity,
  taskHrefPrefix = "/team-lead/tasks",
}: {
  activity: ActivityFeedItem[];
  taskHrefPrefix?: string;
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <History className="h-4 w-4 text-slate-500" />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500">
            Task updates and reviews will appear here as your team works on this
            project.
          </p>
        ) : (
          <ul>
            {activity.map((item) => (
              <ProjectActivityRow
                key={item.id}
                item={item}
                taskHrefPrefix={taskHrefPrefix}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
