"use client";

import { cn } from "@/lib/utils";

export type ProjectListTab = "active" | "archived";

export function ProjectListTabs({
  tab,
  onTabChange,
  activeCount,
  archivedCount,
}: {
  tab: ProjectListTab;
  onTabChange: (tab: ProjectListTab) => void;
  activeCount: number;
  archivedCount: number;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
      {(
        [
          { id: "active" as const, label: "Active", count: activeCount },
          { id: "archived" as const, label: "Archived", count: archivedCount },
        ] as const
      ).map(({ id, label, count }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
            tab === id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {label}
          <span className="ml-1.5 tabular-nums text-slate-400">({count})</span>
        </button>
      ))}
    </div>
  );
}

export function splitProjectsByArchive<T extends { status: string }>(projects: T[]) {
  const active = projects.filter((p) => p.status !== "archived");
  const archived = projects.filter((p) => p.status === "archived");
  return { active, archived };
}
