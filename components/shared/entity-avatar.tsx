import { cn } from "@/lib/utils";
import { getAvatarColors, getInitials } from "@/lib/avatar-colors";

export function EntityAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const colors = getAvatarColors(name);
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        colors.bg,
        colors.text,
        sizes[size],
        className
      )}
    >
      {getInitials(name || "?")}
    </div>
  );
}
