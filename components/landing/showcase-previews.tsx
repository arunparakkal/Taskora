"use client";

import {
  CheckCircle2,
  Clock,
  FolderKanban,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Shell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-4 shadow-2xl shadow-indigo-500/10 sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_55%)]" />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-cyan-200">
            {label}
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            Live preview
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function MiniSidebar({ active = 0 }: { active?: number }) {
  const icons = [LayoutDashboard, FolderKanban, CheckCircle2, Users, TrendingUp];
  return (
    <div className="flex w-10 shrink-0 flex-col gap-1.5 border-r border-white/10 pr-2">
      {icons.map((Icon, i) => (
        <div
          key={i}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            i === active
              ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/40"
              : "bg-white/5 text-slate-500"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPreview() {
  return (
    <Shell label="Dashboard">
      <div className="flex gap-2">
        <MiniSidebar active={0} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-semibold text-white">Team overview</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { l: "Projects", v: "6", c: "text-cyan-300" },
              { l: "In review", v: "4", c: "text-violet-300" },
              { l: "Overdue", v: "2", c: "text-amber-300" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5"
              >
                <p className="text-[9px] text-slate-400">{s.l}</p>
                <p className={cn("text-sm font-bold", s.c)}>{s.v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
            <p className="mb-1.5 text-[9px] text-slate-400">Task pipeline</p>
            {[
              { n: "To Do", w: "w-[28%]" },
              { n: "In Progress", w: "w-[42%]" },
              { n: "Review", w: "w-[18%]" },
              { n: "Done", w: "w-[72%]" },
            ].map((r) => (
              <div key={r.n} className="mb-1 flex items-center gap-2">
                <span className="w-14 shrink-0 text-[8px] text-slate-500">{r.n}</span>
                <div className="h-1.5 flex-1 rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400",
                      r.w
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function ProjectsPreview() {
  const projects = [
    { key: "AUTH", name: "Auth Platform", pct: 72, status: "Active" },
    { key: "CART", name: "Checkout Revamp", pct: 45, status: "Active" },
    { key: "OPS", name: "Ops Dashboard", pct: 30, status: "Paused" },
  ];
  return (
    <Shell label="Projects">
      <div className="space-y-2">
        {projects.map((p) => (
          <div
            key={p.key}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-white">
                  <span className="text-cyan-300">[{p.key}]</span> {p.name}
                </p>
                <p className="mt-0.5 text-[9px] text-slate-500">Due Jul 28 · 12 tasks</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[8px] font-medium",
                  p.status === "Active"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-slate-500/20 text-slate-400"
                )}
              >
                {p.status}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400">{p.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function TaskDetailPreview() {
  return (
    <Shell label="Task Details">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-white">JWT refresh token flow</p>
          <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-medium text-orange-300">
            High
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
          Implement login, refresh tokens, middleware, and protected routes for
          the auth service.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
          <div className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="text-slate-500">Assignee</p>
            <p className="font-medium text-slate-200">Priya Shah</p>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="text-slate-500">Due date</p>
            <p className="font-medium text-slate-200">Jul 18, 2026</p>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="text-slate-500">Status</p>
            <p className="font-medium text-sky-300">In Progress</p>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="text-slate-500">Project</p>
            <p className="font-medium text-slate-200">[AUTH] Auth Platform</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-1.5">
          <Sparkles className="h-3 w-3 text-violet-300" />
          <span className="text-[9px] text-violet-200">Filled with AI Autofill</span>
        </div>
      </div>
    </Shell>
  );
}

export function TaskBoardPreview() {
  const cols = [
    {
      title: "To Do",
      color: "border-slate-500/30",
      tasks: ["Signup page UI", "API docs"],
    },
    {
      title: "In Progress",
      color: "border-sky-500/30",
      tasks: ["JWT flow"],
    },
    {
      title: "Review",
      color: "border-violet-500/30",
      tasks: ["Cart empty state"],
    },
  ];
  return (
    <Shell label="Task Board">
      <div className="grid grid-cols-3 gap-1.5">
        {cols.map((col) => (
          <div
            key={col.title}
            className={cn("rounded-xl border bg-white/[0.03] p-1.5", col.color)}
          >
            <p className="mb-1.5 px-1 text-[9px] font-semibold text-slate-300">
              {col.title}
            </p>
            {col.tasks.map((t) => (
              <div
                key={t}
                className="mb-1 rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1.5 text-[9px] text-slate-200"
              >
                {t}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function CalendarPreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const highlights = [2, 4, 9, 11, 16];
  return (
    <Shell label="Calendar">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-white">July 2026</p>
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[8px] text-slate-500">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex h-6 items-center justify-center rounded-md text-[9px]",
                highlights.includes(i)
                  ? "bg-indigo-500/30 font-semibold text-cyan-200 ring-1 ring-cyan-400/40"
                  : "text-slate-400"
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-2 py-1 text-[9px] text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Jul 18 — JWT flow due
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-2 py-1 text-[9px] text-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Jul 20 — Signup page due
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function TeamsPreview() {
  const members = [
    { name: "Priya", role: "Member", load: "Available" },
    { name: "Arun", role: "Member", load: "Moderate" },
    { name: "You", role: "Team Lead", load: "—" },
  ];
  return (
    <Shell label="Teams">
      <div className="space-y-1.5">
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5">
          <FolderKanban className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[10px] font-medium text-white">Platform Squad</span>
          <span className="ml-auto text-[9px] text-slate-500">8 members</span>
        </div>
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-[10px] font-bold text-white">
              {m.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-white">{m.name}</p>
              <p className="text-[8px] text-slate-500">{m.role}</p>
            </div>
            {m.load !== "—" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[8px] font-medium",
                  m.load === "Available"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-blue-500/20 text-blue-300"
                )}
              >
                {m.load}
              </span>
            )}
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function AnalyticsPreview() {
  const bars = [40, 65, 55, 80, 70, 92, 85, 78];
  return (
    <Shell label="Analytics">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
        <p className="mb-1 text-[10px] font-semibold text-white">Tasks completed / week</p>
        <p className="mb-2 text-[9px] text-slate-500">Last 8 weeks · team avg 12</p>
        <div className="flex h-20 items-end gap-1">
          {bars.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-cyan-400"
                style={{ height: `${h}%` }}
              />
              <span className="text-[7px] text-slate-600">W{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px]">
          <div className="rounded-lg bg-emerald-500/10 px-2 py-1 text-emerald-300">
            +18% throughput
          </div>
          <div className="rounded-lg bg-violet-500/10 px-2 py-1 text-violet-300">
            94% on-time
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function PerformancePreview() {
  const pillars = [
    { n: "Quality", p: 88, w: 35 },
    { n: "Delivery", p: 82, w: 25 },
    { n: "Productivity", p: 76, w: 20 },
    { n: "Reliability", p: 91, w: 15 },
  ];
  return (
    <Shell label="Performance">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="url(#perfGrad)"
              strokeWidth="3"
              strokeDasharray="72 100"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="perfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute text-xs font-bold text-white">84</span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {pillars.map((p) => (
            <div key={p.n} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[8px] text-slate-400">{p.n}</span>
              <div className="h-1 flex-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400"
                  style={{ width: `${p.p}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-500">{p.w}%</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-[9px] text-emerald-400">Very Good · This month</p>
    </Shell>
  );
}

const PREVIEW_BY_BADGE: Record<string, () => React.ReactNode> = {
  Dashboard: DashboardPreview,
  Projects: ProjectsPreview,
  "Task Details": TaskDetailPreview,
  "Task Board": TaskBoardPreview,
  Calendar: CalendarPreview,
  Teams: TeamsPreview,
  Analytics: AnalyticsPreview,
  Performance: PerformancePreview,
};

export function ShowcasePreview({ badge }: { badge: string }) {
  const Preview = PREVIEW_BY_BADGE[badge] ?? DashboardPreview;
  return <Preview />;
}
