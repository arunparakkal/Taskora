"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Star } from "lucide-react";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pb-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-[120px]" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-cyan-400/15 blur-[100px]" />
        <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-violet-500/15 blur-[90px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <motion.p
            className="mb-4 font-[family-name:var(--font-landing-display)] text-sm font-semibold tracking-[0.2em] text-cyan-300/90 uppercase"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Taskora
          </motion.p>
          <motion.h1
            className="font-[family-name:var(--font-landing-display)] text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            Manage Projects. Track Tasks. Deliver Faster.
          </motion.h1>
          <motion.p
            className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            Taskora helps software teams plan projects, organize work, assign
            tasks, collaborate in real time, monitor performance, and deliver
            products faster with AI-assisted workflows.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
          >
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:brightness-110"
            >
              Get Started Free
            </Link>
            <a
              href="#showcase"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch Demo
            </a>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-0.5 text-amber-300">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <span className="text-slate-400">
              Trusted by growing startups and development teams
            </span>
          </motion.div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}
