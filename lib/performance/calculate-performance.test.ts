import { describe, expect, it } from "vitest";
import {
  buildTeamPerformance,
  computeMemberPerformance,
  PILLAR_WEIGHTS,
  type PerformanceTaskInput,
} from "./calculate-performance";

const PERIOD_START = new Date("2026-06-01T00:00:00.000Z");
const PERIOD_END = new Date("2026-06-30T23:59:59.000Z");

function makeTask(overrides: Partial<PerformanceTaskInput> = {}): PerformanceTaskInput {
  return {
    id: "task-1",
    assignee_id: "user-1",
    status: "done",
    priority: "medium",
    due_date: "2026-06-15",
    created_at: "2026-06-01T00:00:00.000Z",
    completed_at: "2026-06-14T00:00:00.000Z",
    review_cycles: 0,
    reopened_count: 0,
    ...overrides,
  };
}

describe("computeMemberPerformance", () => {
  it("scores a perfect member (on-time, first-pass, no reopens) highly", () => {
    const tasks = [
      makeTask({ id: "t1", priority: "high" }),
      makeTask({ id: "t2", priority: "urgent" }),
    ];

    const result = computeMemberPerformance("user-1", tasks, {
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      teamThroughputBaseline: 7, // matches this member's weighted throughput (3 + 4)
    });

    expect(result.pillars.quality.percent).toBe(100);
    expect(result.pillars.delivery.percent).toBe(95);
    expect(result.pillars.reliability.percent).toBe(100);
    expect(result.overall).toBeGreaterThan(85);
    expect(result.level).toBe("excellent");
    expect(result.stats.completed).toBe(2);
    expect(result.stats.onTime).toBe(2);
    expect(result.stats.late).toBe(0);
    expect(result.stats.firstPassApprovals).toBe(2);
  });

  it("penalizes late delivery and reopened tasks", () => {
    const tasks = [
      makeTask({
        id: "t1",
        due_date: "2026-06-01",
        completed_at: "2026-06-12", // 11 days late
        review_cycles: 2,
        reopened_count: 2,
      }),
    ];

    const result = computeMemberPerformance("user-1", tasks, {
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      teamThroughputBaseline: 2,
    });

    expect(result.pillars.delivery.percent).toBe(25); // > 7 days late
    expect(result.pillars.quality.percent).toBe(20); // review_cycles>=2 -> 70, minus 2 reopens * 25
    expect(result.stats.late).toBe(1);
    expect(result.stats.onTime).toBe(0);
    expect(result.level).not.toBe("excellent");
  });

  it("uses a neutral baseline when there is no completed work", () => {
    const tasks = [makeTask({ status: "in_progress", completed_at: null })];

    const result = computeMemberPerformance("user-1", tasks, {
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      teamThroughputBaseline: 0,
    });

    expect(result.stats.completed).toBe(0);
    expect(result.pillars.quality.percent).toBe(70);
    expect(result.pillars.delivery.percent).toBe(85);
  });

  it("flags overdue open tasks in reliability without counting them as completed", () => {
    const tasks = [
      makeTask({
        id: "overdue-1",
        status: "in_progress",
        completed_at: null,
        due_date: "2026-06-01",
      }),
    ];

    const result = computeMemberPerformance("user-1", tasks, {
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      teamThroughputBaseline: 0,
    });

    expect(result.stats.overdueOpen).toBe(1);
    expect(result.pillars.reliability.percent).toBeLessThan(100);
  });

  it("only counts completions that fall within the scoring period", () => {
    const tasks = [
      makeTask({ id: "in-period", completed_at: "2026-06-10" }),
      makeTask({ id: "before-period", completed_at: "2026-05-20" }),
      makeTask({ id: "after-period", completed_at: "2026-07-05" }),
    ];

    const result = computeMemberPerformance("user-1", tasks, {
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      teamThroughputBaseline: 2,
    });

    expect(result.stats.completed).toBe(1);
  });

  it("weights every pillar according to PILLAR_WEIGHTS", () => {
    const result = computeMemberPerformance("user-1", [makeTask()], {
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      teamThroughputBaseline: 2,
    });

    expect(result.pillars.quality.max).toBe(PILLAR_WEIGHTS.quality);
    expect(result.pillars.delivery.max).toBe(PILLAR_WEIGHTS.delivery);
    expect(result.pillars.productivity.max).toBe(PILLAR_WEIGHTS.productivity);
    expect(result.pillars.reliability.max).toBe(PILLAR_WEIGHTS.reliability);
    expect(result.pillars.collaboration.max).toBe(PILLAR_WEIGHTS.collaboration);

    const maxPossible =
      result.pillars.quality.max +
      result.pillars.delivery.max +
      result.pillars.productivity.max +
      result.pillars.reliability.max +
      result.pillars.collaboration.max;
    expect(maxPossible).toBe(100);
  });
});

describe("buildTeamPerformance", () => {
  it("computes a productivity baseline from the team's average throughput", () => {
    const tasksByMember = new Map<string, PerformanceTaskInput[]>([
      ["low-performer", [makeTask({ id: "a", priority: "low" })]],
      ["high-performer", [makeTask({ id: "b", priority: "urgent" }), makeTask({ id: "c", priority: "urgent" })]],
    ]);

    const results = buildTeamPerformance(
      ["low-performer", "high-performer"],
      tasksByMember,
      PERIOD_START,
      PERIOD_END
    );

    expect(results.size).toBe(2);
    const low = results.get("low-performer")!;
    const high = results.get("high-performer")!;
    expect(high.pillars.productivity.percent).toBeGreaterThan(
      low.pillars.productivity.percent
    );
  });

  it("returns a full breakdown for members with no assigned tasks", () => {
    const results = buildTeamPerformance(
      ["idle-member"],
      new Map(),
      PERIOD_START,
      PERIOD_END
    );

    const idle = results.get("idle-member")!;
    expect(idle.stats.completed).toBe(0);
    expect(idle.overall).toBeGreaterThanOrEqual(0);
  });
});
