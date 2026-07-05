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
    .uuid("Invalid team lead")
    .optional()
    .or(z.literal("")),
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
    team_id: z.string().uuid("Please select a team"),
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
  project_id: z.string().uuid("Please select a project"),
  assignee_id: z
    .string()
    .uuid("Invalid assignee")
    .optional()
    .or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "urgent"], {
    message: "Select a priority",
  }),
  due_date: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val) return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(val);
      },
      { message: "Enter a valid due date" }
    ),
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

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type ReviewTaskInput = z.infer<typeof reviewTaskSchema>;
