"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ReviewToReworkDialog } from "@/components/tasks/review-to-rework-dialog";

export function ReviewActions({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingApprove, setPendingApprove] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function submitApprove() {
    setPendingApprove(true);
    try {
      const res = await fetch("/api/tasks/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, decision: "approve" }),
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

      toast({ title: "Task approved", variant: "success" });
      router.refresh();
    } finally {
      setPendingApprove(false);
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-orange-200 text-orange-700 hover:bg-orange-50"
          disabled={pendingApprove}
          onClick={() => setDialogOpen(true)}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Rework
        </Button>
        <Button
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={pendingApprove}
          onClick={submitApprove}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" />
          Approve
        </Button>
      </div>

      <ReviewToReworkDialog
        taskId={taskId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
