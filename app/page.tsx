import { redirect } from "next/navigation";
import { Outfit, Syne } from "next/font/google";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { ROLE_HOME } from "@/lib/auth/roles";
import { LandingPage } from "@/components/landing/landing-page";

const landingDisplay = Syne({
  subsets: ["latin"],
  variable: "--font-landing-display",
});

const landingSans = Outfit({
  subsets: ["latin"],
  variable: "--font-landing-sans",
});

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (profile) redirect(ROLE_HOME[profile.role]);

  return (
    <div
      className={`${landingDisplay.variable} ${landingSans.variable} font-[family-name:var(--font-landing-sans)]`}
    >
      <LandingPage />
    </div>
  );
}
