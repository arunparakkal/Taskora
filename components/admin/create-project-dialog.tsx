"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  FolderKanban,
  Hash,
  FileText,
  UsersRound,
  FolderPlus,
  Calendar,
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
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/schemas";
import { generateProjectKey } from "@/lib/utils";
import type { TeamWithDetails } from "@/types/database";

export function CreateProjectDialog({ teams }: { teams: TeamWithDetails[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamValue, setTeamValue] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      key: "",
      description: "",
      team_id: "",
      start_date: "",
      due_date: "",
    },
  });

  const name = watch("name");
  const description = watch("description") ?? "";

  function handleClose() {
    setOpen(false);
    reset({ name: "", key: "", description: "", team_id: "", start_date: "", due_date: "" });
    setTeamValue("");
  }

  async function onSubmit(data: CreateProjectInput) {
    setLoading(true);
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        key: data.key || generateProjectKey(data.name),
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({
      title: "Project created",
      description: `${data.name} is ready.`,
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
          reset({ name: "", key: "", description: "", team_id: "", start_date: "", due_date: "" });
          setTeamValue("");
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        {teams.length === 0 ? (
          <p className="text-sm text-slate-500">
            Create a team first before adding a project.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <RequiredLabel htmlFor="project_name">Project Name</RequiredLabel>
              <IconInput
                id="project_name"
                icon={FolderKanban}
                {...register("name")}
                placeholder="Website Redesign"
                className={fieldClass(!!errors.name)}
                aria-invalid={!!errors.name}
              />
              <FormFieldError message={errors.name?.message} />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="project_key" optional>
                Project Key
              </RequiredLabel>
              <IconInput
                id="project_key"
                icon={Hash}
                {...register("key")}
                placeholder={name ? generateProjectKey(name) : "WR"}
              />
              <p className="text-xs text-slate-400">Auto-generated if left empty</p>
            </div>
            <div className="space-y-2">
              <RequiredLabel>Team</RequiredLabel>
              <IconSelectTrigger icon={UsersRound}>
                <Select
                  value={teamValue}
                  onValueChange={(v) => {
                    setTeamValue(v);
                    setValue("team_id", v, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className={fieldClass(!!errors.team_id)} aria-invalid={!!errors.team_id}>
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </IconSelectTrigger>
              <FormFieldError message={errors.team_id?.message} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="project_start_date">Start Date</RequiredLabel>
                <IconInput
                  id="project_start_date"
                  icon={Calendar}
                  type="date"
                  {...register("start_date")}
                  className={fieldClass(!!errors.start_date)}
                  aria-invalid={!!errors.start_date}
                />
                <FormFieldError message={errors.start_date?.message} />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="project_due_date">Due Date</RequiredLabel>
                <IconInput
                  id="project_due_date"
                  icon={Calendar}
                  type="date"
                  {...register("due_date")}
                  className={fieldClass(!!errors.due_date)}
                  aria-invalid={!!errors.due_date}
                />
                <FormFieldError message={errors.due_date?.message} />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Team leads can only assign task due dates within this project period.
            </p>
            <div className="space-y-2">
              <RequiredLabel htmlFor="project_description" optional>
                Description
              </RequiredLabel>
              <IconTextarea
                id="project_description"
                icon={FileText}
                {...register("description")}
                value={description}
                maxLength={200}
                placeholder="Project goals..."
                className={fieldClass(!!errors.description)}
                aria-invalid={!!errors.description}
              />
              <FormFieldError message={errors.description?.message} />
            </div>
            <FormDialogFooter
              onCancel={handleClose}
              submitLabel="Create Project"
              submitIcon={FolderPlus}
              loading={loading}
            />
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
