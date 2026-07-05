"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/shared/badges";
import { ReviewToReworkDialog } from "@/components/tasks/review-to-rework-dialog";
import {
  getMemberStatusLabel,
  getMemberStatusOptions,
  isMemberStatusLocked,
  TASK_STATUS_OPTIONS,
} from "@/lib/task-status";
import type { TaskStatus } from "@/types/database";

export function TaskStatusSelect({
  taskId,
  currentStatus,
  disabled,
  mode = "full",
}: {
  taskId: string;
  currentStatus: TaskStatus;
  disabled?: boolean;
  mode?: "full" | "member";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectValue, setSelectValue] = useState(currentStatus);
  const [reworkDialogOpen, setReworkDialogOpen] = useState(false);

  useEffect(() => {
    setSelectValue(currentStatus);
  }, [currentStatus]);

  const statuses =
    mode === "member"
      ? getMemberStatusOptions(currentStatus)
      : TASK_STATUS_OPTIONS;
  const isLocked = mode === "member" && isMemberStatusLocked(currentStatus);

  async function patchStatus(status: TaskStatus) {
    const res = await fetch("/api/admin/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    const json = await res.json();

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      setSelectValue(currentStatus);
      return;
    }

    if (mode === "member" && status === "review") {
      toast({
        title: "Marked as done",
        description: "Your team lead will review this task.",
      });
    } else {
      toast({ title: "Status updated" });
    }
    setSelectValue(status);
    router.refresh();
  }

  async function approveFromReview() {
    const res = await fetch("/api/tasks/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, decision: "approve" }),
    });
    const json = await res.json();

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      setSelectValue(currentStatus);
      return;
    }

    toast({ title: "Task approved", variant: "success" });
    setSelectValue("done");
    router.refresh();
  }

  function handleChange(status: TaskStatus) {
    if (mode === "member") {
      if (status === "rework") {
        setSelectValue(currentStatus);
        return;
      }
      void patchStatus(status);
      return;
    }

    if (currentStatus === "review") {
      if (status === "rework") {
        setReworkDialogOpen(true);
        return;
      }
      if (status === "done") {
        void approveFromReview();
        return;
      }
    }

    void patchStatus(status);
  }

  if (isLocked) {
    return (
      <div className="space-y-1.5">
        <StatusBadge status={currentStatus} audience="member" />
        <p className="text-xs text-slate-500">
          {currentStatus === "review"
            ? "Awaiting team lead review."
            : "This task is completed."}
        </p>
      </div>
    );
  }

  if (mode === "member" && currentStatus === "rework") {
    return (
      <div className="space-y-2">
        <StatusBadge status="rework" audience="member" />
        <Select
          key={`${taskId}-${currentStatus}`}
          value={selectValue}
          onValueChange={(v) => handleChange(v as TaskStatus)}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-full min-w-0 whitespace-nowrap sm:min-w-[9.75rem] sm:w-auto">
            <SelectValue placeholder="Update status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem
                key={s.value}
                value={s.value}
                disabled={s.value === "rework"}
              >
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-orange-700">
          Move to In Progress, then Done when fixed.
        </p>
      </div>
    );
  }

  return (
    <>
      <Select
        key={`${taskId}-${currentStatus}`}
        value={selectValue}
        onValueChange={(v) => handleChange(v as TaskStatus)}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 w-full min-w-0 whitespace-nowrap sm:min-w-[9.75rem] sm:w-auto">
          <SelectValue>
            {mode === "member"
              ? getMemberStatusLabel(selectValue)
              : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem
              key={s.value}
              value={s.value}
              disabled={mode === "member" && s.value === "rework"}
            >
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {mode === "full" && (
        <ReviewToReworkDialog
          taskId={taskId}
          open={reworkDialogOpen}
          onOpenChange={(open) => {
            setReworkDialogOpen(open);
            if (!open) setSelectValue(currentStatus);
          }}
          onComplete={() => setSelectValue("rework")}
        />
      )}
    </>
  );
}
