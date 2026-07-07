"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
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
 * The assignee is always notified; comment is optional.
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

  async function submitRework() {
    setPending(true);
    try {
      const trimmed = comment.trim();
      const res = await fetch("/api/tasks/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          decision: "rework",
          comment: trimmed || undefined,
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

      toast({
        title: "Rework assigned",
        description: trimmed
          ? "The member was notified with your comment."
          : "The member was notified.",
        variant: "success",
      });

      setComment("");
      onOpenChange(false);
      router.refresh();
      onComplete?.();
    } finally {
      setPending(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) setComment("");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign rework</DialogTitle>
          <DialogDescription>
            Send this task back for rework. The assignee will always receive a
            notification. Add an optional comment if they need a written reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
          <p className="text-sm font-semibold text-amber-950">
            Comment for member{" "}
            <span className="font-normal text-amber-800">(optional)</span>
          </p>
          <Textarea
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

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={submitRework}
            disabled={pending}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Assign rework
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
