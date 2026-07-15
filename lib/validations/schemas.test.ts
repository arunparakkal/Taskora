import { describe, expect, it } from "vitest";
import {
  createHabitSchema,
  createProjectSchema,
  createTaskSchema,
  createTeamSchema,
  createUserSchema,
  reviewTaskSchema,
  toCreateHabitPayload,
  updateHabitSchema,
  updateProjectSchema,
  updateUserSchema,
} from "./schemas";

describe("createUserSchema", () => {
  it("accepts a valid payload", () => {
    const result = createUserSchema.safeParse({
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      password: "hunter2",
      role: "member",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = createUserSchema.safeParse({
      full_name: "Ada Lovelace",
      email: "not-an-email",
      password: "hunter2",
      role: "member",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a role outside the allowed enum", () => {
    const result = createUserSchema.safeParse({
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      password: "hunter2",
      role: "superadmin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a full name shorter than 2 characters", () => {
    const result = createUserSchema.safeParse({
      full_name: "A",
      email: "ada@example.com",
      password: "hunter2",
      role: "member",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("allows an empty password (no change)", () => {
    const result = updateUserSchema.safeParse({
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      role: "admin",
      password: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a new password shorter than 8 characters", () => {
    const result = updateUserSchema.safeParse({
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      role: "admin",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("createTeamSchema", () => {
  it("requires a valid lead_id UUID", () => {
    const result = createTeamSchema.safeParse({
      name: "Platform",
      lead_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an optional description", () => {
    const result = createTeamSchema.safeParse({
      name: "Platform",
      lead_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    });
    expect(result.success).toBe(true);
  });
});

describe("createProjectSchema", () => {
  const base = {
    name: "Website Revamp",
    team_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    start_date: "2026-07-01",
    due_date: "2026-07-31",
  };

  it("accepts a project where the due date is after the start date", () => {
    expect(createProjectSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a due date before the start date", () => {
    const result = createProjectSchema.safeParse({
      ...base,
      start_date: "2026-08-01",
      due_date: "2026-07-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("due_date");
    }
  });

  it("rejects a malformed date string", () => {
    const result = createProjectSchema.safeParse({ ...base, start_date: "07/01/2026" });
    expect(result.success).toBe(false);
  });
});

describe("createTaskSchema", () => {
  const base = {
    title: "Fix login bug",
    project_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    priority: "high" as const,
    due_date: "2026-07-20",
  };

  it("accepts a task with a due date and no assignee", () => {
    expect(createTaskSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an invalid priority", () => {
    const result = createTaskSchema.safeParse({ ...base, priority: "critical" });
    expect(result.success).toBe(false);
  });

  it("requires a due date and rejects malformed values", () => {
    expect(createTaskSchema.safeParse({ ...base, due_date: "" }).success).toBe(
      false
    );
    expect(
      createTaskSchema.safeParse({
        title: base.title,
        project_id: base.project_id,
        priority: base.priority,
      }).success
    ).toBe(false);
    expect(
      createTaskSchema.safeParse({ ...base, due_date: "07-2026-01" }).success
    ).toBe(false);
  });
});

describe("reviewTaskSchema", () => {
  it("accepts approve/rework decisions with a valid task id", () => {
    expect(
      reviewTaskSchema.safeParse({
        taskId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        decision: "approve",
      }).success
    ).toBe(true);
  });

  it("rejects an unknown decision value", () => {
    expect(
      reviewTaskSchema.safeParse({
        taskId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        decision: "reject",
      }).success
    ).toBe(false);
  });
});

describe("updateProjectSchema", () => {
  it("rejects due_date before start_date when both are provided", () => {
    const result = updateProjectSchema.safeParse({
      start_date: "2026-07-10",
      due_date: "2026-07-01",
    });
    expect(result.success).toBe(false);
  });

  it("allows updating just one field", () => {
    expect(updateProjectSchema.safeParse({ name: "Renamed Project" }).success).toBe(
      true
    );
  });
});

describe("createHabitSchema", () => {
  it("accepts a simple one-click habit with no target", () => {
    const result = createHabitSchema.safeParse({
      title: "Meditate",
      icon: "brain",
      color: "violet",
      frequency: "daily",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a countable habit with a matching target and unit", () => {
    const result = createHabitSchema.safeParse({
      title: "Drink water",
      icon: "droplets",
      color: "blue",
      frequency: "daily",
      target_value: 8,
      target_unit: "glasses",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a target value without a unit", () => {
    const result = createHabitSchema.safeParse({
      title: "Drink water",
      icon: "droplets",
      color: "blue",
      frequency: "daily",
      target_value: 8,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a unit without a target value", () => {
    const result = createHabitSchema.safeParse({
      title: "Drink water",
      icon: "droplets",
      color: "blue",
      frequency: "daily",
      target_unit: "glasses",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a time-based unit paired with a target count", () => {
    const result = createHabitSchema.safeParse({
      title: "Read",
      icon: "book-open",
      color: "violet",
      frequency: "daily",
      target_value: 20,
      target_unit: "minutes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown icon", () => {
    const result = createHabitSchema.safeParse({
      title: "Meditate",
      icon: "sparkles",
      color: "violet",
      frequency: "daily",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateHabitSchema", () => {
  it("allows a partial update with no fields", () => {
    expect(updateHabitSchema.safeParse({}).success).toBe(true);
  });

  it("still validates target/unit pairing when either is provided", () => {
    const result = updateHabitSchema.safeParse({ target_value: 5 });
    expect(result.success).toBe(false);
  });
});

describe("toCreateHabitPayload", () => {
  it("converts string form fields into a typed payload", () => {
    const payload = toCreateHabitPayload({
      title: "  Drink water  ",
      icon: "droplets",
      color: "blue",
      frequency: "daily",
      target_value: "8",
      target_unit: "glasses",
    });
    expect(payload).toEqual({
      title: "Drink water",
      icon: "droplets",
      color: "blue",
      frequency: "daily",
      target_value: 8,
      target_unit: "glasses",
    });
  });

  it("drops the target for time-based units", () => {
    const payload = toCreateHabitPayload({
      title: "Read",
      icon: "book-open",
      color: "violet",
      frequency: "daily",
      target_value: "20",
      target_unit: "minutes",
    });
    expect(payload.target_value).toBeNull();
    expect(payload.target_unit).toBe("");
  });

  it("handles a habit with no target at all", () => {
    const payload = toCreateHabitPayload({
      title: "Meditate",
      icon: "brain",
      color: "violet",
      frequency: "daily",
      target_value: "",
      target_unit: "",
    });
    expect(payload.target_value).toBeNull();
    expect(payload.target_unit).toBe("");
  });
});
