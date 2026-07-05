import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentStyles = {
  blue: { box: "bg-blue-50", icon: "text-blue-600" },
  green: { box: "bg-emerald-50", icon: "text-emerald-600" },
  purple: { box: "bg-violet-50", icon: "text-violet-600" },
  orange: { box: "bg-orange-50", icon: "text-orange-600" },
  teal: { box: "bg-teal-50", icon: "text-teal-600" },
  amber: { box: "bg-amber-50", icon: "text-amber-600" },
  red: { box: "bg-red-50", icon: "text-red-600" },
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
        "border-slate-200 shadow-sm transition-shadow hover:shadow-md",
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
            <p className="whitespace-nowrap text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
            {subtext && (
              <p className="mt-0.5 text-xs text-slate-400">{subtext}</p>
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
