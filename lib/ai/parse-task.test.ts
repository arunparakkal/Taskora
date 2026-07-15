import { describe, expect, it } from "vitest";
import { parseTaskHeuristic } from "@/lib/ai/parse-task";

describe("parseTaskHeuristic", () => {
  it("extracts priority, weekday due date, and short title", () => {
    const result = parseTaskHeuristic({
      text: "Prepare Q3 report by Friday, high priority",
      today: "2026-07-15",
    });

    expect(result.priority).toBe("high");
    expect(result.due_date).toBe("2026-07-17");
    expect(result.title.toLowerCase()).toContain("q3");
    expect(result.description.length).toBeGreaterThan(0);
    expect(result.source).toBe("heuristic");
  });

  it("matches assignee by name", () => {
    const result = parseTaskHeuristic({
      text: "Review API docs, assign to Arun, urgent",
      today: "2026-07-15",
      assignees: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Arun Kumar",
          email: "arun@example.com",
        },
      ],
    });

    expect(result.priority).toBe("urgent");
    expect(result.assignee_id).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("clamps due date within project period", () => {
    const result = parseTaskHeuristic({
      text: "Ship landing page by 2026-08-01",
      today: "2026-07-15",
      projectStartDate: "2026-07-01",
      projectDueDate: "2026-07-20",
    });

    expect(result.due_date).toBe("2026-07-20");
  });

  it("expands short create-page notes and guesses high priority", () => {
    const result = parseTaskHeuristic({
      text: "create siing page",
      today: "2026-07-15",
    });

    expect(result.priority).toBe("high");
    expect(result.description.toLowerCase()).toContain("page");
    expect(result.description.length).toBeGreaterThan("create siing page.".length);
  });
});
