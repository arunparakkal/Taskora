"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  CheckSquare,
  FolderKanban,
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
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/schemas";
import type { Profile, ProjectWithDetails } from "@/types/database";

export function CreateTaskDialog({
  projects,
  users,
  defaultProjectId,
}: {
  projects: ProjectWithDetails[];
  users: Profile[];
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectValue, setProjectValue] = useState<string>(defaultProjectId ?? "");
  const [assigneeValue, setAssigneeValue] = useState<string>("none");
  const [priorityValue, setPriorityValue] =
    useState<CreateTaskInput["priority"]>("medium");

  const initialProjectId = defaultProjectId ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    mode: "onSubmit",
    defaultValues: { priority: "medium", project_id: initialProjectId || "" },
  });

  function resetForm() {
    reset({
      title: "",
      description: "",
      project_id: initialProjectId,
      assignee_id: "",
      priority: "medium",
      due_date: "",
    });
    setProjectValue(initialProjectId);
    setAssigneeValue("none");
    setPriorityValue("medium");
  }

  const description = watch("description") ?? "";
  const selectedProject = projects.find((p) => p.id === projectValue);
  const taskDueMin = selectedProject?.start_date ?? undefined;
  const taskDueMax = selectedProject?.due_date ?? undefined;
  const projectPeriod = selectedProject?.start_date && selectedProject?.due_date
    ? `${selectedProject.start_date} → ${selectedProject.due_date}`
    : null;

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function onSubmit(data: CreateTaskInput) {
    setLoading(true);
    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({
      title: "Task created",
      description: `"${data.title}" has been assigned.`,
      variant: "success",
    });
    handleClose();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) resetForm();
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4">
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        {projects.length === 0 ? (
          <p className="px-6 py-4 text-sm text-slate-500">
            Create a project first before adding a task.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            noValidate
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-6 py-4">
              <div className="space-y-2">
                <RequiredLabel htmlFor="task_title">Title</RequiredLabel>
                <IconInput
                  id="task_title"
                  icon={CheckSquare}
                  {...register("title")}
                  placeholder="Implement login page"
                  className={fieldClass(!!errors.title)}
                  aria-invalid={!!errors.title}
                />
                <FormFieldError message={errors.title?.message} />
              </div>

              <div className="space-y-2">
                <RequiredLabel>Project</RequiredLabel>
                <IconSelectTrigger icon={FolderKanban}>
                  <Select
                    value={projectValue}
                    onValueChange={(v) => {
                      setProjectValue(v);
                      setValue("project_id", v, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className={fieldClass(!!errors.project_id)} aria-invalid={!!errors.project_id}>
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="truncate">[{p.key}] {p.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </IconSelectTrigger>
                <FormFieldError message={errors.project_id?.message} />
                {projectPeriod && (
                  <p className="text-xs text-slate-400">
                    Project period: {projectPeriod}. Task due dates must fall within this range.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <RequiredLabel optional>Assignee</RequiredLabel>
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
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <span className="truncate">{u.full_name || u.email}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </IconSelectTrigger>
                <FormFieldError message={errors.assignee_id?.message} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <RequiredLabel>Priority</RequiredLabel>
                  <IconSelectTrigger icon={Flag}>
                    <Select
                      value={priorityValue}
                      onValueChange={(v) => {
                        const nextPriority = v as CreateTaskInput["priority"];
                        setPriorityValue(nextPriority);
                        setValue("priority", nextPriority, { shouldValidate: true });
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
                  <RequiredLabel htmlFor="due_date" optional>
                    Due Date
                  </RequiredLabel>
                  <IconInput
                    id="due_date"
                    icon={Calendar}
                    type="date"
                    min={taskDueMin}
                    max={taskDueMax}
                    {...register("due_date")}
                    className={fieldClass(!!errors.due_date)}
                    aria-invalid={!!errors.due_date}
                  />
                  {taskDueMin && taskDueMax && (
                    <p className="text-xs text-slate-400">
                      Must be between {taskDueMin} and {taskDueMax}
                    </p>
                  )}
                  <FormFieldError message={errors.due_date?.message} />
                </div>
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="task_description" optional>
                  Description
                </RequiredLabel>
                <IconTextarea
                  id="task_description"
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
                submitLabel="Create Task"
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
