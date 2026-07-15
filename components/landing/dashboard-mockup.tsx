"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Calendar,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-indigo-500/30 via-cyan-400/10 to-emerald-400/20 blur-3xl" />

      <motion.div
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950/80 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl"
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs text-slate-400">Taskora Workspace</span>
        </div>

        <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[88px_1fr]">
          <aside className="space-y-3 border-r border-white/10 bg-slate-950/60 p-3">
            {[LayoutDashboard, FolderKanban, Users, Calendar, TrendingUp].map(
              (Icon, i) => (
                <div
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    i === 0
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              )
            )}
          </aside>

          <div className="space-y-3 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-400">Project overview</p>
                <p className="text-sm font-semibold text-white">Swiggy Ops Board</p>
              </div>
              <div className="relative rounded-full bg-white/5 p-2 text-slate-300">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Sprint", value: "78%", color: "from-indigo-500 to-blue-400" },
                { label: "Done", value: "42", color: "from-emerald-500 to-cyan-400" },
                { label: "Review", value: "6", color: "from-violet-500 to-indigo-400" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2.5"
                >
                  <p className="text-[10px] text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{stat.value}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full w-3/4 rounded-full bg-gradient-to-r ${stat.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-[11px] font-medium text-slate-300">Task board</p>
                <div className="space-y-1.5">
                  {["Partner onboarding", "Rider SLA review", "Campaign QA"].map(
                    (task, i) => (
                      <div
                        key={task}
                        className="flex items-center gap-2 rounded-xl bg-slate-950/50 px-2 py-1.5"
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${
                            i === 0 ? "text-emerald-400" : "text-slate-500"
                          }`}
                        />
                        <span className="truncate text-[11px] text-slate-200">
                          {task}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI assistant
                </div>
                <p className="text-[11px] leading-relaxed text-slate-200">
                  Suggest prioritizing “Rider SLA review” — 2 tasks are blocking
                  sprint close.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-300">
                  Completion trend
                </p>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="flex h-16 items-end gap-1.5">
                {[40, 55, 48, 70, 62, 82, 90].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600 to-cyan-400"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -left-3 top-16 hidden rounded-2xl border border-white/15 bg-slate-900/90 px-3 py-2 shadow-xl backdrop-blur sm:block"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] text-slate-400">Team online</p>
        <p className="text-xs font-semibold text-white">12 members</p>
      </motion.div>

      <motion.div
        className="absolute -right-2 bottom-20 hidden rounded-2xl border border-emerald-400/20 bg-slate-900/90 px-3 py-2 shadow-xl backdrop-blur sm:block"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] text-emerald-300">On-time delivery</p>
        <p className="text-xs font-semibold text-white">98%</p>
      </motion.div>
    </div>
  );
}
