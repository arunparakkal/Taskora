"use client";

import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteHabitButton } from "@/components/habits/delete-habit-button";
import { HabitIcon } from "@/components/habits/habit-icon";
import { getHabitColorClasses } from "@/lib/habits/constants";
import type { HabitStreakDetail } from "@/lib/habits/calculate-habits";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<
  HabitStreakDetail["status"],
  { label: string; className: string }
> = {
  on_fire: {
    label: "On fire",
    className:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  },
  active: {
    label: "Active",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  },
  at_risk: {
    label: "At risk",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  },
  broken: {
    label: "Broken",
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
};

export function StreaksView({ streaks }: { streaks: HabitStreakDetail[] }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 py-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/member/habits"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Habits
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            All Streaks
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Current streak, personal best, and this week&apos;s check-ins for every habit.
          </p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300">
          <span className="inline-flex items-center gap-2">
            <Flame className="h-4 w-4" />
            {streaks.filter((s) => s.currentStreak > 0).length} active streaks
          </span>
        </div>
      </div>

      {streaks.length === 0 ? (
        <Card className="border-dashed border-slate-200 dark:border-slate-700">
          <CardContent className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No habits yet.{" "}
            <Link
              href="/member/habits"
              className="font-medium text-violet-600 dark:text-violet-400"
            >
              Add a habit
            </Link>{" "}
            to start building streaks.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {streaks.map((item) => {
            const color = getHabitColorClasses(item.color);
            const status = STATUS_LABELS[item.status];
            return (
              <Card
                key={item.habitId}
                className="border-slate-200 shadow-sm dark:border-slate-800"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                          color.soft
                        )}
                      >
                        <HabitIcon name={item.icon} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base font-semibold">
                          {item.title}
                        </CardTitle>
                        <p className="mt-0.5 text-xs capitalize text-slate-500 dark:text-slate-400">
                          {item.frequency.replace("_", " ")} ·{" "}
                          {item.totalCompletions} completion
                          {item.totalCompletions !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                      <DeleteHabitButton
                        habitId={item.habitId}
                        habitTitle={item.title}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Current streak
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {item.currentStreak} days
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Best streak
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {item.bestStreak} days
                      </p>
                    </div>
                    <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-1 dark:bg-white/5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Toward best / 30
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className={cn("h-full rounded-full", color.bar)}
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      This week
                    </p>
                    <div className="flex gap-2">
                      {item.weekDots.map((dot) => (
                        <div
                          key={dot.dateKey}
                          className="flex flex-1 flex-col items-center gap-1.5"
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold",
                              !dot.scheduled
                                ? "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600"
                                : dot.completed
                                  ? "bg-emerald-500 text-white"
                                  : "border-2 border-slate-200 bg-white text-slate-400 dark:border-slate-600 dark:bg-transparent dark:text-slate-500"
                            )}
                            title={dot.dateKey}
                          >
                            {dot.completed ? "✓" : dot.scheduled ? "" : "–"}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {dot.label}
                          </span>
                        </div>
                      ))}
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
