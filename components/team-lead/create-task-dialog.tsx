"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  CheckSquare,
  UserCircle,
  Flag,
  Calendar,
  FileText,
  ListPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { FormFieldError, fieldClass } from "@/components/shared/form-field";
import {
  FormDialogFooter,
  IconInput,
  IconSelectTrigger,
  IconTextarea,
  RequiredLabel,
} from "@/components/shared/form-dialog-parts";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { AiAutofillButton } from "@/components/tasks/ai-autofill-button";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/schemas";
import { projectPeriodLabel } from "@/lib/projects/date-utils";
import type { Profile } from "@/types/database";
import type { MemberWorkload } from "@/lib/workload/member-workload";
import { WorkloadBadge } from "@/components/shared/workload-badge";
import { sortMembersByAvailability } from "@/lib/workload/member-workload";

export function CreateTeamLeadTaskDialog({
  projectId,
  projectName,
  projectStartDate,
  projectDueDate,
  projectOpenForTasks = true,
  teamMembers,
  memberWorkloads = {},
  memberPerformanceScores = {},
  /** Current team lead — never shown as an assignable member / AI pick. */
  excludeUserId,
}: {
  projectId: string;
  projectName: string;
  projectStartDate: string | null;
  projectDueDate: string | null;
  projectOpenForTasks?: boolean;
  teamMembers: Profile[];
  memberWorkloads?: Record<string, MemberWorkload>;
  /** Overall performance 0–100 for the current month (best-effort). */
  memberPerformanceScores?: Record<string, number>;
  excludeUserId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigneeValue, setAssigneeValue] = useState<string>("none");
  const [priorityValue, setPriorityValue] =
    useState<CreateTaskInput["priority"]>("medium");
  const [assigneeReason, setAssigneeReason] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      project_id: projectId,
      priority: "medium",
    },
    mode: "onSubmit",
  });

  const description = watch("description") ?? "";
  const titleValue = watch("title") ?? "";

  // Team leads assign work to members — never to themselves / other leads.
  const assignableMembers = teamMembers.filter(
    (m) =>
      m.role === "member" &&
      (!excludeUserId || m.id !== excludeUserId)
  );

  const sortedMembers = sortMembersByAvailability(
    assignableMembers,
    memberWorkloads
  );
  const suggestedMember = sortedMembers.find(
    (m) => memberWorkloads[m.id]?.status === "available"
  );

  function handleClose() {
    setOpen(false);
    reset({
      title: "",
      description: "",
      project_id: projectId,
      assignee_id: "",
      priority: "medium",
      due_date: "",
    });
    setAssigneeValue("none");
    setPriorityValue("medium");
    setAssigneeReason("");
  }

  async function onSubmit(data: CreateTaskInput) {
    setLoading(true);
    const res = await fetch("/api/team-lead/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, project_id: projectId }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({
      title: "Task created",
      description: `"${data.title}" was assigned successfully.`,
      variant: "success",
    });
    handleClose();
    router.refresh();
  }

  const periodLabel = projectPeriodLabel(projectStartDate, projectDueDate);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          reset({
            title: "",
            description: "",
            project_id: projectId,
            assignee_id: "",
            priority: "medium",
            due_date: "",
          });
          setAssigneeValue("none");
          setPriorityValue("medium");
          setAssigneeReason("");
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
          disabled={!projectOpenForTasks}
          title={
            projectOpenForTasks
              ? undefined
              : "Tasks can only be added during the project period"
          }
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4">
          <DialogTitle>Add Task — {projectName}</DialogTitle>
          {periodLabel && (
            <p className="text-xs text-slate-500">
              Project period: {periodLabel}. Task due dates must fall within this range.
            </p>
          )}
        </DialogHeader>

        {!projectOpenForTasks ? (
          <p className="px-6 py-4 text-sm text-amber-800">
            This project is outside its active period. Tasks can only be added between
            the project start and due dates.
          </p>
        ) : assignableMembers.length === 0 ? (
          <p className="px-6 py-4 text-sm text-slate-500">
            No team members found. Ask an admin to add members to your team first.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            noValidate
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-6 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <RequiredLabel htmlFor="tl_task_title">Title</RequiredLabel>
                  <AiAutofillButton
                    text={titleValue}
                    projectStartDate={projectStartDate}
                    projectDueDate={projectDueDate}
                    assignees={assignableMembers.map((m) => {
                      const workload = memberWorkloads[m.id];
                      return {
                        id: m.id,
                        name: m.full_name || m.email || "Unknown",
                        email: m.email,
                        open_tasks: workload?.openTasks ?? 0,
                        load_points: workload?.loadPoints ?? 0,
                        workload_status: workload?.status,
                        performance_score:
                          memberPerformanceScores[m.id] ?? null,
                      };
                    })}
                    onFilled={(fields) => {
                      setValue("title", fields.title, { shouldValidate: true });
                      setValue("description", fields.description ?? "", {
                        shouldValidate: true,
                      });
                      setValue("priority", fields.priority, {
                        shouldValidate: true,
                      });
                      setPriorityValue(fields.priority);
                      setValue("due_date", fields.due_date ?? "", {
                        shouldValidate: true,
                      });
                      const nextAssignee = fields.assignee_id || "";
                      setValue("assignee_id", nextAssignee, {
                        shouldValidate: true,
                      });
                      setAssigneeValue(nextAssignee || "none");
                      setAssigneeReason(fields.assignee_reason ?? "");
                    }}
                  />
                </div>
                <IconInput
                  id="tl_task_title"
                  icon={CheckSquare}
                  {...register("title")}
                  placeholder="create cart page… then click AI Fill"
                  className={fieldClass(!!errors.title)}
                  aria-invalid={!!errors.title}
                />
                <p className="text-xs text-slate-400">
                  Real AI fixes spelling, expands the task, and assigns the freest strong performer.
                </p>
                <FormFieldError message={errors.title?.message} />
              </div>

              <div className="space-y-2">
                <RequiredLabel>Assign to team member</RequiredLabel>
                {suggestedMember && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900">
                    <span className="font-medium">Suggested: </span>
                    {suggestedMember.full_name || suggestedMember.email}
                    {memberWorkloads[suggestedMember.id] && (
                      <span className="ml-2 text-emerald-700">
                        (load {memberWorkloads[suggestedMember.id].loadPoints}
                        {memberWorkloads[suggestedMember.id].teamAverageLoad > 0 && (
                          <>
                            {" "}
                            · team avg{" "}
                            {memberWorkloads[suggestedMember.id].teamAverageLoad}
                          </>
                        )}
                        )
                      </span>
                    )}
                  </div>
                )}
                <IconSelectTrigger icon={UserCircle}>
                  <Select
                    value={assigneeValue}
                    onValueChange={(v) => {
                      setAssigneeValue(v);
                      setValue("assignee_id", v === "none" ? "" : v, {
                        shouldValidate: true,
                      });
                      setAssigneeReason("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {sortedMembers.map((member) => {
                        const label = member.full_name || member.email || "Unknown";
                        const workload = memberWorkloads[member.id];
                        return (
                          <SelectItem key={member.id} value={member.id}>
                            <span className="flex w-full items-center justify-between gap-3">
                              <span className="flex items-center gap-2">
                                <EntityAvatar name={label} size="sm" />
                                {label}
                              </span>
                              {workload && (
                                <WorkloadBadge status={workload.status} />
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </IconSelectTrigger>
                <p className="text-xs text-slate-400">
                  Sorted by load — members with lower load appear first
                </p>
                {assigneeReason && (
                  <div className="rounded-lg border border-violet-200 bg-violet-50/70 px-3 py-2 text-xs text-violet-900">
                    <span className="font-medium">Why AI chose them: </span>
                    {assigneeReason}
                  </div>
                )}
                <FormFieldError message={errors.assignee_id?.message} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <RequiredLabel>Priority</RequiredLabel>
                  <IconSelectTrigger icon={Flag}>
                    <Select
                      value={priorityValue}
                      onValueChange={(v) => {
                        const next = v as CreateTaskInput["priority"];
                        setPriorityValue(next);
                        setValue("priority", next, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger className={fieldClass(!!errors.priority)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </IconSelectTrigger>
                  <FormFieldError message={errors.priority?.message} />
                </div>

                <div className="min-w-0 space-y-2">
                  <RequiredLabel htmlFor="tl_due_date">Due Date</RequiredLabel>
                  <IconInput
                    id="tl_due_date"
                    icon={Calendar}
                    type="date"
                    min={projectStartDate ?? undefined}
                    max={projectDueDate ?? undefined}
                    {...register("due_date")}
                    className={fieldClass(!!errors.due_date)}
                    aria-invalid={!!errors.due_date}
                  />
                  {periodLabel && (
                    <p className="text-xs text-slate-400">
                      Must be between {projectStartDate} and {projectDueDate}
                    </p>
                  )}
                  <FormFieldError message={errors.due_date?.message} />
                </div>
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="tl_task_description" optional>
                  Description
                </RequiredLabel>
                <IconTextarea
                  id="tl_task_description"
                  icon={FileText}
                  {...register("description")}
                  value={description}
                  maxLength={200}
                  placeholder="Task details..."
                  className={fieldClass(!!errors.description)}
                  aria-invalid={!!errors.description}
                />
                <FormFieldError message={errors.description?.message} />
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
              <FormDialogFooter
                onCancel={handleClose}
                submitLabel="Add Task"
                submitIcon={ListPlus}
                loading={loading}
              />
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
