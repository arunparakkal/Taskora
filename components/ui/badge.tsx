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
        admin: "border-transparent bg-purple-100 text-purple-800",
        team_lead: "border-transparent bg-teal-100 text-teal-800",
        member: "border-transparent bg-slate-100 text-slate-700",
        todo: "border-transparent bg-slate-100 text-slate-700",
        in_progress: "border-transparent bg-blue-100 text-blue-800",
        review: "border-transparent bg-amber-100 text-amber-800",
        rework: "border-transparent bg-orange-100 text-orange-900",
        done: "border-transparent bg-green-100 text-green-800",
        low: "border-transparent bg-slate-100 text-slate-600",
        medium: "border-transparent bg-blue-50 text-blue-700",
        high: "border-transparent bg-orange-100 text-orange-800",
        urgent: "border-transparent bg-red-100 text-red-800",
        active: "border-transparent bg-green-100 text-green-800",
        paused: "border-transparent bg-amber-100 text-amber-800",
        archived: "border-transparent bg-slate-100 text-slate-600",
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
