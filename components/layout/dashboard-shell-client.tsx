"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Profile } from "@/types/database";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { cn } from "@/lib/utils";

const EXPAND_DELAY_MS = 150;
const COLLAPSE_DELAY_MS = 200;

export function DashboardShellClient({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (enterTimer.current) clearTimeout(enterTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  function handleRailEnter() {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (enterTimer.current) clearTimeout(enterTimer.current);
    enterTimer.current = setTimeout(() => setRailExpanded(true), EXPAND_DELAY_MS);
  }

  function handleRailLeave() {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(
      () => setRailExpanded(false),
      COLLAPSE_DELAY_MS
    );
  }

  // Keep the rail open while a clicked page loads; it collapses on mouse leave.
  function handleRailNavigate() {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setRailExpanded(true);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[var(--background)]">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          profile={profile}
          pathname={pathname}
          expanded
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div className="relative hidden w-[72px] shrink-0 lg:block">
        <div
          className="absolute inset-y-0 left-0 z-50"
          onMouseEnter={handleRailEnter}
          onMouseLeave={handleRailLeave}
        >
          <Sidebar
            profile={profile}
            pathname={pathname}
            expanded={railExpanded}
            onNavigate={handleRailNavigate}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopHeader
          profile={profile}
          pathname={pathname}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
