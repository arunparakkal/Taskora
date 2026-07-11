"use client";

import { Columns3, LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "card" | "board";

export function ViewModeToggle({
  value,
  onChange,
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/50",
        className
      )}
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
          value === "list"
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        aria-pressed={value === "list"}
      >
        <LayoutList className="h-4 w-4" />
        <span className="hidden sm:inline">List</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("card")}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
          value === "card"
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        aria-pressed={value === "card"}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Cards</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("board")}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
          value === "board"
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        aria-pressed={value === "board"}
      >
        <Columns3 className="h-4 w-4" />
        <span className="hidden sm:inline">Board</span>
      </button>
    </div>
  );
}
