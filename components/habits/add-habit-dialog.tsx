"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { FormFieldError, fieldClass } from "@/components/shared/form-field";
import { RequiredLabel } from "@/components/shared/form-dialog-parts";
import {
  HABIT_COLOR_OPTIONS,
  HABIT_FREQUENCY_OPTIONS,
  HABIT_ICON_OPTIONS,
  HABIT_TEMPLATES,
} from "@/lib/habits/constants";
import { HabitIcon } from "@/components/habits/habit-icon";
import {
  createHabitFormSchema,
  toCreateHabitPayload,
  type CreateHabitFormInput,
} from "@/lib/validations/schemas";

const defaultValues: CreateHabitFormInput = {
  title: "",
  icon: "target",
  color: "violet",
  frequency: "daily",
  target_value: "",
  target_unit: "",
};

export function AddHabitDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<CreateHabitFormInput>({
    resolver: zodResolver(createHabitFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const icon = watch("icon");
  const color = watch("color");
  const frequency = watch("frequency");

  function applyTemplate(index: number) {
    const template = HABIT_TEMPLATES[index];
    setValue("title", template.title, { shouldValidate: true });
    setValue("icon", template.icon as CreateHabitFormInput["icon"], {
      shouldValidate: true,
    });
    setValue("color", template.color as CreateHabitFormInput["color"], {
      shouldValidate: true,
    });
    setValue("frequency", template.frequency, { shouldValidate: true });
    setValue(
      "target_value",
      "target_value" in template && template.target_value
        ? String(template.target_value)
        : "",
      { shouldValidate: true }
    );
    setValue(
      "target_unit",
      "target_unit" in template && template.target_unit
        ? template.target_unit
        : "",
      { shouldValidate: true }
    );
    clearErrors();
  }

  function handleClose(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset(defaultValues);
      clearErrors();
    }
  }

  async function onSubmit(values: CreateHabitFormInput) {
    setLoading(true);
    try {
      const payload = toCreateHabitPayload(values);
      const res = await fetch("/api/member/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create habit");

      toast({ title: "Habit created", variant: "success" });
      handleClose(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Could not create habit",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Habit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a new habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="flex flex-wrap gap-2">
            {HABIT_TEMPLATES.map((template, index) => (
              <button
                key={template.title}
                type="button"
                onClick={() => applyTemplate(index)}
                className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
              >
                {template.title}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <RequiredLabel htmlFor="habit_title">Title</RequiredLabel>
            <Input
              id="habit_title"
              placeholder="Drink 8 glasses of water"
              aria-invalid={!!errors.title}
              className={fieldClass(!!errors.title)}
              {...register("title")}
            />
            <FormFieldError message={errors.title?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <RequiredLabel>Icon</RequiredLabel>
              <Select
                value={icon}
                onValueChange={(v) =>
                  setValue("icon", v as CreateHabitFormInput["icon"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  className={fieldClass(!!errors.icon)}
                  aria-invalid={!!errors.icon}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <HabitIcon name={option.value} className="h-4 w-4" />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError message={errors.icon?.message} />
            </div>
            <div className="space-y-2">
              <RequiredLabel>Color</RequiredLabel>
              <Select
                value={color}
                onValueChange={(v) =>
                  setValue("color", v as CreateHabitFormInput["color"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  className={fieldClass(!!errors.color)}
                  aria-invalid={!!errors.color}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError message={errors.color?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <RequiredLabel>Frequency</RequiredLabel>
            <Select
              value={frequency}
              onValueChange={(v) =>
                setValue(
                  "frequency",
                  v as CreateHabitFormInput["frequency"],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger
                className={fieldClass(!!errors.frequency)}
                aria-invalid={!!errors.frequency}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HABIT_FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError message={errors.frequency?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <RequiredLabel htmlFor="target_value" optional>
                Target count
              </RequiredLabel>
              <Input
                id="target_value"
                inputMode="numeric"
                placeholder="8"
                aria-invalid={!!errors.target_value}
                className={fieldClass(!!errors.target_value)}
                {...register("target_value")}
              />
              <FormFieldError message={errors.target_value?.message} />
              <p className="text-[11px] text-slate-400">
                For countable habits only (e.g. glasses). Leave empty for time habits.
              </p>
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="target_unit" optional>
                Unit
              </RequiredLabel>
              <Input
                id="target_unit"
                placeholder="glasses"
                aria-invalid={!!errors.target_unit}
                className={fieldClass(!!errors.target_unit)}
                {...register("target_unit")}
              />
              <FormFieldError message={errors.target_unit?.message} />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {loading ? "Creating..." : "Create habit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
