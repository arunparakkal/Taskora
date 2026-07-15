"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { CreateTaskInput } from "@/lib/validations/schemas";

export type AiAssigneePayload = {
  id: string;
  name: string;
  email?: string | null;
  open_tasks?: number;
  load_points?: number;
  workload_status?: "available" | "moderate" | "at_capacity" | "overloaded";
  performance_score?: number | null;
};

export type AiAutofillResult = Pick<
  CreateTaskInput,
  "title" | "description" | "priority" | "due_date" | "assignee_id"
> & {
  source?: "llm" | "heuristic";
  aiConfigured?: boolean;
  assignee_reason?: string;
};

export function AiAutofillButton({
  text,
  projectStartDate,
  projectDueDate,
  assignees,
  onFilled,
  disabled,
}: {
  text: string;
  projectStartDate?: string | null;
  projectDueDate?: string | null;
  assignees: AiAssigneePayload[];
  onFilled: (fields: AiAutofillResult) => void;
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const note = text.trim();
    if (note.length < 3) {
      toast({
        title: "Add a short note first",
        description:
          "Type what the task is about in the title field, then click AI Fill.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/autofill-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: note,
          project_start_date: projectStartDate || "",
          project_due_date: projectDueDate || "",
          assignees: assignees.map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email || "",
            open_tasks: a.open_tasks ?? 0,
            load_points: a.load_points ?? 0,
            workload_status: a.workload_status,
            performance_score: a.performance_score ?? null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({
          title: "Real AI needed",
          description: json.error ?? "Could not autofill this task.",
          variant: "destructive",
        });
        return;
      }

      onFilled({
        title: json.title ?? "",
        description: json.description ?? "",
        priority: json.priority ?? "medium",
        due_date: json.due_date ?? "",
        assignee_id: json.assignee_id ?? "",
        source: json.source,
        aiConfigured: json.aiConfigured,
        assignee_reason: json.assignee_reason ?? "",
      });

      toast({
        title: "Filled with real AI",
        description: json.assignee_reason
          ? json.assignee_reason
          : `Using ${json.provider ?? "LLM"}. Review suggestions, then create the task.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "AI Fill failed",
        description: "Network error — please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 gap-1.5 border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100 hover:text-violet-900"
      onClick={handleClick}
      disabled={disabled || loading}
      title="Real AI: fix spelling, expand the task, and suggest the freest strong performer"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      AI Fill
    </Button>
  );
}
