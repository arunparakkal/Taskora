"use client";

import Link from "next/link";
import { ShieldCheck, User } from "lucide-react";
import type { Profile } from "@/types/database";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/avatar-colors";
import { SignOutButton } from "@/components/layout/sign-out-button";
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
