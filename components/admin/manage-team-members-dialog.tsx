"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Users, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { canJoinTeam } from "@/lib/auth/roles";

type TeamRef = { id: string; name: string };

export function ManageTeamMembersDialog({
  teamId,
  teamName,
  allUsers,
  currentMemberIds,
  userTeams = {},
}: {
  teamId: string;
  teamName: string;
  allUsers: Profile[];
  currentMemberIds: string[];
  userTeams?: Record<string, TeamRef[]>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(currentMemberIds);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const eligibleUsers = useMemo(
    () => allUsers.filter((user) => canJoinTeam(user.role)),
    [allUsers]
  );

  const nameOf = (u: Profile) => u.full_name || u.email;

  // Stable ordering computed from the team's saved membership (not the live
  // selection) so rows don't jump around while the admin ticks people.
  // Order: current members first, then people with no team, then people
  // already on another team — each group sorted alphabetically.
  const orderedUsers = useMemo(() => {
    const memberSet = new Set(currentMemberIds);
    const byName = (a: Profile, b: Profile) =>
      nameOf(a).localeCompare(nameOf(b));

    const otherTeamCount = (u: Profile) =>
      (userTeams[u.id] ?? []).filter((t) => t.id !== teamId).length;

    const members = eligibleUsers.filter((u) => memberSet.has(u.id)).sort(byName);
    const free = eligibleUsers
      .filter((u) => !memberSet.has(u.id) && otherTeamCount(u) === 0)
      .sort(byName);
    const onOtherTeam = eligibleUsers
      .filter((u) => !memberSet.has(u.id) && otherTeamCount(u) > 0)
      .sort(byName);

    return [...members, ...free, ...onOtherTeam];
  }, [eligibleUsers, currentMemberIds, userTeams, teamId]);

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orderedUsers;
    return orderedUsers.filter((u) =>
      `${u.full_name ?? ""} ${u.email}`.toLowerCase().includes(q)
    );
  }, [orderedUsers, query]);

  function toggleUser(userId: string) {
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleSave() {
    setLoading(true);
    const memberIds = selected.filter((id) =>
      eligibleUsers.some((user) => user.id === id)
    );
    const res = await fetch(`/api/admin/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: memberIds }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({ title: "Members updated", variant: "success" });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setQuery("");
          setSelected(
            currentMemberIds.filter((id) =>
              eligibleUsers.some((user) => user.id === id)
            )
          );
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="h-auto p-0 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Members — {teamName}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Select team members
          </span>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            {selected.length} selected
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people by name or email..."
            className="h-10 border-slate-200 bg-slate-50 pl-10 dark:border-slate-700 dark:bg-slate-800/50"
          />
        </div>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {eligibleUsers.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No team leads or members available to add.
            </p>
          ) : visibleUsers.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No people match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            visibleUsers.map((user) => {
              const checked = selected.includes(user.id);
              const isMember = currentMemberIds.includes(user.id);
              const otherTeams = (userTeams[user.id] ?? []).filter(
                (t) => t.id !== teamId
              );

              return (
                <label
                  key={user.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                    checked
                      ? "border-blue-300 bg-blue-50/70 dark:border-blue-500/40 dark:bg-blue-500/10"
                      : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      checked
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                    )}
                  >
                    {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUser(user.id)}
                    className="sr-only"
                  />
                  <EntityAvatar name={user.full_name || user.email} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {user.full_name || user.email}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {isMember && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <UsersRound className="h-3 w-3" />
                        Member
                      </span>
                    )}
                    {otherTeams.length > 0 && (
                      <span
                        className="inline-flex max-w-[9rem] items-center gap-1 truncate rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300"
                        title={otherTeams.map((t) => t.name).join(", ")}
                      >
                        In {otherTeams[0].name}
                        {otherTeams.length > 1 && ` +${otherTeams.length - 1}`}
                      </span>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="border-slate-200"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            Save Members
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
