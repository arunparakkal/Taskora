"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";

export function TeamActionsMenu({
  teamId,
  teamName,
  memberCount,
}: {
  teamId: string;
  teamName: string;
  memberCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/admin/teams/${teamId}`, { method: "DELETE" });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({
      title: "Team deleted",
      description: `"${teamName}" was removed.`,
      variant: "success",
    });
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={`More actions for ${teamName}`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-500/15 dark:focus:text-red-300"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-red-100 sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-slate-900">Delete team?</DialogTitle>
            <DialogDescription className="text-slate-600">
              This permanently removes{" "}
              <span className="font-medium text-slate-900">{teamName}</span> and
              all related data: {memberCount} member
              {memberCount !== 1 ? "s" : ""}, projects, and tasks. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
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
                "Delete team"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
