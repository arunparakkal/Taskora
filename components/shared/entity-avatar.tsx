import { cn } from "@/lib/utils";
import { getAvatarColors, getInitials } from "@/lib/avatar-colors";

export function EntityAvatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  /** Optional profile photo URL — falls back to initials when missing. */
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const colors = getAvatarColors(name);
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote Supabase storage URLs; AvatarImage not used project-wide
      <img
        src={src}
        alt={name || "User"}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizes[size],
          className
        )}
      />
    );
  }

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
