"use client";

import Link from "next/link";
import { Monitor, Moon, ShieldCheck, Sun, User } from "lucide-react";
import { useState } from "react";
import type { Profile } from "@/types/database";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/avatar-colors";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  team_lead: "Team Lead",
  member: "Member",
};

function profileHrefForRole(role: string, userId: string): string {
  if (role === "admin") return "/admin/profile";
  if (role === "team_lead") return `/team-lead/members/${userId}`;
  return "/member/profile";
}

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function AppearanceRow() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ActiveIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left transition-colors duration-[180ms] ease-out hover:bg-[#F8FAFC] dark:hover:bg-white/5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-white dark:bg-white/10 dark:text-slate-300">
          <ActiveIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            Appearance
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            Light, dark &amp; system
          </span>
        </span>
      </button>

      {open && (
        <div className="mt-1.5 grid grid-cols-3 gap-1.5 px-1">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={
                  "flex flex-col items-center gap-1 rounded-[12px] border px-2 py-2.5 text-[11px] font-medium transition-all " +
                  (active
                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
                    : "border-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5")
                }
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AccountMenuContent({ profile }: { profile: Profile }) {
  const profileHref = profileHrefForRole(profile.role, profile.id);

  return (
    <>
      <div className="flex items-center gap-3.5 px-1 pb-4">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-400 text-base font-semibold text-white">
              {getInitials(profile.full_name || profile.email)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[var(--popover)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
            {profile.full_name}
          </p>
          <p className="truncate text-[13px] text-slate-500 dark:text-slate-400">
            {profile.email}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <ShieldCheck className="h-3 w-3" />
            {ROLE_LABELS[profile.role] ?? "Member"}
          </span>
        </div>
      </div>

      <div className="h-px bg-[#EEF2F7] dark:bg-white/10" />

      <div className="pt-2">
        <DropdownMenuItem
          asChild
          className="rounded-[14px] p-0 focus:bg-transparent data-[highlighted]:bg-transparent"
        >
          <Link
            href={profileHref}
            className="group flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 transition-colors duration-[180ms] ease-out hover:bg-[#F8FAFC] dark:hover:bg-white/5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-white dark:bg-white/10 dark:text-slate-300">
              <User className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                View profile
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Manage your profile
              </span>
            </span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="rounded-[14px] p-0 focus:bg-transparent data-[highlighted]:bg-transparent"
        >
          <AppearanceRow />
        </DropdownMenuItem>
      </div>

      <div className="mt-3 border-t border-[#EEF2F7] pt-3 dark:border-white/10">
        <DropdownMenuItem
          asChild
          className="p-0 focus:bg-transparent data-[highlighted]:bg-transparent"
        >
          <SignOutButton />
        </DropdownMenuItem>
      </div>
    </>
  );
}
