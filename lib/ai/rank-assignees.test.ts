import { describe, expect, it } from "vitest";
import { rankAssigneesForAssignment } from "@/lib/ai/rank-assignees";
import { normalizeRepeatedLetters } from "@/lib/ai/normalize-text";

describe("normalizeRepeatedLetters", () => {
  it("collapses cartttttt to cart", () => {
    expect(normalizeRepeatedLetters("create cartttttt page")).toBe(
      "create cart page"
    );
  });
});

describe("rankAssigneesForAssignment", () => {
  it("prefers available high performers with low load", () => {
    const ranked = rankAssigneesForAssignment([
      {
        id: "1",
        name: "Busy Bob",
        openTasks: 8,
        loadPoints: 12,
        workloadStatus: "overloaded",
        performanceScore: 90,
      },
      {
        id: "2",
        name: "Free Fay",
        openTasks: 1,
        loadPoints: 1,
        workloadStatus: "available",
        performanceScore: 80,
      },
      {
        id: "3",
        name: "Mid Max",
        openTasks: 4,
        loadPoints: 6,
        workloadStatus: "moderate",
        performanceScore: 95,
      },
    ]);

    expect(ranked[0].id).toBe("2");
    expect(ranked[0].rankScore).toBeGreaterThan(ranked[1].rankScore);
  });
});
