import { isAiConfigured } from "@/lib/ai/env";
import { completeJsonPrompt } from "@/lib/ai/llm-client";
import { normalizeRepeatedLetters } from "@/lib/ai/normalize-text";
import {
  buildAssigneePickReason,
  rankAssigneesForAssignment,
  type RankableAssignee,
} from "@/lib/ai/rank-assignees";
import type { TaskPriority } from "@/types/database";

export interface AiAssigneeCandidate extends RankableAssignee {}

export interface ParseTaskInput {
  text: string;
  today?: string;
  projectStartDate?: string | null;
  projectDueDate?: string | null;
  assignees?: AiAssigneeCandidate[];
  /** When true (default), require a real LLM — no silent typo-echo fallback. */
  requireLlm?: boolean;
}

export interface ParsedTaskFields {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  assignee_id: string;
  assignee_reason: string;
  /** Whether an external LLM was used (vs local heuristics). */
  source: "llm" | "heuristic";
  provider?: string;
  aiConfigured: boolean;
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

function todayIso(today?: string) {
  if (today && /^\d{4}-\d{2}-\d{2}$/.test(today)) return today;
  return new Date().toISOString().slice(0, 10);
}

function clampDate(
  value: string,
  min?: string | null,
  max?: string | null
): string {
  if (!value) return "";
  if (min && value < min) return min;
  if (max && value > max) return max;
  return value;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nextWeekday(fromIso: string, weekday: number): string {
  const d = new Date(`${fromIso}T12:00:00`);
  const current = d.getDay();
  let delta = (weekday - current + 7) % 7;
  if (delta === 0) delta = 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function extractPriority(text: string): { priority: TaskPriority; cleaned: string } {
  let priority: TaskPriority = "medium";
  let cleaned = text;

  const patterns: Array<{ re: RegExp; value: TaskPriority }> = [
    { re: /\b(priority\s*[:=]?\s*)?urgent\b|\basap\b|\bcritical\b/i, value: "urgent" },
    { re: /\b(priority\s*[:=]?\s*)?high(\s+priority)?\b/i, value: "high" },
    { re: /\b(priority\s*[:=]?\s*)?low(\s+priority)?\b/i, value: "low" },
    { re: /\b(priority\s*[:=]?\s*)?medium(\s+priority)?\b/i, value: "medium" },
  ];

  for (const { re, value } of patterns) {
    if (re.test(cleaned)) {
      priority = value;
      cleaned = cleaned.replace(re, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }

  return { priority, cleaned };
}

function extractDueDate(
  text: string,
  today: string
): { due_date: string; cleaned: string } {
  let cleaned = text;
  let due_date = "";

  const isoMatch = cleaned.match(
    /\b(?:by|due|before|on)?\s*(\d{4}-\d{2}-\d{2})\b/i
  );
  if (isoMatch?.[1]) {
    due_date = isoMatch[1];
    cleaned = cleaned.replace(isoMatch[0], " ").replace(/\s+/g, " ").trim();
    return { due_date, cleaned };
  }

  const dmyMatch = cleaned.match(
    /\b(?:by|due|before|on)?\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/i
  );
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    due_date = `${dmyMatch[3]}-${month}-${day}`;
    cleaned = cleaned.replace(dmyMatch[0], " ").replace(/\s+/g, " ").trim();
    return { due_date, cleaned };
  }

  const monthNames =
    "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";
  const monthMap: Record<string, string> = {
    january: "01",
    jan: "01",
    february: "02",
    feb: "02",
    march: "03",
    mar: "03",
    april: "04",
    apr: "04",
    may: "05",
    june: "06",
    jun: "06",
    july: "07",
    jul: "07",
    august: "08",
    aug: "08",
    september: "09",
    sep: "09",
    sept: "09",
    october: "10",
    oct: "10",
    november: "11",
    nov: "11",
    december: "12",
    dec: "12",
  };
  const namedMatch = cleaned.match(
    new RegExp(
      `\\b(?:by|due|before|on)?\\s*(\\d{1,2})(?:st|nd|rd|th)?[\\s\\-]*(${monthNames})(?:[\\s\\-,]+(\\d{4}))?\\b`,
      "i"
    )
  );
  if (namedMatch) {
    const day = namedMatch[1].padStart(2, "0");
    const month = monthMap[namedMatch[2].toLowerCase()] ?? "01";
    const year = namedMatch[3] || today.slice(0, 4);
    due_date = `${year}-${month}-${day}`;
    cleaned = cleaned.replace(namedMatch[0], " ").replace(/\s+/g, " ").trim();
    return { due_date, cleaned };
  }

  const relative: Array<{ re: RegExp; resolve: () => string }> = [
    { re: /\bby\s+tomorrow\b|\btomorrow\b/i, resolve: () => addDays(today, 1) },
    { re: /\btoday\b/i, resolve: () => today },
    { re: /\bnext\s+week\b/i, resolve: () => addDays(today, 7) },
    { re: /\bend\s+of\s+(the\s+)?week\b/i, resolve: () => nextWeekday(today, 5) },
    { re: /\bby\s+monday\b|\bnext\s+monday\b/i, resolve: () => nextWeekday(today, 1) },
    { re: /\bby\s+tuesday\b|\bnext\s+tuesday\b/i, resolve: () => nextWeekday(today, 2) },
    { re: /\bby\s+wednesday\b|\bnext\s+wednesday\b/i, resolve: () => nextWeekday(today, 3) },
    { re: /\bby\s+thursday\b|\bnext\s+thursday\b/i, resolve: () => nextWeekday(today, 4) },
    { re: /\bby\s+friday\b|\bnext\s+friday\b/i, resolve: () => nextWeekday(today, 5) },
    { re: /\bby\s+saturday\b|\bnext\s+saturday\b/i, resolve: () => nextWeekday(today, 6) },
    { re: /\bby\s+sunday\b|\bnext\s+sunday\b/i, resolve: () => nextWeekday(today, 0) },
  ];

  for (const { re, resolve } of relative) {
    if (re.test(cleaned)) {
      due_date = resolve();
      cleaned = cleaned.replace(re, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }

  return { due_date, cleaned };
}

function extractAssignee(
  text: string,
  assignees: AiAssigneeCandidate[]
): { assignee_id: string; cleaned: string } {
  if (!assignees.length) return { assignee_id: "", cleaned: text };

  let cleaned = text;
  let assignee_id = "";

  const assignMatch = cleaned.match(
    /\b(?:assign(?:ed)?\s+to|for|@)\s+([A-Za-z][A-Za-z .'-]{1,60})/i
  );
  const hint = assignMatch?.[1]?.trim() ?? "";

  const haystacks = assignees.map((a) => ({
    id: a.id,
    tokens: `${a.name} ${a.email ?? ""}`.toLowerCase(),
    name: a.name,
  }));

  const tryMatch = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return "";
    const exact = haystacks.find(
      (h) => h.name.toLowerCase() === q || h.tokens.includes(q)
    );
    if (exact) return exact.id;
    const partial = haystacks.find(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        q.split(/\s+/).every((part) => h.tokens.includes(part))
    );
    return partial?.id ?? "";
  };

  if (hint) {
    assignee_id = tryMatch(hint);
    if (assignee_id) {
      cleaned = cleaned.replace(assignMatch![0], " ").replace(/\s+/g, " ").trim();
      return { assignee_id, cleaned };
    }
  }

  for (const a of assignees) {
    const name = a.name.trim();
    if (name.length < 2) continue;
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(cleaned)) {
      assignee_id = a.id;
      cleaned = cleaned.replace(re, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }

  return { assignee_id, cleaned };
}

function cleanTitle(text: string): string {
  let title = text
    .replace(/^[,.\-\s]+|[,.\-\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Strip leading verbs clutter for a tighter title when sentence is long
  if (title.length > 80) {
    title = title.slice(0, 80).replace(/\s+\S*$/, "").trim();
  }

  if (!title) title = "New task";
  if (title.length > 120) title = title.slice(0, 120).trim();

  // Title-case lightly if all lowercase
  if (title === title.toLowerCase() && title.length <= 60) {
    title = title.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return title;
}

function buildDescription(original: string, title: string): string {
  const pageMatch = original.match(
    /\b(?:create|build|make|add|implement)\s+(?:a\s+|an\s+|the\s+)?(.+?)\s+page\b/i
  );
  if (pageMatch?.[1]) {
    const topic = pageMatch[1].trim();
    const nice = topic.replace(/\b\w/g, (c) => c.toUpperCase());
    return `Design and implement the ${nice} page UI, form handling, validation, and related routes.`.slice(
      0,
      200
    );
  }

  const base = original.trim() || title;
  let description = base;
  if (!/[.!?]$/.test(description)) description = `${description}.`;
  if (description.length > 200) {
    description = `${description.slice(0, 197).trim()}...`;
  }
  return description;
}

function guessPriorityFromText(text: string): TaskPriority {
  if (/\b(urgent|asap|critical|blocker)\b/i.test(text)) return "urgent";
  if (/\b(high|important)\b/i.test(text)) return "high";
  if (/\b(low|minor|chore|nit)\b/i.test(text)) return "low";
  // Feature/page creation is usually at least medium–high impact
  if (/\b(create|build|implement|ship)\b/i.test(text)) return "high";
  return "medium";
}

/** Local parser — works without any API key. */
export function parseTaskHeuristic(input: ParseTaskInput): ParsedTaskFields {
  const today = todayIso(input.today);
  let text = input.text.trim().replace(/\s+/g, " ");

  const priorityResult = extractPriority(text);
  text = priorityResult.cleaned;

  const dueResult = extractDueDate(text, today);
  text = dueResult.cleaned;

  const assigneeResult = extractAssignee(text, input.assignees ?? []);
  text = assigneeResult.cleaned;

  // Remove leftover connectors like "by ," "priority ," after extractions
  text = text
    .replace(/\b(by|due|before|on|priority|assign(?:ed)?\s+to|for)\b\s*[,.]?/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[,.\-\s]+|[,.\-\s]+$/g, "")
    .trim();

  const title = cleanTitle(text || input.text.trim());
  const description = buildDescription(input.text.trim(), title);
  // Due date is required on create — default to +7 days within the project window.
  const due_date = clampDate(
    dueResult.due_date || addDays(today, 7),
    input.projectStartDate,
    input.projectDueDate
  );

  // If the note never stated a priority, infer from task type
  const priority =
    priorityResult.priority !== "medium" ||
    /\b(priority|urgent|asap|critical|high|low|medium)\b/i.test(input.text)
      ? priorityResult.priority
      : guessPriorityFromText(input.text);

  const ranked = rankAssigneesForAssignment(input.assignees ?? []);
  let assignee_id = assigneeResult.assignee_id;
  let assignee_reason = "";
  if (!assignee_id && ranked[0] && (ranked[0].workloadStatus !== "overloaded")) {
    assignee_id = ranked[0].id;
    assignee_reason = buildAssigneePickReason(ranked[0]);
  } else if (assignee_id) {
    const picked = ranked.find((r) => r.id === assignee_id);
    assignee_reason = picked
      ? buildAssigneePickReason(picked)
      : "Matched the person named in your note.";
  }

  return {
    title,
    description,
    priority,
    due_date,
    assignee_id,
    assignee_reason,
    source: "heuristic",
    aiConfigured: isAiConfigured(),
  };
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return JSON");
  }
}

async function parseTaskWithLlm(
  input: ParseTaskInput
): Promise<ParsedTaskFields> {
  const today = todayIso(input.today);
  const cleanedNote = normalizeRepeatedLetters(input.text);
  const ranked = rankAssigneesForAssignment(input.assignees ?? []).slice(0, 40);
  const topHint = ranked[0] ? buildAssigneePickReason(ranked[0]) : "";

  const assigneeLines = ranked
    .map(
      (a, index) =>
        `${index + 1}. id=${a.id} | ${a.name}` +
        `${a.email ? ` <${a.email}>` : ""}` +
        ` | open_tasks=${a.openTasks ?? 0}` +
        ` | load_points=${a.loadPoints ?? 0}` +
        ` | workload=${a.workloadStatus ?? "unknown"}` +
        ` | performance=${a.performanceScore ?? "n/a"}` +
        ` | fit_score=${a.rankScore}` +
        ` | why=${a.rankReasons.join("; ")}`
    )
    .join("\n");

  const system = `You are a task editor for a project management app. You MUST return corrected, professional English — never copy typos.

Return ONLY a JSON object with keys:
- title (string, 2-120 chars, concise, CORRECT spelling)
- description (string, <= 200 chars, useful implementation detail, CORRECT spelling)
- priority (one of: low, medium, high, urgent)
- due_date (YYYY-MM-DD or empty string)
- assignee_id (UUID from the candidate list, or empty string)
- assignee_reason (one short sentence explaining WHY that person was chosen using workload + performance data)

Hard rules:
- Today is ${today}.
- NEVER keep typo text. Examples: "cartttttt" → "cart"; "siing" → "signup"; "laut" → "logout"; "autheticaton" → "authentication".
- Title and description must be correctly spelled. Expand short notes into clear work items.
- Infer priority when missing: feature/page → high; bug/broken → urgent/high; chore/docs → low; else medium.
- due_date is REQUIRED (YYYY-MM-DD). If the note has no timing, use about 7 days from today.
- Resolve relative dates (tomorrow, Friday, next week) to YYYY-MM-DD.
${input.projectStartDate ? `- Prefer due_date on/after ${input.projectStartDate}.` : ""}
${input.projectDueDate ? `- Prefer due_date on/before ${input.projectDueDate}.` : ""}
- If the user names a person, prefer that assignee_id when they exist in the list.
- Otherwise pick the freest capable person: prefer workload=available, lower load_points/open_tasks, higher performance. Prefer the highest fit_score unless a named assignee overrides.
- assignee_reason must mention availability/load and performance briefly.
- Never invent UUIDs.`;

  const user = `Ranked candidates (best fit first):
${assigneeLines || "(none)"}

Suggested pick if note does not name anyone:
${topHint || "(no candidates)"}

User note (may contain typos):
${cleanedNote}`;

  const { content, provider } = await completeJsonPrompt({ system, user });
  const parsed = extractJsonObject(content) as Record<string, unknown>;
  const fallback = parseTaskHeuristic({ ...input, text: cleanedNote });

  const priority = PRIORITIES.includes(parsed.priority as TaskPriority)
    ? (parsed.priority as TaskPriority)
    : fallback.priority;

  let title =
    typeof parsed.title === "string" && parsed.title.trim().length >= 2
      ? parsed.title.trim().slice(0, 120)
      : fallback.title;
  // Reject titles that still look like the raw typo blob
  if (looksLikeUncorrectedTypo(cleanedNote, title)) {
    title = fallback.title;
  }

  let description =
    typeof parsed.description === "string"
      ? parsed.description.trim()
      : fallback.description;
  if (description.length > 200) description = `${description.slice(0, 197)}...`;

  let due_date =
    typeof parsed.due_date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(parsed.due_date)
      ? parsed.due_date
      : fallback.due_date;
  if (!due_date) due_date = addDays(today, 7);
  due_date = clampDate(due_date, input.projectStartDate, input.projectDueDate);

  const candidateIds = new Set(ranked.map((a) => a.id));
  let assignee_id =
    typeof parsed.assignee_id === "string" &&
    candidateIds.has(parsed.assignee_id)
      ? parsed.assignee_id
      : "";

  if (!assignee_id && ranked[0]?.workloadStatus !== "overloaded") {
    assignee_id = ranked[0]?.id ?? "";
  }

  const picked = ranked.find((r) => r.id === assignee_id);
  let assignee_reason =
    typeof parsed.assignee_reason === "string" &&
    parsed.assignee_reason.trim().length > 0
      ? parsed.assignee_reason.trim().slice(0, 280)
      : picked
        ? buildAssigneePickReason(picked)
        : "";

  return {
    title,
    description,
    priority,
    due_date,
    assignee_id,
    assignee_reason,
    source: "llm",
    provider,
    aiConfigured: true,
  };
}

function looksLikeUncorrectedTypo(note: string, title: string): boolean {
  const n = note.toLowerCase().replace(/[^a-z]/g, "");
  const t = title.toLowerCase().replace(/[^a-z]/g, "");
  if (!n || !t) return false;
  // If title still contains a long repeated-letter run, treat as bad
  if (/(.)\1{2,}/i.test(title)) return true;
  return n === t && /(.)\1{2,}/i.test(note);
}

/**
 * Real AI path when a provider key is configured.
 * Without a key, throws AI_NOT_CONFIGURED (API returns a clear setup message).
 */
export async function parseTaskFromText(
  input: ParseTaskInput
): Promise<ParsedTaskFields> {
  const text = normalizeRepeatedLetters(input.text);
  if (text.length < 3) {
    throw new Error("Type a short task note first (at least a few words).");
  }

  const requireLlm = input.requireLlm !== false;

  if (!isAiConfigured()) {
    if (requireLlm) {
      throw new Error("AI_NOT_CONFIGURED");
    }
    return parseTaskHeuristic({ ...input, text });
  }

  try {
    return await parseTaskWithLlm({ ...input, text });
  } catch (error) {
    console.error("[ai/parse-task] LLM failed:", error);
    if (requireLlm) {
      throw new Error(
        error instanceof Error && error.message.startsWith("AI provider")
          ? error.message
          : "AI_PROVIDER_FAILED"
      );
    }
    return parseTaskHeuristic({ ...input, text });
  }
}

export { isAiConfigured };
