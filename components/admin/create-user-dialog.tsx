"use client";

import { useEffect, useState } from "react";
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
  Camera,
  X,
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
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/schemas";
import {
  AVATAR_MAX_BYTES,
  validateAvatarFile,
} from "@/lib/avatars/constants";
import type { AppRole } from "@/types/database";

export function CreateUserDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleValue, setRoleValue] = useState<AppRole>("member");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [namePreview, setNamePreview] = useState("");

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

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function clearAvatar() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
    setFileInputKey((k) => k + 1);
  }

  function resetForm() {
    reset({ full_name: "", email: "", password: "", role: "member" });
    setRoleValue("member");
    setNamePreview("");
    clearAvatar();
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      clearAvatar();
      return;
    }

    const error = validateAvatarFile(file);
    if (error) {
      setAvatarError(error);
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setFileInputKey((k) => k + 1);
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(data: CreateUserInput) {
    if (avatarError) return;

    setLoading(true);
    const formData = new FormData();
    formData.set("full_name", data.full_name);
    formData.set("email", data.email);
    formData.set("password", data.password);
    formData.set("role", data.role);
    if (avatarFile) {
      formData.set("avatar", avatarFile);
    }

    const res = await fetch("/api/admin/users", {
      method: "POST",
      body: formData,
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
          resetForm();
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
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Photo{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="flex items-center gap-4">
              <EntityAvatar
                name={namePreview || "User"}
                src={avatarPreview}
                size="lg"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  id="create-user-avatar"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    document.getElementById("create-user-avatar")?.click()
                  }
                >
                  <Camera className="h-3.5 w-3.5" />
                  {avatarFile ? "Change" : "Add photo"}
                </Button>
                {avatarFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-slate-500"
                    onClick={clearAvatar}
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              JPEG, PNG, WebP, or GIF · max {AVATAR_MAX_BYTES / (1024 * 1024)}MB
            </p>
            <FormFieldError message={avatarError ?? undefined} />
          </div>

          <div className="space-y-2">
            <RequiredLabel htmlFor="full_name">Full Name</RequiredLabel>
            <IconInput
              id="full_name"
              icon={User}
              {...register("full_name", {
                onChange: (e) => setNamePreview(e.target.value),
              })}
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
