"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  FolderKanban,
  CheckSquare,
  ChevronDown,
  Gauge,
  History,
  UserCircle,
  Flame,
  ShieldCheck,
} from "lucide-react";
import type { Profile, AppRole } from "@/types/database";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/avatar-colors";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountMenuContent } from "@/components/layout/account-menu";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Teams", href: "/admin/teams", icon: UsersRound },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Tasks", href: "/admin/tasks", icon: CheckSquare },
  { label: "Activity", href: "/admin/activity", icon: History },
  { label: "Audit Log", href: "/admin/audit-log", icon: ShieldCheck },
  { label: "Performance", href: "/admin/performance", icon: Gauge },
  { label: "My Profile", href: "/admin/profile", icon: UserCircle },
];

const teamLeadNav: NavItem[] = [
  { label: "Dashboard", href: "/team-lead", icon: LayoutDashboard },
  { label: "Projects", href: "/team-lead/projects", icon: FolderKanban },
  { label: "Team Tasks", href: "/team-lead/tasks", icon: CheckSquare },
  { label: "My Team", href: "/team-lead/team", icon: UsersRound },
  { label: "Activity", href: "/team-lead/activity", icon: History },
  { label: "Performance", href: "/team-lead/performance", icon: Gauge },
];

const memberNav: NavItem[] = [
  { label: "My Tasks", href: "/member/tasks", icon: CheckSquare },
  { label: "My Projects", href: "/member/projects", icon: FolderKanban },
  { label: "My Habits", href: "/member/habits", icon: Flame },
  { label: "My Performance", href: "/member/performance", icon: Gauge },
  { label: "Activity", href: "/member/activity", icon: History },
  { label: "My Profile", href: "/member/profile", icon: UserCircle },
];

function getNav(role: AppRole): NavItem[] {
  if (role === "admin") return adminNav;
  if (role === "team_lead") return teamLeadNav;
  return memberNav;
}

function isNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/team-lead") return pathname === "/team-lead";
  return pathname.startsWith(href);
}

export function Sidebar({
  profile,
  pathname,
  expanded = true,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: {
  profile: Profile;
  pathname: string;
  expanded?: boolean;
  onNavigate?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const nav = getNav(profile.role);

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "flex h-screen flex-shrink-0 flex-col overflow-hidden bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-xl transition-[width] duration-300 ease-in-out",
        expanded ? "w-[260px]" : "w-[72px]"
      )}
    >
      <div
        className={cn(
          "flex h-16 flex-shrink-0 items-center gap-2.5 border-b border-white/10",
          expanded ? "px-5" : "justify-center px-0"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--sidebar-active)] to-blue-400 shadow-lg shadow-blue-500/30">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        {expanded && (
          <span className="whitespace-nowrap text-lg font-bold tracking-tight">
            Taskora
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
        <p
          className={cn(
            "px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)] transition-opacity duration-200",
            expanded ? "opacity-100" : "opacity-0"
          )}
        >
          Main
        </p>
        {nav.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              title={!expanded ? item.label : undefined}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-150",
                expanded ? "gap-3 px-3" : "justify-center px-0",
                active
                  ? "bg-blue-600/90 text-white shadow-md shadow-blue-500/20"
                  : "text-[var(--sidebar-muted)] hover:bg-white/10 hover:text-white"
              )}
            >
              {active && (
                <span className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-white/80" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {expanded && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-shrink-0 border-t border-white/10 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center rounded-lg py-2 text-left transition-colors hover:bg-white/10",
                expanded ? "gap-3 px-2" : "justify-center px-0"
              )}
            >
              <span className="relative shrink-0">
                <Avatar className="h-9 w-9 ring-2 ring-white/10">
                  <AvatarFallback className="bg-gradient-to-br from-[var(--sidebar-active)] to-blue-400 text-xs font-semibold text-white">
                    {getInitials(profile.full_name || profile.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--sidebar)] bg-emerald-500" />
              </span>
              {expanded && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {profile.full_name}
                    </p>
                    <p className="truncate text-xs text-[var(--sidebar-muted)]">
                      {profile.email}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--sidebar-muted)]" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={10}
            className="account-menu w-[300px] rounded-[20px] border border-[#EEF2F7] bg-white p-4 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[var(--popover)]"
          >
            <AccountMenuContent profile={profile} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
