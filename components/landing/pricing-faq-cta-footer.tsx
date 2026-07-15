"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { FadeIn } from "@/components/landing/motion";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    highlight: false,
    features: [
      "Unlimited Tasks",
      "5 Team Members",
      "Visual Task Board",
      "Calendar",
    ],
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    highlight: true,
    features: [
      "Unlimited Members",
      "Analytics",
      "Sprint Planning",
      "Performance Dashboard",
      "AI Features",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    highlight: false,
    features: [
      "SSO",
      "Advanced Security",
      "Unlimited Everything",
      "Dedicated Support",
      "Custom Integrations",
    ],
  },
] as const;

const FAQS = [
  {
    q: "Is there a free plan?",
    a: "Yes. Starter is free and includes unlimited tasks, a visual board, calendar, and up to 5 team members.",
  },
  {
    q: "Does Taskora support AI?",
    a: "Taskora is designed for AI-assisted productivity workflows — from smarter prioritization cues to future suggestion features in your workspace.",
  },
  {
    q: "Can I invite unlimited members?",
    a: "Pro and Enterprise support unlimited members. Starter includes up to 5 seats.",
  },
  {
    q: "Is mobile supported?",
    a: "Yes. Taskora is fully responsive across desktop, tablet, and mobile browsers.",
  },
  {
    q: "Does it support agile workflows?",
    a: "Yes — from boards and sprints to review cycles and performance insights built for agile teams.",
  },
  {
    q: "Can I customize my workspace?",
    a: "You can organize teams, projects, roles, and workflows to match how your organization delivers software.",
  },
] as const;

export function PricingFaqCtaFooter() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section id="pricing" className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-cyan-300 uppercase">
              Pricing
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold text-white sm:text-4xl">
              Simple plans for ambitious teams
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.08}>
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-3xl border p-6 backdrop-blur-xl",
                    plan.highlight
                      ? "border-indigo-400/40 bg-gradient-to-b from-indigo-500/20 to-slate-950/80 shadow-2xl shadow-indigo-500/20"
                      : "border-white/10 bg-white/5"
                  )}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-3 py-1 text-[11px] font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="mt-3 font-[family-name:var(--font-landing-display)] text-4xl font-semibold text-white">
                    {plan.price}
                    {"period" in plan && plan.period ? (
                      <span className="text-base font-normal text-slate-400">
                        {plan.period}
                      </span>
                    ) : null}
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-slate-200"
                      >
                        <Check className="h-4 w-4 text-emerald-300" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={cn(
                      "mt-8 block rounded-full px-4 py-2.5 text-center text-sm font-semibold transition",
                      plan.highlight
                        ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white hover:brightness-110"
                        : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                    )}
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="font-[family-name:var(--font-landing-display)] text-3xl font-semibold text-white">
              Frequently asked questions
            </h2>
          </FadeIn>
          <div className="mt-10 space-y-3">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <FadeIn key={item.q} delay={i * 0.03}>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                    >
                      <span className="text-sm font-semibold text-white">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-slate-400 transition",
                          open && "rotate-180"
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <p className="border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-slate-300">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden rounded-[2rem] border border-indigo-400/20 bg-gradient-to-br from-indigo-600/40 via-slate-950 to-cyan-500/20 px-6 py-14 text-center shadow-2xl shadow-indigo-500/20 sm:px-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15),transparent_55%)]" />
              <div className="relative">
                <h2 className="font-[family-name:var(--font-landing-display)] text-3xl font-semibold text-white sm:text-4xl">
                  Ready to Build Better Software Together?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-slate-200">
                  Start managing projects smarter with Taskora and experience
                  the future of team collaboration.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Get Started Free
                  </Link>
                  <a
                    href="#contact"
                    className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                  >
                    Book a Demo
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer id="contact" className="border-t border-white/10 pb-10 pt-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div className="lg:col-span-1">
            <p className="font-[family-name:var(--font-landing-display)] text-lg font-semibold text-white">
              Taskora
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              A modern productivity platform for teams that plan projects, track
              tasks, and deliver with clarity.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#showcase" className="hover:text-white">Documentation</a></li>
              <li><a href="#about" className="hover:text-white">Blog</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><a href="#contact" className="hover:text-white">Careers</a></li>
              <li><a href="#contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><a href="#contact" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#contact" className="hover:text-white">Terms</a></li>
            </ul>
            <div className="mt-5 flex gap-3 text-slate-400">
              {["X", "in", "GH"].map((s) => (
                <span
                  key={s}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xs font-semibold hover:text-white"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-7xl px-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Taskora. All rights reserved.
        </p>
      </footer>
    </>
  );
}
