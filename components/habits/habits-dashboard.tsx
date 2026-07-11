"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Flame,
  Lightbulb,
  Lock,
  Plus,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AddHabitDialog } from "@/components/habits/add-habit-dialog";
import { DeleteHabitButton } from "@/components/habits/delete-habit-button";
import { HabitIcon } from "@/components/habits/habit-icon";
import {
  getGreetingName,
} from "@/lib/habits/date-utils";
import {
  getHabitProgressLabel,
  getHabitStreak,
  isCompletedOn,
  type HabitsDashboardData,
} from "@/lib/habits/calculate-habits";
import { getHabitColorClasses, usesProgressCounter } from "@/lib/habits/constants";
import { cn } from "@/lib/utils";

export function HabitsDashboard({
  data,
  memberName,
}: {
  data: HabitsDashboardData;
  memberName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const greeting = getGreetingName(new Date().getHours());
  const firstName = memberName.split(" ")[0] || memberName;

  async function toggleHabit(habitId: string, increment = false) {
    setTogglingId(habitId);
    try {
      const res = await fetch(`/api/member/habits/${habitId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to update habit");
      router.refresh();
    } catch (err) {
      toast({
        title: "Could not update habit",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  }

  const todayHabits = data.habits;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {greeting}, {firstName}!
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Let&apos;s build some great habits today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300">
            <Flame className="h-4 w-4" />
            {data.stats.currentStreak} day streak
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-[var(--card)] dark:text-slate-300">
            <Calendar className="h-4 w-4 text-violet-500 dark:text-violet-400" />
            Today
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Habits Completed"
          value={`${data.stats.completedToday} / ${data.stats.scheduledToday}`}
          subtext="Keep it up!"
          icon={CheckCircle2}
          iconClass="text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/15"
        />
        <StatTile
          label="Current Streak"
          value={`${data.stats.currentStreak} days`}
          subtext={`Best: ${data.stats.bestStreak} days`}
          icon={Flame}
          iconClass="text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/15"
        />
        <StatTile
          label="Success Rate"
          value={`${data.stats.successRate}%`}
          subtext="This month"
          icon={Target}
          iconClass="text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/15"
        />
        <StatTile
          label="Total Habits"
          value={String(data.stats.totalActive)}
          subtext="Active habits"
          icon={Star}
          iconClass="text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/15"
        />
      </div>

      {/* Middle row */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Today's habits */}
        <Card className="border-slate-200 shadow-sm xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Today&apos;s Habits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {todayHabits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                No habits yet. Add your first habit below.
              </div>
            ) : (
              todayHabits.map((habit) => {
                const done = isCompletedOn(habit, data.todayKey);
                const streak = getHabitStreak(habit);
                const progress = getHabitProgressLabel(habit, data.todayKey);
                const hasTarget = usesProgressCounter(habit);
                const completion = habit.completions.find(
                  (c) => c.completed_on === data.todayKey
                );
                const canIncrement =
                  hasTarget &&
                  (completion?.current_value ?? 0) < (habit.target_value ?? 0);

                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <button
                      type="button"
                      disabled={togglingId === habit.id}
                      onClick={() =>
                        toggleHabit(habit.id, Boolean(canIncrement && !done))
                      }
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 bg-white hover:border-violet-400 dark:border-slate-600 dark:bg-transparent dark:hover:border-violet-400"
                      )}
                      aria-label={done ? "Mark incomplete" : "Mark complete"}
                    >
                      {done && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          done
                            ? "text-slate-500 line-through dark:text-slate-500"
                            : "text-slate-900 dark:text-slate-100"
                        )}
                      >
                        {habit.title}
                      </p>
                      <p className="text-xs text-slate-400">{progress}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                      <Flame className="h-3.5 w-3.5" />
                      {streak}
                    </div>
                    <DeleteHabitButton
                      habitId={habit.id}
                      habitTitle={habit.title}
                    />
                  </div>
                );
              })
            )}
            <AddHabitDialog
              trigger={
                <button
                  type="button"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Habit
                </button>
              }
            />
          </CardContent>
        </Card>

        {/* Weekly progress */}
        <Card className="border-slate-200 shadow-sm xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-semibold">Weekly Progress</CardTitle>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
              This Week
            </span>
          </CardHeader>
          <CardContent>
            <WeeklyBarChart points={data.weeklyProgress} />
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">
                Weekly Average:{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {data.weeklyAverage}%
                </span>
              </span>
              <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                Great consistency!
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Habit streaks */}
        <Card className="border-slate-200 shadow-sm xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-semibold">Habit Streaks</CardTitle>
            <Link
              href="/member/habits/streaks"
              className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.habitStreaks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Streaks appear once you add habits.</p>
            ) : (
              data.habitStreaks.slice(0, 5).map((item) => {
                const color = getHabitColorClasses(item.color);
                return (
                  <div key={item.habitId} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            color.soft
                          )}
                        >
                          <HabitIcon name={item.icon} className="h-4 w-4" />
                        </span>
                        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {item.title}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {item.streak} days
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={cn("h-full rounded-full transition-all", color.bar)}
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-semibold">Monthly Progress</CardTitle>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
              This Month
            </span>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart points={data.monthlyProgress} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-semibold">Achievements</CardTitle>
            <Link
              href="/member/habits/achievements"
              className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {data.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={cn(
                    "flex flex-col items-center rounded-2xl border p-4 text-center",
                    achievement.unlocked
                      ? "border-violet-200 bg-violet-50/50 dark:border-violet-500/35 dark:bg-violet-500/15"
                      : "border-slate-200 bg-slate-50 opacity-70 dark:border-slate-700 dark:bg-slate-800/50"
                  )}
                >
                  <div
                    className={cn(
                      "mb-3 flex h-14 w-14 items-center justify-center rounded-full",
                      achievement.unlocked
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                        : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                    )}
                  >
                    {achievement.unlocked ? (
                      <HabitIcon name={achievement.icon} className="h-6 w-6" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {achievement.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                    {achievement.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-violet-600 dark:text-violet-300">
                    {achievement.requirement}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insight banner */}
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 via-white to-white shadow-sm dark:border-violet-500/30 dark:from-violet-500/15 dark:via-[var(--card)] dark:to-[var(--card)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/25">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Insight</p>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                {data.insight.message}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-500/35 dark:text-violet-300 dark:hover:bg-violet-500/10"
            asChild
          >
            <Link href="/member/habits/achievements">View Insights</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  subtext,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardContent className="flex items-start gap-4 p-5">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {subtext}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyBarChart({
  points,
}: {
  points: HabitsDashboardData["weeklyProgress"];
}) {
  const max = 100;
  return (
    <div className="flex h-48 items-end justify-between gap-2 px-1">
      {points.map((point) => (
        <div key={point.dateKey} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
            {point.percent}%
          </span>
          <div className="relative flex h-36 w-full items-end justify-center">
            <div
              className="w-full max-w-[2.5rem] rounded-t-lg bg-violet-500 transition-all"
              style={{ height: `${Math.max(4, (point.percent / max) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function MonthlyLineChart({
  points,
}: {
  points: HabitsDashboardData["monthlyProgress"];
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No data yet this month
      </div>
    );
  }

  const width = 560;
  const height = 180;
  const padding = 24;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const coords = points.map((point, index) => {
    const x =
      padding + (points.length === 1 ? chartW / 2 : (index / (points.length - 1)) * chartW);
    const y = padding + chartH - (point.percent / 100) * chartH;
    return { ...point, x, y };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full min-w-[320px]">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = padding + chartH - (tick / 100) * chartH;
          return (
            <g key={tick}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text x={4} y={y + 4} className="fill-slate-400 text-[10px]">
                {tick}%
              </text>
            </g>
          );
        })}
        <polyline
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyline}
        />
        {coords.map((point) => (
          <circle
            key={point.dateKey}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#8b5cf6"
            stroke="white"
            strokeWidth="2"
          />
        ))}
        {last && (
          <g>
            <rect
              x={last.x - 22}
              y={last.y - 30}
              width="44"
              height="22"
              rx="8"
              fill="#7c3aed"
            />
            <text
              x={last.x}
              y={last.y - 15}
              textAnchor="middle"
              className="fill-white text-[11px] font-semibold"
            >
              {last.percent}%
            </text>
          </g>
        )}
        {coords.map((point) => (
          <text
            key={`${point.dateKey}-label`}
            x={point.x}
            y={height - 4}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
