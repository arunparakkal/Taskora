import { describe, expect, it } from "vitest";
import {
  buildMemberWorkloads,
  calculateMemberWorkload,
  formatLoadVsTeam,
  sortMembersByAvailability,
  summarizeAvailability,
  taskLoadPoints,
  type WorkloadTaskInput,
} from "./member-workload";

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function pastDate(daysAgo: number): string {
  return futureDate(-daysAgo);
}

describe("taskLoadPoints", () => {
  it("weighs in-progress work more heavily than todo", () => {
    const todo: WorkloadTaskInput = {
      assignee_id: "u1",
      status: "todo",
      priority: "low",
      due_date: null,
    };
    const inProgress: WorkloadTaskInput = { ...todo, status: "in_progress" };
    expect(taskLoadPoints(inProgress)).toBeGreaterThan(taskLoadPoints(todo));
  });

  it("adds a priority bonus for urgent tasks", () => {
    const base: WorkloadTaskInput = {
      assignee_id: "u1",
      status: "in_progress",
      priority: "low",
      due_date: null,
    };
    const urgent: WorkloadTaskInput = { ...base, priority: "urgent" };
    expect(taskLoadPoints(urgent)).toBeGreaterThan(taskLoadPoints(base));
  });

  it("adds an overdue penalty when the due date has passed", () => {
    const onTime: WorkloadTaskInput = {
      assignee_id: "u1",
      status: "in_progress",
      priority: "medium",
      due_date: futureDate(5),
    };
    const overdue: WorkloadTaskInput = { ...onTime, due_date: pastDate(2) };
    expect(taskLoadPoints(overdue)).toBe(taskLoadPoints(onTime) + 1);
  });

  it("never counts a completed task's due date as overdue", () => {
    const done: WorkloadTaskInput = {
      assignee_id: "u1",
      status: "done",
      priority: "medium",
      due_date: pastDate(10),
    };
    // status isn't in STATUS_LOAD map so it falls back to the 0.5 default,
    // with no overdue penalty since the task is done.
    expect(taskLoadPoints(done)).toBe(0.5);
  });
});

describe("calculateMemberWorkload", () => {
  it("excludes done tasks and tasks assigned to other members", () => {
    const tasks: WorkloadTaskInput[] = [
      { assignee_id: "u1", status: "done", priority: "high", due_date: null },
      { assignee_id: "u2", status: "in_progress", priority: "high", due_date: null },
      { assignee_id: "u1", status: "in_progress", priority: "medium", due_date: null },
    ];
    const workload = calculateMemberWorkload(tasks, "u1");
    expect(workload.openTasks).toBe(1);
    expect(workload.activeTasks).toBe(1);
  });

  it("classifies overdue and due-this-week tasks", () => {
    const tasks: WorkloadTaskInput[] = [
      { assignee_id: "u1", status: "in_progress", priority: "medium", due_date: pastDate(1) },
      { assignee_id: "u1", status: "todo", priority: "low", due_date: futureDate(3) },
      { assignee_id: "u1", status: "todo", priority: "low", due_date: futureDate(30) },
    ];
    const workload = calculateMemberWorkload(tasks, "u1");
    expect(workload.overdueTasks).toBe(1);
    expect(workload.dueThisWeek).toBe(1);
  });

  it("labels workload status relative to the team average", () => {
    const heavyTasks: WorkloadTaskInput[] = Array.from({ length: 5 }, () => ({
      assignee_id: "u1",
      status: "in_progress" as const,
      priority: "urgent" as const,
      due_date: null,
    }));
    const light = calculateMemberWorkload([], "u1", 10);
    const heavy = calculateMemberWorkload(heavyTasks, "u1", 2);
    expect(light.status).toBe("available");
    expect(heavy.status).toBe("overloaded");
  });

  it("falls back to fixed thresholds when there is no team average", () => {
    const workload = calculateMemberWorkload([], "u1", 0);
    expect(workload.status).toBe("available");
    expect(workload.loadVsTeamPercent).toBeNull();
  });
});

describe("buildMemberWorkloads", () => {
  it("computes a shared team average across all members", () => {
    const tasks: WorkloadTaskInput[] = [
      { assignee_id: "u1", status: "in_progress", priority: "urgent", due_date: null },
      { assignee_id: "u1", status: "in_progress", priority: "urgent", due_date: null },
      { assignee_id: "u2", status: "todo", priority: "low", due_date: null },
    ];
    const workloads = buildMemberWorkloads(tasks, ["u1", "u2"]);
    expect(workloads.u1.teamAverageLoad).toBe(workloads.u2.teamAverageLoad);
    expect(workloads.u1.loadPoints).toBeGreaterThan(workloads.u2.loadPoints);
  });

  it("returns a zero-load entry for members with no tasks", () => {
    const workloads = buildMemberWorkloads([], ["solo"]);
    expect(workloads.solo.loadPoints).toBe(0);
    expect(workloads.solo.openTasks).toBe(0);
  });
});

describe("sortMembersByAvailability", () => {
  it("sorts least-loaded members first", () => {
    const members = [{ id: "busy" }, { id: "free" }];
    const workloads = buildMemberWorkloads(
      [
        { assignee_id: "busy", status: "in_progress", priority: "urgent", due_date: null },
        { assignee_id: "busy", status: "in_progress", priority: "urgent", due_date: null },
      ],
      ["busy", "free"]
    );
    const sorted = sortMembersByAvailability(members, workloads);
    expect(sorted[0].id).toBe("free");
    expect(sorted[1].id).toBe("busy");
  });

  it("pushes members with no workload entry to the end", () => {
    const members = [{ id: "known" }, { id: "unknown" }];
    const workloads = buildMemberWorkloads([], ["known"]);
    const sorted = sortMembersByAvailability(members, workloads);
    expect(sorted[sorted.length - 1].id).toBe("unknown");
  });
});

describe("summarizeAvailability", () => {
  it("tallies members by status bucket", () => {
    const workloads = buildMemberWorkloads(
      [
        { assignee_id: "a", status: "in_progress", priority: "urgent", due_date: null },
        { assignee_id: "a", status: "in_progress", priority: "urgent", due_date: null },
        { assignee_id: "a", status: "in_progress", priority: "urgent", due_date: null },
      ],
      ["a", "b"]
    );
    const summary = summarizeAvailability(workloads);
    expect(summary.available + summary.moderate + summary.atCapacity + summary.overloaded).toBe(2);
  });
});

describe("formatLoadVsTeam", () => {
  it("describes lighter, heavier, and equal load relative to the team", () => {
    expect(formatLoadVsTeam(null)).toBe("");
    expect(formatLoadVsTeam(-20)).toBe("20% lighter than team avg");
    expect(formatLoadVsTeam(15)).toBe("15% heavier than team avg");
    expect(formatLoadVsTeam(0)).toBe("At team average");
  });
});
