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
  Bell,
  History,
  UserCircle,
} from "lucide-react";
import type { Profile, AppRole } from "@/types/database";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/avatar-colors";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/layout/sign-out-button";

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
  { label: "Performance", href: "/admin/performance", icon: Gauge },
  { label: "My Profile", href: "/admin/profile", icon: UserCircle },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
];

const teamLeadNav: NavItem[] = [
  { label: "Dashboard", href: "/team-lead", icon: LayoutDashboard },
  { label: "Projects", href: "/team-lead/projects", icon: FolderKanban },
  { label: "Team Tasks", href: "/team-lead/tasks", icon: CheckSquare },
  { label: "My Team", href: "/team-lead/team", icon: UsersRound },
  { label: "Activity", href: "/team-lead/activity", icon: History },
  { label: "Performance", href: "/team-lead/performance", icon: Gauge },
  { label: "Notifications", href: "/team-lead/notifications", icon: Bell },
];

const memberNav: NavItem[] = [
  { label: "My Tasks", href: "/member/tasks", icon: CheckSquare },
  { label: "My Projects", href: "/member/projects", icon: FolderKanban },
  { label: "My Profile", href: "/member/profile", icon: UserCircle },
  { label: "Activity", href: "/member/activity", icon: History },
  { label: "My Performance", href: "/member/performance", icon: Gauge },
  { label: "Notifications", href: "/member/notifications", icon: Bell },
];

function profileHrefForRole(role: AppRole, userId: string): string {
  if (role === "admin") return "/admin/profile";
  if (role === "team_lead") return `/team-lead/members/${userId}`;
  return "/member/profile";
}

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
  onNavigate,
}: {
  profile: Profile;
  pathname: string;
  onNavigate?: () => void;
}) {
  const nav = getNav(profile.role);

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-xl">
      <div className="flex h-16 flex-shrink-0 items-center gap-2.5 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--sidebar-active)] to-blue-400 shadow-lg shadow-blue-500/30">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">Taskora</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
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
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-blue-600/90 text-white shadow-md shadow-blue-500/20"
                  : "text-[var(--sidebar-muted)] hover:bg-white/10 hover:text-white"
              )}
            >
              {active && (
                <span className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-white/80" />
              )}
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-shrink-0 border-t border-white/10 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/10">
              <Avatar className="h-9 w-9 ring-2 ring-white/10">
                <AvatarFallback className="bg-gradient-to-br from-[var(--sidebar-active)] to-blue-400 text-xs font-semibold text-white">
                  {getInitials(profile.full_name || profile.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile.full_name}</p>
                <p className="truncate text-xs text-[var(--sidebar-muted)]">
                  {profile.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-[var(--sidebar-muted)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={profileHrefForRole(profile.role, profile.id)}>
                View profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <SignOutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
