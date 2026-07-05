"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Pencil, Shield, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { updateUserSchema, type UpdateUserInput } from "@/lib/validations/schemas";
import type { AppRole, Profile } from "@/types/database";

export function EditUserButton({ user }: { user: Profile }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleValue, setRoleValue] = useState<AppRole>(user.role);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) {
      reset({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        password: "",
      });
      setRoleValue(user.role);
    }
  }, [open, user, reset]);

  async function onSubmit(data: UpdateUserInput) {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
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

    toast({
      title: "User updated",
      description: `${data.full_name.trim()} was saved successfully.`,
      variant: "success",
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 shrink-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        aria-label={`Edit ${user.full_name}`}
        title="Edit user"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-slate-200 sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 sm:mx-0">
              <Pencil className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle className="text-slate-900">Edit user</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update account details for{" "}
              <span className="font-medium text-slate-900">{user.full_name}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <RequiredLabel htmlFor={`edit-name-${user.id}`}>Full Name</RequiredLabel>
              <IconInput
                id={`edit-name-${user.id}`}
                icon={User}
                {...register("full_name")}
                placeholder="John Doe"
                className={fieldClass(!!errors.full_name)}
                aria-invalid={!!errors.full_name}
              />
              <FormFieldError message={errors.full_name?.message} />
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor={`edit-email-${user.id}`}>Email</RequiredLabel>
              <IconInput
                id={`edit-email-${user.id}`}
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

            <div className="space-y-2">
              <label
                htmlFor={`edit-password-${user.id}`}
                className="text-sm font-medium text-slate-700"
              >
                New password{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <IconInput
                id={`edit-password-${user.id}`}
                icon={Lock}
                type="password"
                {...register("password")}
                placeholder="Leave blank to keep current password"
                className={fieldClass(!!errors.password)}
                aria-invalid={!!errors.password}
              />
              <FormFieldError message={errors.password?.message} />
            </div>

            <FormDialogFooter
              onCancel={() => setOpen(false)}
              submitLabel="Save changes"
              submitIcon={Pencil}
              loading={loading}
            />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
