import { cn } from "@/lib/utils";

export function FormFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-500">{message}</p>;
}

export function fieldClass(hasError?: boolean) {
  return cn(hasError && "border-red-500 focus-visible:ring-red-500");
}
