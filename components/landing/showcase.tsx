"use client";

import { FadeIn } from "@/components/landing/motion";
import { ShowcasePreview } from "@/components/landing/showcase-previews";

const SHOWCASES = [
  {
    title: "Command-center dashboard",
    body: "Monitor projects, pipeline health, and team load from a single premium overview.",
    badge: "Dashboard",
  },
  {
    title: "Projects that stay organized",
    body: "Create projects, set dates, and keep every workstream tied to the right team.",
    badge: "Projects",
  },
  {
    title: "Task detail that drives decisions",
    body: "Status, priority, assignees, and review context in a polished detail experience.",
    badge: "Task Details",
  },
  {
    title: "Visual boards for delivery",
    body: "Move work from todo to review with a board your team can understand instantly.",
    badge: "Task Board",
  },
  {
    title: "Calendar-aware planning",
    body: "Keep due dates visible so deadlines never surprise your sprint.",
    badge: "Calendar",
  },
  {
    title: "Team management built in",
    body: "Invite leads and members, manage roles, and keep ownership clear.",
    badge: "Teams",
  },
  {
    title: "Analytics that matter",
    body: "Track throughput and outcomes with charts designed for action — not noise.",
    badge: "Analytics",
  },
  {
    title: "Performance that tells a story",
    body: "Weighted scoring across quality, delivery, productivity, and reliability.",
    badge: "Performance",
  },
] as const;

export function ShowcaseSection() {
  return (
    <section id="showcase" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-cyan-300 uppercase">
            Product showcase
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold text-white sm:text-4xl">
            See Taskora in action
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Real screens from the app — explore dashboards, tasks, teams, and
            performance without leaving this page.
          </p>
        </FadeIn>

        {SHOWCASES.map((item, index) => (
          <div
            key={item.title}
            className={`grid items-center gap-10 lg:grid-cols-2 ${
              index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <FadeIn>
              <p className="text-sm font-semibold text-indigo-300">{item.badge}</p>
              <h3 className="mt-2 font-[family-name:var(--font-landing-display)] text-2xl font-semibold text-white sm:text-3xl">
                {item.title}
              </h3>
              <p className="mt-3 max-w-md text-slate-300">{item.body}</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <ShowcasePreview badge={item.badge} />
            </FadeIn>
          </div>
        ))}
      </div>
    </section>
  );
}
