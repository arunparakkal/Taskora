"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RequiredLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
      {children}
      {!optional && <span className="ml-0.5 text-red-500">*</span>}
      {optional && (
        <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span>
      )}
    </Label>
  );
}

export function IconInput({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative min-w-0 w-full">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input className={cn("min-w-0 w-full pl-10", className)} {...props} />
    </div>
  );
}

export function IconTextarea({
  icon: Icon,
  className,
  maxLength,
  value,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  icon: React.ComponentType<{ className?: string }>;
  maxLength?: number;
}) {
  const length = typeof value === "string" ? value.length : 0;

  return (
    <div className="relative min-w-0 w-full">
      <Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
      <Textarea
        className={cn("min-h-[100px] w-full min-w-0 resize-none pl-10 pb-8", className)}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      {maxLength !== undefined && (
        <span className="absolute bottom-2 right-3 text-xs text-slate-400">
          {length}/{maxLength}
        </span>
      )}
    </div>
  );
}

export function IconSelectTrigger({
  icon: Icon,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-w-0 w-full">
      <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <div className={cn("min-w-0 w-full [&_button]:min-w-0 [&_button]:w-full [&_button]:pl-10", className)}>
        {children}
      </div>
    </div>
  );
}

export function FormDialogFooter({
  onCancel,
  submitLabel,
  loading,
  disabled,
  submitIcon: SubmitIcon,
}: {
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
  disabled?: boolean;
  submitIcon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={loading}
        className="border-slate-200"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={loading || disabled}
        className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : SubmitIcon ? (
          <SubmitIcon className="h-4 w-4" />
        ) : null}
        {submitLabel}
      </Button>
    </div>
  );
}
