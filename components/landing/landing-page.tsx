"use client";

import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { TrustedSection } from "@/components/landing/trusted";
import { FeaturesSection } from "@/components/landing/features";
import { ShowcaseSection } from "@/components/landing/showcase";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { WhyStatsTestimonials } from "@/components/landing/why-stats-testimonials";
import { PricingFaqCtaFooter } from "@/components/landing/pricing-faq-cta-footer";

export function LandingPage() {
  return (
    <div className="landing-root min-h-screen scroll-smooth bg-[#050816] text-slate-100 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(49,46,129,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(5,8,22,0.85))]" />
      </div>

      <LandingNavbar />
      <main>
        <LandingHero />
        <ShowcaseSection />
        <TrustedSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WhyStatsTestimonials />
        <PricingFaqCtaFooter />
      </main>
    </div>
  );
}
