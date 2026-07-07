import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentStyles = {
  blue: {
    box: "bg-blue-50 dark:bg-blue-500/15",
    icon: "text-blue-600 dark:text-blue-400",
  },
  green: {
    box: "bg-emerald-50 dark:bg-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  purple: {
    box: "bg-violet-50 dark:bg-violet-500/15",
    icon: "text-violet-600 dark:text-violet-400",
  },
  orange: {
    box: "bg-orange-50 dark:bg-orange-500/15",
    icon: "text-orange-600 dark:text-orange-400",
  },
  teal: {
    box: "bg-teal-50 dark:bg-teal-500/15",
    icon: "text-teal-600 dark:text-teal-400",
  },
  amber: {
    box: "bg-amber-50 dark:bg-amber-500/15",
    icon: "text-amber-600 dark:text-amber-400",
  },
  red: {
    box: "bg-red-50 dark:bg-red-500/15",
    icon: "text-red-600 dark:text-red-400",
  },
};

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  href,
  accent = "blue",
}: {
  label: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  href?: string;
  accent?: keyof typeof accentStyles;
}) {
  const styles = accentStyles[accent];

  const content = (
    <Card
      className={cn(
        "border-slate-200 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800",
        href && "cursor-pointer"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              styles.box
            )}
          >
            <Icon className={cn("h-5 w-5", styles.icon)} />
          </div>
          <div className="min-w-0">
            <p className="whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {value}
            </p>
            {subtext && (
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                {subtext}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} prefetch>
        {content}
      </Link>
    );
  }
  return content;
}

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  );
}
