"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  ClipboardList,
  Kanban,
  Lock,
  Sparkles,
  Target,
  Users,
  LineChart,
} from "lucide-react";
import { FadeIn } from "@/components/landing/motion";

const FEATURES = [
  {
    icon: CheckSquare,
    title: "Smart Task Management",
    desc: "Assign, prioritize, and move work through a clear review-ready workflow.",
  },
  {
    icon: Kanban,
    title: "Visual Task Board",
    desc: "See status at a glance with boards built for modern delivery teams.",
  },
  {
    icon: Target,
    title: "Sprint Planning",
    desc: "Plan focused sprints, track progress, and close work with confidence.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Keep admins, leads, and members aligned with shared project context.",
  },
  {
    icon: Bell,
    title: "Real Time Notifications",
    desc: "Stay updated when tasks start, need review, or require attention.",
  },
  {
    icon: Calendar,
    title: "Calendar View",
    desc: "Visualize due dates and delivery windows across your portfolio.",
  },
  {
    icon: BarChart3,
    title: "Performance Dashboard",
    desc: "Score quality, delivery, productivity, and reliability in one place.",
  },
  {
    icon: Activity,
    title: "Activity Timeline",
    desc: "Follow project and task history with a clean, searchable feed.",
  },
  {
    icon: Lock,
    title: "Role Based Permissions",
    desc: "Secure workspaces with admin, team lead, and member access control.",
  },
  {
    icon: Sparkles,
    title: "AI Assisted Suggestions",
    desc: "Surface smarter priorities and next actions as your team ships.",
  },
  {
    icon: ClipboardList,
    title: "Habit Tracking",
    desc: "Help members build consistency with streaks and personal routines.",
  },
  {
    icon: LineChart,
    title: "Analytics & Reports",
    desc: "Turn delivery data into clear insights for faster decision making.",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-cyan-300 uppercase">
            Features
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold text-white sm:text-4xl">
            Everything modern teams need to ship
          </h2>
          <p className="mt-4 text-slate-300">
            From task boards to performance insights — Taskora combines
            collaboration, visibility, and speed in one premium workspace.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.04}>
              <div className="group h-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-white/[0.08]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-cyan-400/20 text-cyan-200 ring-1 ring-white/10 transition group-hover:scale-105">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {feature.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
