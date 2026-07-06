"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export function DeleteUserButton({
  userId,
  userName,
  userEmail,
  isSelf,
  onUserDeleted,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  isSelf: boolean;
  onUserDeleted?: (userId: string) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({ title: "User deleted", variant: "success" });
    onUserDeleted?.(userId);
    setOpen(false);
    router.refresh();
  }

  if (isSelf) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
        aria-label={`Delete ${userName}`}
        title="Delete user"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-red-100 sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-slate-900">Delete user?</DialogTitle>
            <DialogDescription className="text-slate-600">
              This permanently removes{" "}
              <span className="font-medium text-slate-900">{userName}</span> (
              {userEmail}) from Taskora. Their team memberships will be removed
              and assigned tasks will become unassigned.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete user"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
