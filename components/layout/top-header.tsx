"use client";

import { Menu } from "lucide-react";
import type { Profile } from "@/types/database";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/avatar-colors";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountMenuContent } from "@/components/layout/account-menu";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Users",
  "/admin/teams": "Teams",
  "/admin/projects": "Projects",
  "/admin/tasks": "Tasks",
  "/admin/activity": "Activity",
  "/admin/performance": "Performance",
  "/team-lead": "Dashboard",
  "/team-lead/projects": "Projects",
  "/team-lead/tasks": "Team Tasks",
  "/team-lead/team": "My Team",
  "/team-lead/activity": "Activity",
  "/team-lead/performance": "Performance",
  "/member/tasks": "My Tasks",
  "/member/projects": "My Projects",
  "/member/performance": "My Performance",
  "/admin/notifications": "Notifications",
  "/team-lead/notifications": "Notifications",
  "/member/notifications": "Notifications",
};

function getPageTitle(pathname: string) {
  if (/^\/member\/tasks\/[^/]+$/.test(pathname)) return "Task Details";
  if (/^\/member\/projects\/[^/]+$/.test(pathname)) return "Project Details";
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (
      pathname.startsWith(path) &&
      path !== "/admin" &&
      path !== "/team-lead"
    ) {
      return title;
    }
  }
  return "Taskora";
}

export function TopHeader({
  profile,
  pathname,
  onMenuClick,
}: {
  profile: Profile;
  pathname: string;
  onMenuClick?: () => void;
}) {
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 overflow-visible border-b border-slate-200 bg-white px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h2
        suppressHydrationWarning
        className="text-lg font-semibold text-slate-900 lg:hidden"
      >
        {title}
      </h2>

      {profile.role === "admin" && (
        <div className="hidden min-w-0 flex-1 justify-center overflow-visible px-4 lg:flex">
          <GlobalSearch />
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <NotificationBell role={profile.role} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-100">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-400 text-xs font-semibold text-white">
                  {getInitials(profile.full_name || profile.email)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="account-menu w-[332px] origin-top-right rounded-[20px] border border-[#EEF2F7] bg-white p-4 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[var(--popover)]"
          >
            <AccountMenuContent profile={profile} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
