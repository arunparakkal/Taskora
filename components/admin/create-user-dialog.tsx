"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  User,
  Mail,
  Lock,
  Shield,
  UserPlus,
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
  RequiredLabel,
} from "@/components/shared/form-dialog-parts";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/schemas";
import type { AppRole } from "@/types/database";

export function CreateUserDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleValue, setRoleValue] = useState<AppRole>("member");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "member", password: "" },
    mode: "onBlur",
  });

  function handleClose() {
    setOpen(false);
    reset({ full_name: "", email: "", password: "", role: "member" });
    setRoleValue("member");
  }

  async function onSubmit(data: CreateUserInput) {
    setLoading(true);
    const res = await fetch("/api/admin/users", {
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
      title: "User created",
      description: `${data.full_name} was added as ${data.role.replace("_", " ")}.`,
      variant: "success",
    });
    handleClose();
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          reset({ full_name: "", email: "", password: "", role: "member" });
          setRoleValue("member");
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <RequiredLabel htmlFor="full_name">Full Name</RequiredLabel>
            <IconInput
              id="full_name"
              icon={User}
              {...register("full_name")}
              placeholder="John Doe"
              className={fieldClass(!!errors.full_name)}
              aria-invalid={!!errors.full_name}
            />
            <FormFieldError message={errors.full_name?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="email">Email</RequiredLabel>
            <IconInput
              id="email"
              icon={Mail}
              type="email"
              {...register("email")}
              placeholder="john@company.com"
              className={fieldClass(!!errors.email)}
              aria-invalid={!!errors.email}
            />
            <FormFieldError message={errors.email?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="password">Password</RequiredLabel>
            <IconInput
              id="password"
              icon={Lock}
              type="password"
              {...register("password")}
              placeholder="Enter password"
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel>Role</RequiredLabel>
            <IconSelectTrigger icon={Shield}>
              <Select
                value={roleValue}
                onValueChange={(v) => {
                  const typedRole = v as AppRole;
                  setRoleValue(typedRole);
                  setValue("role", typedRole, { shouldValidate: true });
                }}
              >
                <SelectTrigger className={fieldClass(!!errors.role)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="team_lead">Team Lead</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </IconSelectTrigger>
            <FormFieldError message={errors.role?.message} />
          </div>
          <FormDialogFooter
            onCancel={handleClose}
            submitLabel="Create User"
            submitIcon={UserPlus}
            loading={loading}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
