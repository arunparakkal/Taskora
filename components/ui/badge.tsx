import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        admin:
          "border-transparent bg-purple-100 text-purple-800 dark:border-purple-500/35 dark:bg-purple-500/15 dark:text-purple-300",
        team_lead:
          "border-transparent bg-teal-100 text-teal-800 dark:border-teal-500/35 dark:bg-teal-500/15 dark:text-teal-300",
        member:
          "border-transparent bg-slate-100 text-slate-700 dark:border-slate-600/40 dark:bg-slate-800/80 dark:text-slate-300",
        todo:
          "border-transparent bg-slate-100 text-slate-700 dark:border-slate-600/40 dark:bg-slate-800/80 dark:text-slate-300",
        in_progress:
          "border-transparent bg-blue-100 text-blue-800 dark:border-blue-500/35 dark:bg-blue-500/15 dark:text-blue-300",
        review:
          "border-transparent bg-amber-100 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-300",
        rework:
          "border-transparent bg-orange-100 text-orange-900 dark:border-orange-500/35 dark:bg-orange-500/15 dark:text-orange-300",
        done:
          "border-transparent bg-green-100 text-green-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-300",
        low:
          "border-transparent bg-slate-100 text-slate-600 dark:border-slate-600/40 dark:bg-slate-800/80 dark:text-slate-400",
        medium:
          "border-transparent bg-blue-50 text-blue-700 dark:border-blue-500/35 dark:bg-blue-500/15 dark:text-blue-300",
        high:
          "border-transparent bg-orange-100 text-orange-800 dark:border-orange-500/35 dark:bg-orange-500/15 dark:text-orange-300",
        urgent:
          "border-transparent bg-red-100 text-red-800 dark:border-red-500/35 dark:bg-red-500/15 dark:text-red-300",
        active:
          "border-transparent bg-green-100 text-green-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-300",
        paused:
          "border-transparent bg-amber-100 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-300",
        archived:
          "border-transparent bg-slate-100 text-slate-600 dark:border-slate-600/40 dark:bg-slate-800/80 dark:text-slate-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
