"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import type { Profile } from "@/types/database";
import { canJoinTeam } from "@/lib/auth/roles";

export function ManageTeamMembersDialog({
  teamId,
  teamName,
  allUsers,
  currentMemberIds,
}: {
  teamId: string;
  teamName: string;
  allUsers: Profile[];
  currentMemberIds: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(currentMemberIds);
  const [loading, setLoading] = useState(false);

  const eligibleUsers = allUsers.filter((user) => canJoinTeam(user.role));

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
          className="h-auto p-0 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Members — {teamName}</DialogTitle>
        </DialogHeader>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          <Label className="text-sm font-medium text-slate-700">Select team members</Label>
          {eligibleUsers.length === 0 ? (
            <p className="text-sm text-slate-500">
              No team leads or members available to add.
            </p>
          ) : (
            eligibleUsers.map((user) => (
            <label
              key={user.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(user.id)}
                onChange={() => toggleUser(user.id)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <EntityAvatar name={user.full_name || user.email} size="sm" />
              <div>
                <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </label>
            ))
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            Save Members
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
