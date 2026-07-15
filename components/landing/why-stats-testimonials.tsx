"use client";

import { Check } from "lucide-react";
import { AnimatedCounter, FadeIn } from "@/components/landing/motion";

const BENEFITS = [
  "Clean Modern Interface",
  "AI Assisted Productivity",
  "Faster Workflow",
  "Better Analytics",
  "Built for Modern Teams",
  "Easy Learning Curve",
  "Powerful Role Management",
  "Beautiful Dashboard",
  "Seamless Collaboration",
  "Enterprise Ready Security",
] as const;

const STATS = [
  { value: 10000, suffix: "+", label: "Tasks Managed" },
  { value: 500, suffix: "+", label: "Projects" },
  { value: 98, suffix: "%", label: "On Time Delivery" },
  { value: 99.9, suffix: "%", label: "Uptime" },
] as const;

const TESTIMONIALS = [
  {
    name: "Ananya Mehta",
    role: "Engineering Manager",
    company: "Northwave Labs",
    quote:
      "Taskora gave our team one place for planning, reviews, and performance. Delivery meetings got shorter overnight.",
  },
  {
    name: "Rahul Iyer",
    role: "Product Lead",
    company: "Orbit Commerce",
    quote:
      "The role-based workflows and dashboards feel premium. We finally see who is blocked and why.",
  },
  {
    name: "Sofia Alvarez",
    role: "Founder",
    company: "PixelCraft Studio",
    quote:
      "Clean UI, fast onboarding, and clarity across projects. Exactly what a growing product team needs.",
  },
] as const;

export function WhyStatsTestimonials() {
  return (
    <>
      <section id="about" className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-cyan-300 uppercase">
              Why Taskora
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold text-white sm:text-4xl">
              Built to feel premium and ship faster
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {BENEFITS.map((benefit, i) => (
              <FadeIn key={benefit} delay={i * 0.03}>
                <div className="flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-medium text-slate-100">{benefit}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.05}>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-6 text-center backdrop-blur-xl">
                <p className="font-[family-name:var(--font-landing-display)] text-3xl font-semibold text-white sm:text-4xl">
                  {stat.suffix === "%" && stat.value === 99.9 ? (
                    <>99.9%</>
                  ) : (
                    <AnimatedCounter
                      value={Math.floor(stat.value)}
                      suffix={stat.suffix}
                    />
                  )}
                </p>
                <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn className="mx-auto mt-6 max-w-3xl px-4 text-center text-sm text-slate-400">
          24/7 cloud access · AI-powered productivity workflows · continuous delivery visibility
        </FadeIn>
      </section>

      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-cyan-300 uppercase">
              Testimonials
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold text-white sm:text-4xl">
              Loved by teams who care about craft
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((item, i) => (
              <FadeIn key={item.name} delay={i * 0.08}>
                <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-1">
                  <div className="mb-4 flex gap-1 text-amber-300">
                    {Array.from({ length: 5 }).map((_, star) => (
                      <span key={star}>★</span>
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-slate-200">
                    “{item.quote}”
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white">
                      {item.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.role} · {item.company}
                      </p>
                    </div>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
