import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { LinkPagination } from "@/components/shared/link-pagination";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getAdminAuditLog } from "@/lib/data/audit-log";
import { formatDateTime } from "@/lib/utils";
import type { AdminAuditEventType } from "@/types/database";

const EVENT_LABELS: Record<AdminAuditEventType, string> = {
  "user.created": "User created",
  "user.updated": "User updated",
  "user.role_changed": "Role changed",
  "user.deleted": "User deleted",
  "team.deleted": "Team deleted",
};

const EVENT_STYLES: Record<AdminAuditEventType, string> = {
  "user.created":
    "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  "user.updated":
    "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
  "user.role_changed":
    "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300",
  "user.deleted":
    "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  "team.deleted":
    "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { items, total, pageSize } = await getAdminAuditLog(page);

  return (
    <PageShell
      title="Audit Log"
      description="A record of sensitive admin actions: user accounts, role changes, and team deletions."
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No audit events yet"
          description="Sensitive admin actions like creating users, changing roles, or deleting teams will appear here."
        />
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/40">
                  <TableHead className="px-4">Action</TableHead>
                  <TableHead className="px-4">Actor</TableHead>
                  <TableHead className="px-4">Details</TableHead>
                  <TableHead className="px-4 text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${EVENT_STYLES[entry.event_type]}`}
                      >
                        {EVENT_LABELS[entry.event_type] ?? entry.event_type}
                      </span>
                    </TableCell>
                    <TableCell className="px-4">
                      {entry.actor ? (
                        <div className="flex items-center gap-2.5">
                          <EntityAvatar
                            name={entry.actor.full_name || entry.actor.email}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {entry.actor.full_name}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {entry.actor.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">System</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {entry.summary}
                      </p>
                      {entry.detail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {entry.detail}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 text-right text-sm text-slate-500 dark:text-slate-400">
                      {formatDateTime(entry.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <LinkPagination
            page={page}
            pageSize={pageSize}
            total={total}
            itemLabel="event"
            buildHref={(targetPage) =>
              targetPage > 1
                ? `/admin/audit-log?page=${targetPage}`
                : "/admin/audit-log"
            }
          />
        </Card>
      )}
    </PageShell>
  );
}
