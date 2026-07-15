"use client";

import { FadeIn } from "@/components/landing/motion";

const LOGOS = [
  "Northwave",
  "Orbit",
  "PixelCraft",
  "Lumen",
  "Stackly",
  "NovaOps",
] as const;

export function TrustedSection() {
  return (
    <section className="relative border-y border-white/5 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-center text-sm font-medium tracking-wide text-slate-400 uppercase">
            Trusted by Teams Worldwide
          </p>
        </FadeIn>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {LOGOS.map((logo, i) => (
            <FadeIn key={logo} delay={i * 0.04}>
              <div className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold tracking-wide text-slate-500 grayscale transition hover:border-white/20 hover:text-slate-300 hover:grayscale-0">
                {logo}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
