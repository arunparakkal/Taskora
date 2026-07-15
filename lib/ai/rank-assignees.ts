/**
 * Transparent ranking for AI Autofill assignee suggestion.
 *
 * Score = availability (0–40) + low workload (0–35) + performance (0–25)
 * Higher is better. “Free / least loaded / strong performer” wins.
 */

export type RankableAssignee = {
  id: string;
  name: string;
  email?: string | null;
  openTasks?: number;
  loadPoints?: number;
  workloadStatus?: string;
  performanceScore?: number | null;
};

export type RankedAssignee = RankableAssignee & {
  rankScore: number;
  rankReasons: string[];
};

const STATUS_POINTS: Record<string, number> = {
  available: 40,
  moderate: 22,
  at_capacity: 8,
  overloaded: 0,
};

export function rankAssigneesForAssignment(
  candidates: RankableAssignee[]
): RankedAssignee[] {
  if (!candidates.length) return [];

  const loads = candidates.map((c) => c.loadPoints ?? 0);
  const maxLoad = Math.max(...loads, 1);

  const ranked = candidates.map((c) => {
    const reasons: string[] = [];
    const status = (c.workloadStatus ?? "moderate").toLowerCase();
    const availability = STATUS_POINTS[status] ?? 18;

    if (status === "available") {
      reasons.push("currently available (lowest load band)");
    } else if (status === "moderate") {
      reasons.push("moderate workload");
    } else if (status === "at_capacity") {
      reasons.push("near capacity");
    } else if (status === "overloaded") {
      reasons.push("already overloaded");
    }

    const loadPoints = c.loadPoints ?? 0;
    const openTasks = c.openTasks ?? 0;
    // Fewer load points → higher score
    const workloadScore = Math.round((1 - loadPoints / maxLoad) * 35);
    reasons.push(
      `open tasks ${openTasks}, load ${loadPoints} (lower is freer)`
    );

    const perf =
      typeof c.performanceScore === "number" && !Number.isNaN(c.performanceScore)
        ? Math.max(0, Math.min(100, c.performanceScore))
        : null;
    const performanceScore = perf == null ? 12 : Math.round((perf / 100) * 25);
    if (perf != null) {
      reasons.push(`performance score ${perf}/100 this month`);
    } else {
      reasons.push("performance data unavailable (neutral weight)");
    }

    return {
      ...c,
      rankScore: availability + workloadScore + performanceScore,
      rankReasons: reasons,
    };
  });

  return ranked.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    return (a.loadPoints ?? 0) - (b.loadPoints ?? 0);
  });
}

export function buildAssigneePickReason(top: RankedAssignee): string {
  return `Suggested ${top.name} (score ${top.rankScore}/100): ${top.rankReasons.join("; ")}.`;
}
