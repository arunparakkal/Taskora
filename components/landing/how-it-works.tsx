"use client";

import { FadeIn } from "@/components/landing/motion";

const STEPS = [
  "Create Workspace",
  "Invite Team",
  "Create Projects",
  "Assign Tasks",
  "Track Progress",
  "Complete Sprint",
  "Analyze Performance",
  "Improve with AI",
] as const;

export function HowItWorksSection() {
  return (
    <section id="solutions" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-cyan-300 uppercase">
            How Taskora works
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold text-white sm:text-4xl">
            From empty workspace to delivery clarity
          </h2>
        </FadeIn>

        <div className="relative mt-14">
          <div className="absolute top-6 right-8 left-8 hidden h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent lg:block" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <FadeIn key={step} delay={i * 0.05}>
                <div className="relative rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
                    {i + 1}
                  </div>
                  <p className="mt-4 text-base font-semibold text-white">{step}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Step {i + 1} of a focused delivery loop built for modern teams.
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
