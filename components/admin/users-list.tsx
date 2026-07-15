"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Calendar, Users, UserCircle } from "lucide-react";
import { EmptyState } from "@/components/layout/dashboard-shell";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { EditUserButton } from "@/components/admin/edit-user-button";
import { RoleBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { DataTableCard } from "@/components/shared/data-table-card";
import { LinkPagination } from "@/components/shared/link-pagination";
import { SearchParamInput } from "@/components/shared/search-param-input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { canEditUser } from "@/lib/auth/roles";
import type { Profile } from "@/types/database";

export function UsersList({
  users,
  currentUserId,
  page,
  pageSize,
  total,
  search,
}: {
  users: Profile[];
  currentUserId?: string;
  page: number;
  pageSize: number;
  total: number;
  search: string;
}) {
  const [items, setItems] = useState(users);

  useEffect(() => {
    setItems(users);
  }, [users]);

  function handleUserUpdated(updated: Profile) {
    setItems((prev) =>
      prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
    );
  }

  function handleUserDeleted(userId: string) {
    setItems((prev) => prev.filter((u) => u.id !== userId));
  }

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  }

  if (total === 0 && !search) {
    return (
      <EmptyState
        icon={Users}
        title="No users yet"
        description="Create your first user to get started with Taskora."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 p-4 shadow-sm dark:border-slate-800">
        <SearchParamInput
          className="relative max-w-md"
          placeholder="Search users by name or email..."
        />
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description={`No users match "${search}". Try a different search.`}
        />
      ) : (
        <DataTableCard
          total={total}
          scrollable={false}
          pagination={
            <LinkPagination
              page={page}
              pageSize={pageSize}
              total={total}
              itemLabel="user"
              buildHref={buildHref}
            />
          }
        >
          <Table containerClassName="overflow-visible" className="table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/40">
                <TableHead className="w-[38%] px-4">User</TableHead>
                <TableHead className="w-[14%] px-4">Role</TableHead>
                <TableHead className="hidden w-[18%] px-4 md:table-cell">
                  Created
                </TableHead>
                <TableHead className="w-[120px] px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex min-w-0 items-center gap-3 rounded-lg transition-colors hover:opacity-90"
                    >
                      <EntityAvatar
                        name={user.full_name || user.email}
                        src={user.avatar_url}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 hover:text-blue-600 dark:text-slate-100">
                          {user.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user.email}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="px-4">
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className="hidden px-4 md:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{formatDate(user.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/users/${user.id}`} title="View profile">
                          <UserCircle className="h-4 w-4" />
                        </Link>
                      </Button>
                      {canEditUser(user.role) && (
                        <EditUserButton
                          user={user}
                          onUserUpdated={handleUserUpdated}
                        />
                      )}
                      <DeleteUserButton
                        userId={user.id}
                        userName={user.full_name}
                        userEmail={user.email}
                        isSelf={user.id === currentUserId}
                        onUserDeleted={handleUserDeleted}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableCard>
      )}
    </div>
  );
}
