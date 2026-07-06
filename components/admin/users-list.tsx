"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Search, Users, UserCircle } from "lucide-react";
import { EmptyState } from "@/components/layout/dashboard-shell";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { EditUserButton } from "@/components/admin/edit-user-button";
import { RoleBadge } from "@/components/shared/badges";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { DataTableCard } from "@/components/shared/data-table-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function matchesSearch(user: Profile, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const roleLabel = user.role.replace("_", " ");

  return (
    user.full_name.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q) ||
    user.role.toLowerCase().includes(q) ||
    roleLabel.includes(q)
  );
}

export function UsersList({
  users,
  currentUserId,
}: {
  users: Profile[];
  currentUserId?: string;
}) {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [items, setItems] = useState(users);

  useEffect(() => {
    setItems(users);
  }, [users]);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  function handleUserUpdated(updated: Profile) {
    setItems((prev) =>
      prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
    );
  }

  function handleUserDeleted(userId: string) {
    setItems((prev) => prev.filter((u) => u.id !== userId));
  }

  const filteredUsers = useMemo(
    () => items.filter((user) => matchesSearch(user, query)),
    [items, query]
  );

  if (items.length === 0) {
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
      <Card className="border-slate-200 p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="h-10 border-slate-200 bg-slate-50 pl-10"
          />
        </div>
      </Card>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No users found"
          description={`No users match "${query}". Try a different search.`}
        />
      ) : (
        <DataTableCard total={filteredUsers.length} scrollable={false}>
          <Table containerClassName="overflow-visible" className="table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[38%] px-4">User</TableHead>
                <TableHead className="w-[14%] px-4">Role</TableHead>
                <TableHead className="hidden w-[18%] px-4 md:table-cell">
                  Created
                </TableHead>
                <TableHead className="w-[120px] px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex min-w-0 items-center gap-3 rounded-lg transition-colors hover:opacity-90"
                    >
                      <EntityAvatar name={user.full_name || user.email} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 hover:text-blue-600">
                          {user.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="px-4">
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className="hidden px-4 md:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-500">
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
