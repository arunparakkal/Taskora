"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, Calendar, FileText, FolderPlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { FormFieldError, fieldClass } from "@/components/shared/form-field";
import {
  FormDialogFooter,
  IconInput,
  IconTextarea,
  RequiredLabel,
} from "@/components/shared/form-dialog-parts";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/schemas";
import type { Team, TeamLeadProjectItem } from "@/types/database";
import { z } from "zod";

type EditInput = z.infer<typeof updateProjectSchema> & { name: string };

export function CreateTeamLeadProjectDialog({
  teams,
  open,
  onOpenChange,
}: {
  teams: Team[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { team_id: teams[0]?.id ?? "" },
  });

  async function onSubmit(data: CreateProjectInput) {
    setLoading(true);
    const res = await fetch("/api/team-lead/projects", {
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
      title: "Project created",
      description: `${data.name} is ready.`,
      variant: "success",
    });
    reset();
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        {teams.length === 0 ? (
          <p className="text-sm text-slate-500">
            You must lead a team before creating a project.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <input type="hidden" {...register("team_id")} value={teams[0]?.id} />
            <div className="space-y-2">
              <RequiredLabel htmlFor="tl_proj_name">Project Name</RequiredLabel>
              <IconInput
                id="tl_proj_name"
                icon={FolderPlus}
                {...register("name")}
                className={fieldClass(!!errors.name)}
              />
              <FormFieldError message={errors.name?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <RequiredLabel htmlFor="tl_start">Start Date</RequiredLabel>
                <IconInput
                  id="tl_start"
                  icon={Calendar}
                  type="date"
                  {...register("start_date")}
                  className={fieldClass(!!errors.start_date)}
                />
                <FormFieldError message={errors.start_date?.message} />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="tl_due">Due Date</RequiredLabel>
                <IconInput
                  id="tl_due"
                  icon={Calendar}
                  type="date"
                  {...register("due_date")}
                  className={fieldClass(!!errors.due_date)}
                />
                <FormFieldError message={errors.due_date?.message} />
              </div>
            </div>
            <div className="space-y-2">
              <RequiredLabel optional>Description</RequiredLabel>
              <IconTextarea
                icon={FileText}
                {...register("description")}
                placeholder="Project goals..."
              />
            </div>
            <FormDialogFooter
              onCancel={() => onOpenChange(false)}
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

export function EditTeamLeadProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: TeamLeadProjectItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditInput>({
    resolver: zodResolver(
      updateProjectSchema.extend({
        name: z.string().trim().min(2).max(80),
      })
    ),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
      start_date: project.start_date ?? "",
      due_date: project.due_date ?? "",
    },
  });

  async function onSubmit(data: EditInput) {
    setLoading(true);
    const res = await fetch(`/api/team-lead/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({ title: "Project updated", variant: "success" });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <RequiredLabel htmlFor="edit_name">Project Name</RequiredLabel>
            <IconInput id="edit_name" icon={Pencil} {...register("name")} className={fieldClass(!!errors.name)} />
            <FormFieldError message={errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="edit_start">Start Date</RequiredLabel>
              <IconInput id="edit_start" icon={Calendar} type="date" {...register("start_date")} />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="edit_due">Due Date</RequiredLabel>
              <IconInput id="edit_due" icon={Calendar} type="date" {...register("due_date")} />
            </div>
          </div>
          <div className="space-y-2">
            <RequiredLabel optional>Description</RequiredLabel>
            <IconTextarea icon={FileText} {...register("description")} />
          </div>
          <FormDialogFooter
            onCancel={() => onOpenChange(false)}
            submitLabel="Save Changes"
            submitIcon={Pencil}
            loading={loading}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ArchiveProjectDialog({
  projectName,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archive project?</DialogTitle>
          <DialogDescription className="space-y-2 pt-2 text-left text-sm text-slate-600">
            <p>
              The project will become read-only and move to Archived. No data
              will be deleted. Only an admin can unarchive it.
            </p>
            <p className="font-medium text-slate-800">{projectName}</p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="gap-2">
            <Archive className="h-4 w-4" />
            Archive Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
