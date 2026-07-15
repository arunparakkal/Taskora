import { z } from "zod";

const appRoleSchema = z.enum(["admin", "team_lead", "member"], {
  message: "Select a valid role",
});

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .or(z.literal(""));

export const createUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name must be at most 80 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255, "Email is too long"),
  password: z.string(),
  role: appRoleSchema,
});

export const updateUserRoleSchema = z.object({
  role: appRoleSchema,
});

export const updateUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name must be at most 80 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255, "Email is too long"),
  role: appRoleSchema,
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.length >= 8,
      "Password must be at least 8 characters"
    ),
});

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters")
    .max(60, "Team name must be at most 60 characters"),
  description: optionalText(500, "Description"),
  lead_id: z
    .string()
    .min(1, "Please choose a team lead")
    .uuid("Please choose a valid team lead"),
});

const isoDateSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, `Enter a valid ${label.toLowerCase()}`);

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must be at least 2 characters")
      .max(80, "Project name must be at most 80 characters"),
    key: z.string().trim().optional().or(z.literal("")),
    description: optionalText(500, "Description"),
    team_id: z
      .string()
      .min(1, "Please choose a team")
      .uuid("Please choose a valid team"),
    start_date: isoDateSchema("Start date"),
    due_date: isoDateSchema("Due date"),
  })
  .refine((data) => data.start_date <= data.due_date, {
    message: "Due date must be on or after the start date",
    path: ["due_date"],
  });

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title must be at most 120 characters"),
  description: optionalText(1000, "Description"),
  project_id: z
    .string()
    .min(1, "Please choose a project")
    .uuid("Please choose a valid project"),
  assignee_id: z
    .string()
    .uuid("Invalid assignee")
    .optional()
    .or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "urgent"], {
    message: "Select a priority",
  }),
  due_date: z
    .string({ message: "Due date is required" })
    .trim()
    .min(1, "Due date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid due date"),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "review", "rework", "done"], {
    message: "Invalid status",
  }),
});

export const reviewTaskSchema = z.object({
  taskId: z.string().uuid("Invalid task"),
  decision: z.enum(["approve", "rework"], {
    message: "Invalid decision",
  }),
  comment: z
    .string()
    .trim()
    .max(1000, "Reason must be at most 1000 characters")
    .optional()
    .or(z.literal("")),
});

export const updateProjectStatusSchema = z.object({
  status: z.enum(["active", "paused", "archived"], {
    message: "Invalid project status",
  }),
});

export const teamLeadArchiveProjectSchema = z.object({
  action: z.literal("archive"),
});

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must be at least 2 characters")
      .max(80, "Project name must be at most 80 characters")
      .optional(),
    description: optionalText(500, "Description"),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date")
      .optional()
      .or(z.literal("")),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid due date")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.start_date && data.due_date) {
        return data.start_date <= data.due_date;
      }
      return true;
    },
    { message: "Due date must be on or after start date", path: ["due_date"] }
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type ReviewTaskInput = z.infer<typeof reviewTaskSchema>;

export const aiAutofillTaskSchema = z.object({
  text: z
    .string()
    .trim()
    .min(3, "Type a short task note first")
    .max(500, "Keep the note under 500 characters"),
  project_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  project_due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  assignees: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        email: z.string().email().optional().or(z.literal("")).nullable(),
        open_tasks: z.number().int().min(0).max(10000).optional(),
        load_points: z.number().min(0).max(100000).optional(),
        workload_status: z
          .enum(["available", "moderate", "at_capacity", "overloaded"])
          .optional(),
        performance_score: z.number().min(0).max(100).nullable().optional(),
      })
    )
    .max(50)
    .optional(),
});

export type AiAutofillTaskInput = z.infer<typeof aiAutofillTaskSchema>;

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z
          .string()
          .trim()
          .min(1, "Message cannot be empty")
          .max(2000, "Keep each message under 2000 characters"),
      })
    )
    .min(1, "Send at least one message")
    .max(20, "Conversation is too long — start a new chat"),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

const habitFrequencySchema = z.enum(["daily", "weekdays", "weekly", "custom"], {
  message: "Select a valid frequency",
});

const habitIconSchema = z.enum(
  [
    "droplets",
    "dumbbell",
    "book-open",
    "brain",
    "target",
    "coffee",
    "moon",
    "heart",
    "pen-line",
    "code",
  ],
  { message: "Select a valid icon" }
);

const habitColorSchema = z.enum(
  ["violet", "emerald", "blue", "orange", "amber", "rose"],
  { message: "Select a valid color" }
);

function isTimeBasedUnit(unit: string | null | undefined): boolean {
  const value = (unit ?? "").trim().toLowerCase();
  if (!value) return false;
  return (
    value.includes("minute") ||
    value.includes("min") ||
    value.includes("hour") ||
    value.includes("hr") ||
    value.includes("session")
  );
}

const habitTargetFields = {
  target_value: z.number().int().min(1, "Target must be at least 1").max(999, "Target must be at most 999").optional().nullable(),
  target_unit: optionalText(40, "Unit"),
};

function refineHabitTargets<
  T extends { target_value?: number | null; target_unit?: string | null | "" },
>(data: T, ctx: z.RefinementCtx) {
  const unit = (data.target_unit ?? "").toString().trim();
  const hasTarget = data.target_value != null && !Number.isNaN(data.target_value);
  const hasUnit = unit.length > 0;

  if (isTimeBasedUnit(unit)) {
    ctx.addIssue({
      code: "custom",
      message:
        "Time-based habits don't use a target count. Leave target empty — one click marks the day complete.",
      path: ["target_unit"],
    });
  }

  if (hasTarget && !hasUnit) {
    ctx.addIssue({
      code: "custom",
      message: "Add a unit (e.g. glasses) when setting a target count",
      path: ["target_unit"],
    });
  }

  if (hasUnit && !hasTarget) {
    ctx.addIssue({
      code: "custom",
      message: "Add a target count when setting a unit",
      path: ["target_value"],
    });
  }
}

export const createHabitSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(120, "Title must be at most 120 characters"),
    description: optionalText(300, "Description"),
    icon: habitIconSchema.default("target"),
    color: habitColorSchema.default("violet"),
    frequency: habitFrequencySchema.default("daily"),
    days_of_week: z
      .array(z.number().int().min(1).max(7), {
        message: "Days must be numbers from 1 (Mon) to 7 (Sun)",
      })
      .optional(),
    ...habitTargetFields,
  })
  .superRefine(refineHabitTargets);

/** Client form schema — target fields are strings from inputs */
export const createHabitFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(120, "Title must be at most 120 characters"),
    icon: habitIconSchema,
    color: habitColorSchema,
    frequency: habitFrequencySchema,
    target_value: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || /^\d+$/.test(v),
        "Target must be a whole number"
      )
      .refine((v) => {
        if (v === "") return true;
        const n = Number(v);
        return n >= 1 && n <= 999;
      }, "Target must be between 1 and 999"),
    target_unit: z
      .string()
      .trim()
      .max(40, "Unit must be at most 40 characters"),
  })
  .superRefine((data, ctx) => {
    const unit = data.target_unit.trim();
    const hasTarget = data.target_value.trim().length > 0;
    const hasUnit = unit.length > 0;

    if (isTimeBasedUnit(unit)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Time-based habits don't use a target count. Leave target empty — one click marks the day complete.",
        path: ["target_unit"],
      });
    }

    if (hasTarget && !hasUnit) {
      ctx.addIssue({
        code: "custom",
        message: "Add a unit (e.g. glasses) when setting a target count",
        path: ["target_unit"],
      });
    }

    if (hasUnit && !hasTarget) {
      ctx.addIssue({
        code: "custom",
        message: "Add a target count when setting a unit",
        path: ["target_value"],
      });
    }
  });

export const updateHabitSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(120, "Title must be at most 120 characters")
      .optional(),
    description: optionalText(300, "Description"),
    icon: habitIconSchema.optional(),
    color: habitColorSchema.optional(),
    frequency: habitFrequencySchema.optional(),
    days_of_week: z.array(z.number().int().min(1).max(7)).optional(),
    ...habitTargetFields,
    is_active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.target_value !== undefined || data.target_unit !== undefined) {
      refineHabitTargets(
        {
          target_value: data.target_value ?? null,
          target_unit: data.target_unit ?? "",
        },
        ctx
      );
    }
  });

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type CreateHabitFormInput = z.infer<typeof createHabitFormSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export function toCreateHabitPayload(
  form: CreateHabitFormInput
): CreateHabitInput {
  const unit = form.target_unit.trim();
  const rawTarget = form.target_value.trim();
  const isTime = isTimeBasedUnit(unit);

  return {
    title: form.title.trim(),
    icon: form.icon,
    color: form.color,
    frequency: form.frequency,
    target_value:
      !isTime && rawTarget ? Number.parseInt(rawTarget, 10) : null,
    target_unit: !isTime && unit ? unit : "",
  };
}
