"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { RoleBadge, PriorityBadge } from "@/components/shared/badges";
import { PerformanceCard } from "@/components/performance/performance-card";
import { PerformanceLevelBadge } from "@/components/performance/performance-level-badge";
import { LEVEL_STYLES } from "@/components/performance/performance-level-badge";
import { cn, formatDate } from "@/lib/utils";
import type { BestPerformerSnapshot } from "@/lib/data/performance";

export function BestPerformerWidget({
  data,
  performanceHref,
}: {
  data: BestPerformerSnapshot | null;
  performanceHref: string;
}) {
  const [open, setOpen] = useState(false);

  if (!data) {
    return (
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            Best performer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No performance data yet. Scores appear once members complete tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { entry, periodLabel, completedTasks } = data;
  const { profile, performance, teamName } = entry;
  const name = profile.full_name || profile.email;
  const style = LEVEL_STYLES[performance.level];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left"
      >
        <Card
          className={cn(
            "group relative overflow-hidden border shadow-sm transition-all",
            "border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40",
            "hover:shadow-md hover:shadow-amber-100/50",
            "dark:border-amber-500/25 dark:from-amber-950/50 dark:via-slate-900 dark:to-slate-950",
            "dark:hover:border-amber-500/40 dark:hover:shadow-lg dark:hover:shadow-amber-500/10"
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-500/20"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-8 left-1/3 h-24 w-24 rounded-full bg-orange-400/10 blur-2xl dark:bg-orange-500/10"
          />

          <CardHeader className="relative pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20">
                  <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </span>
                <span className="text-slate-900 dark:text-amber-50">
                  Best performer
                </span>
              </span>
              <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                {periodLabel}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center gap-4">
              <div className="relative">
                <EntityAvatar name={name} size="lg" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] shadow-sm ring-2 ring-white dark:bg-amber-500 dark:ring-slate-900">
                  <Trophy className="h-2.5 w-2.5 text-amber-950" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                  {name}
                </p>
                {teamName && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {teamName}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RoleBadge role={profile.role} />
                  <PerformanceLevelBadge level={performance.level} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 rounded-xl bg-white/60 px-3 py-2 dark:bg-slate-800/60">
                <span
                  className={cn(
                    "text-3xl font-bold tabular-nums leading-none",
                    style.text
                  )}
                >
                  {Math.round(performance.overall)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  / 100
                </span>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-amber-500/50" />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {performance.stats.completed}
              </span>{" "}
              tasks completed ·{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {performance.stats.onTimeRate}%
              </span>{" "}
              on-time · Tap for full breakdown
            </p>
          </CardContent>
        </Card>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              {name}
            </DialogTitle>
            <DialogDescription>
              {teamName ? `${teamName} · ` : ""}
              {periodLabel} · Score {Math.round(performance.overall)}/100
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge role={profile.role} />
              <PerformanceLevelBadge level={performance.level} />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {profile.email}
              </span>
            </div>

            <PerformanceCard
              performance={performance}
              periodLabel={periodLabel}
            />

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Completed tasks ({completedTasks.length})
              </h3>
              {completedTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                  No tasks completed in {periodLabel.toLowerCase()}.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                        <TableHead>Task</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead className="text-right">Quality</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {task.title}
                            </p>
                            {task.projectKey && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                [{task.projectKey}] {task.projectName}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <PriorityBadge
                              priority={
                                task.priority as
                                  | "low"
                                  | "medium"
                                  | "high"
                                  | "urgent"
                              }
                            />
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                            {formatDate(task.completedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 text-xs">
                              {task.onTime ? (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  On time
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <XCircle className="h-3.5 w-3.5" />
                                  Late
                                </span>
                              )}
                              {task.firstPass && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                  First pass
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button variant="outline" asChild>
                <Link href={performanceHref}>View all performance</Link>
              </Button>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
