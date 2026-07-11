"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HabitIcon } from "@/components/habits/habit-icon";
import type { HabitAchievement } from "@/lib/habits/calculate-habits";
import { cn } from "@/lib/utils";

type Filter = "all" | "unlocked" | "locked";

const CATEGORY_LABELS: Record<HabitAchievement["category"], string> = {
  streak: "Streak",
  consistency: "Consistency",
  milestone: "Milestone",
};

export function AchievementsView({
  achievements,
  unlockedCount,
  totalCount,
}: {
  achievements: HabitAchievement[];
  unlockedCount: number;
  totalCount: number;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    if (filter === "unlocked") return achievements.filter((a) => a.unlocked);
    if (filter === "locked") return achievements.filter((a) => !a.unlocked);
    return achievements;
  }, [achievements, filter]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 py-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/member/habits"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-400 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Habits
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Achievements
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Unlock badges as you build consistency. Track progress toward the next one.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300">
          <Trophy className="h-4 w-4" />
          {unlockedCount} / {totalCount} unlocked
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all", label: "All" },
            { id: "unlocked", label: "Unlocked" },
            { id: "locked", label: "Locked" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === item.id
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-[var(--card)] dark:text-slate-300 dark:hover:bg-white/5"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="border-dashed border-slate-200 dark:border-slate-700">
          <CardContent className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No achievements in this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((achievement) => {
            const percent = Math.min(
              100,
              Math.round((achievement.progress / achievement.goal) * 100)
            );
            return (
              <Card
                key={achievement.id}
                className={cn(
                  "shadow-sm",
                  achievement.unlocked
                    ? "border-violet-200 bg-gradient-to-b from-violet-50/80 to-white dark:border-violet-500/35 dark:from-violet-500/20 dark:to-[var(--card)]"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-[var(--card)]"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
                        achievement.unlocked
                          ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25 dark:bg-violet-500 dark:shadow-violet-500/20"
                          : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                      )}
                    >
                      {achievement.unlocked ? (
                        <HabitIcon name={achievement.icon} className="h-6 w-6" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {achievement.title}
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400">
                          {CATEGORY_LABELS[achievement.category]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {achievement.description}
                      </p>
                      <p className="mt-2 text-xs font-medium text-violet-600 dark:text-violet-300">
                        {achievement.requirement}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {achievement.unlocked
                          ? "Completed"
                          : `${achievement.progress} / ${achievement.goal}`}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {percent}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          achievement.unlocked
                            ? "bg-violet-500"
                            : "bg-violet-300 dark:bg-violet-500/50"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
