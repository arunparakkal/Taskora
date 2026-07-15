import { describe, expect, it } from "vitest";
import {
  TASKORA_KNOWLEDGE,
  buildGuestSystemPrompt,
  buildUserSystemPrompt,
  suggestedPromptsForGuest,
  suggestedPromptsForRole,
} from "@/lib/ai/chatbot-knowledge";

describe("chatbot knowledge", () => {
  it("includes core product facts for grounding", () => {
    expect(TASKORA_KNOWLEDGE.toLowerCase()).toContain("taskora");
    expect(TASKORA_KNOWLEDGE.toLowerCase()).toContain("admin");
    expect(TASKORA_KNOWLEDGE.toLowerCase()).toContain("no public self-signup");
  });

  it("builds a guest prompt that forbids inventing private data", () => {
    const prompt = buildGuestSystemPrompt();
    expect(prompt).toContain("PUBLIC SITE GUIDE");
    expect(prompt.toLowerCase()).toContain("not logged in");
    expect(prompt).toContain(TASKORA_KNOWLEDGE.slice(0, 40));
  });

  it("builds a user prompt with role and context card", () => {
    const prompt = buildUserSystemPrompt(
      {
        full_name: "Arun",
        email: "arun@example.com",
        role: "team_lead",
      },
      "Open tasks: 3"
    );
    expect(prompt).toContain("LOGGED-IN ASSISTANT");
    expect(prompt).toContain("Team Lead");
    expect(prompt).toContain("Open tasks: 3");
    expect(prompt.toLowerCase()).toContain("read-only");
  });

  it("returns role-specific suggested prompts", () => {
    expect(suggestedPromptsForGuest().length).toBeGreaterThan(0);
    expect(suggestedPromptsForRole("admin").some((p) => /org/i.test(p))).toBe(
      true
    );
    expect(
      suggestedPromptsForRole("team_lead").some((p) => /free/i.test(p))
    ).toBe(true);
    expect(
      suggestedPromptsForRole("member").some((p) => /due/i.test(p))
    ).toBe(true);
  });
});
