"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
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
import type { ProjectStatus } from "@/types/database";

function statusToast(status: ProjectStatus, projectName: string) {
  switch (status) {
    case "paused":
      return {
        title: "Project paused",
        description: `"${projectName}" is paused. No new tasks can be added.`,
      };
    case "active":
      return {
        title: "Project restored",
        description: `"${projectName}" is active again.`,
      };
    case "archived":
      return {
        title: "Project archived",
        description: `"${projectName}" moved to Archived.`,
      };
  }
}

export function ProjectActionsMenu({
  projectId,
  projectName,
  status,
  detailHref,
  onStatusChange,
}: {
  projectId: string;
  projectName: string;
  status: ProjectStatus;
  detailHref?: string;
  onStatusChange?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function setStatus(nextStatus: "active" | "paused" | "archived") {
    setLoading(true);
    const res = await fetch(`/api/admin/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({ ...statusToast(nextStatus, projectName), variant: "success" });
    setArchiveOpen(false);
    onStatusChange?.();
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/admin/projects/${projectId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({
      title: "Project deleted",
      description: `"${projectName}" and its tasks were removed.`,
      variant: "success",
    });
    setDeleteOpen(false);
    router.refresh();
  }

  const canPause = status === "active";
  const canResume = status === "paused";
  const canArchive = status === "active" || status === "paused";
  const canRestore = status === "archived";

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {canPause && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            disabled={loading}
            onClick={() => void setStatus("paused")}
          >
            <Pause className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pause</span>
          </Button>
        )}
        {canResume && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-green-700 hover:bg-green-50 hover:text-green-800"
            disabled={loading}
            onClick={() => void setStatus("active")}
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Resume</span>
          </Button>
        )}
        {canArchive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            disabled={loading}
            onClick={() => setArchiveOpen(true)}
          >
            <Archive className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Archive</span>
          </Button>
        )}
        {canRestore && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-green-700 hover:bg-green-50 hover:text-green-800"
            disabled={loading}
            onClick={() => void setStatus("active")}
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Unarchive</span>
          </Button>
        )}
        {detailHref && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            asChild
          >
            <Link href={detailHref}>
              View
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label={`More actions for ${projectName}`}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
              onSelect={(e) => {
                e.preventDefault();
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive project?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2 text-left text-sm text-slate-600">
                <p>
                  The project will become read-only and move to Archived. No data
                  will be deleted.
                </p>
                <p className="font-medium text-slate-800">{projectName}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setArchiveOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={() => void setStatus("archived")}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              Archive
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{projectName}</strong> and all
              tasks in it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete project"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
