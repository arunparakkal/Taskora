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
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/schemas";
import type { Profile } from "@/types/database";
import type { MemberWorkload } from "@/lib/workload/member-workload";
import { WorkloadBadge } from "@/components/shared/workload-badge";
import { sortMembersByAvailability } from "@/lib/workload/member-workload";

export function CreateTeamLeadTaskDialog({
  projectId,
  projectName,
  teamMembers,
  memberWorkloads = {},
}: {
  projectId: string;
  projectName: string;
  teamMembers: Profile[];
  memberWorkloads?: Record<string, MemberWorkload>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigneeValue, setAssigneeValue] = useState<string>("none");
  const [priorityValue, setPriorityValue] =
    useState<CreateTaskInput["priority"]>("medium");

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
    mode: "onBlur",
  });

  const description = watch("description") ?? "";

  const sortedMembers = sortMembersByAvailability(teamMembers, memberWorkloads);
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
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4">
          <DialogTitle>Add Task — {projectName}</DialogTitle>
        </DialogHeader>

        {teamMembers.length === 0 ? (
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
                <RequiredLabel htmlFor="tl_task_title">Title</RequiredLabel>
                <IconInput
                  id="tl_task_title"
                  icon={CheckSquare}
                  {...register("title")}
                  placeholder="Implement feature..."
                  className={fieldClass(!!errors.title)}
                  aria-invalid={!!errors.title}
                />
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
                        ({memberWorkloads[suggestedMember.id].availability} slot
                        {memberWorkloads[suggestedMember.id].availability !== 1
                          ? "s"
                          : ""}{" "}
                        free)
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
                  Sorted by availability — members with free capacity appear first
                </p>
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
                  <RequiredLabel htmlFor="tl_due_date" optional>
                    Due Date
                  </RequiredLabel>
                  <IconInput
                    id="tl_due_date"
                    icon={Calendar}
                    type="date"
                    {...register("due_date")}
                    className={fieldClass(!!errors.due_date)}
                    aria-invalid={!!errors.due_date}
                  />
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
