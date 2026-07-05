"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareQuote, RotateCcw, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

/**
 * Shown when a reviewer moves Review → Rework.
 * Option 1: assign rework silently (no notification).
 * Option 2: optional comment — notification sent only when comment is provided.
 */
export function ReviewToReworkDialog({
  taskId,
  open,
  onOpenChange,
  onComplete,
}: {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);

  async function submitRework(reason?: string) {
    setPending(true);
    try {
      const res = await fetch("/api/tasks/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          decision: "rework",
          comment: reason?.trim() || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: json.error,
          variant: "destructive",
        });
        return;
      }

      const trimmed = reason?.trim();
      toast({
        title: "Rework assigned",
        description: trimmed
          ? "The member was notified with your comment."
          : "Task moved to Rework with no notification.",
        variant: "success",
      });

      setComment("");
      setShowCommentBox(false);
      onOpenChange(false);
      router.refresh();
      onComplete?.();
    } finally {
      setPending(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setComment("");
      setShowCommentBox(false);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign rework</DialogTitle>
          <DialogDescription>
            Send this task back for rework. Add an optional comment only when
            the member needs a written reason — notifications are sent only
            when a comment is included.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => submitRework()}
            disabled={pending}
            className="rounded-xl border border-orange-100 bg-orange-50/80 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:shadow-sm disabled:pointer-events-none disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
              <Workflow className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-orange-950">Rework</p>
            <p className="mt-1 text-xs leading-relaxed text-orange-800">
              Mark as Rework with no comment. The member will see the status
              change but no notification.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setShowCommentBox(true)}
            disabled={pending}
            className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 hover:shadow-sm disabled:pointer-events-none disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-amber-950">
              Add comment
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Optional. If you write a comment, the member gets a red
              notification with your reason.
            </p>
          </button>
        </div>

        {showCommentBox && (
          <div className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
            <p className="text-sm font-semibold text-amber-950">
              Comment for member (optional)
            </p>
            <Textarea
              autoFocus
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Fix validation on the login form and retest empty inputs."
              rows={5}
              maxLength={1000}
              className="bg-white"
            />
            <p className="text-right text-xs text-slate-400">
              {comment.length}/1000
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          {showCommentBox && (
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => submitRework(comment)}
              disabled={pending}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {comment.trim()
                ? "Assign rework & notify"
                : "Assign rework without comment"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
