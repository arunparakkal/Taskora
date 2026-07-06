"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UsersRound, FileText, UserCircle, UserPlus } from "lucide-react";
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
import { createTeamSchema, type CreateTeamInput } from "@/lib/validations/schemas";
import { canBeTeamLead } from "@/lib/auth/roles";
import type { Profile } from "@/types/database";

export function CreateTeamDialog({ users }: { users: Profile[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leadValue, setLeadValue] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    mode: "onSubmit",
    defaultValues: { name: "", description: "", lead_id: "" },
  });

  const description = watch("description") ?? "";
  const teamLeads = users.filter((u) => canBeTeamLead(u.role));

  function handleClose() {
    setOpen(false);
    reset({ name: "", description: "", lead_id: "" });
    setLeadValue("");
  }

  async function onSubmit(data: CreateTeamInput) {
    setLoading(true);
    const res = await fetch("/api/admin/teams", {
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
      title: "Team created",
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
          reset({ name: "", description: "", lead_id: "" });
          setLeadValue("");
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <RequiredLabel htmlFor="team_name">Team Name</RequiredLabel>
            <IconInput
              id="team_name"
              icon={UsersRound}
              {...register("name")}
              placeholder="Engineering"
              aria-invalid={!!errors.name}
            />
            <FormFieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="team_description" optional>
              Description
            </RequiredLabel>
            <IconTextarea
              id="team_description"
              icon={FileText}
              {...register("description")}
              value={description}
              maxLength={200}
              placeholder="Team description..."
              aria-invalid={!!errors.description}
            />
            <FormFieldError message={errors.description?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel>Team Lead</RequiredLabel>
            <IconSelectTrigger icon={UserCircle}>
              <Select
                value={leadValue}
                onValueChange={(v) => {
                  setLeadValue(v);
                  setValue("lead_id", v, { shouldValidate: true });
                }}
              >
                <SelectTrigger
                  className={fieldClass(!!errors.lead_id)}
                  aria-invalid={!!errors.lead_id}
                >
                  <SelectValue placeholder="Choose a team lead" />
                </SelectTrigger>
                <SelectContent>
                  {teamLeads.length === 0 ? (
                    <SelectItem value="unavailable" disabled>
                      No team leads available — create a team lead user first
                    </SelectItem>
                  ) : (
                    teamLeads.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </IconSelectTrigger>
            <FormFieldError message={errors.lead_id?.message} />
            {teamLeads.length === 0 && (
              <p className="text-xs text-amber-700">
                Assign the team lead role to a user before creating a team.
              </p>
            )}
          </div>
          <FormDialogFooter
            onCancel={handleClose}
            submitLabel="Create Team"
            submitIcon={UserPlus}
            loading={loading}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
