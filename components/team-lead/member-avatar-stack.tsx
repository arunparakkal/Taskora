import Link from "next/link";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import type { Profile } from "@/types/database";

export function MemberAvatarStack({
  members,
  max = 4,
  memberHrefPrefix,
}: {
  members: Profile[];
  max?: number;
  memberHrefPrefix?: string;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;

  if (members.length === 0) {
    return <span className="text-xs text-slate-400">No members</span>;
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((m) => {
          const name = m.full_name || m.email;
          const href = memberHrefPrefix
            ? `${memberHrefPrefix}/${m.id}`
            : undefined;

          const avatar = (
            <EntityAvatar
              name={name}
              size="sm"
              className={
                href
                  ? "ring-2 ring-white transition-transform hover:z-10 hover:scale-110"
                  : "ring-2 ring-white"
              }
            />
          );

          return href ? (
            <Link
              key={m.id}
              href={href}
              title={name}
              className="rounded-full"
            >
              {avatar}
            </Link>
          ) : (
            <span key={m.id}>{avatar}</span>
          );
        })}
      </div>
      {extra > 0 && (
        <span className="ml-2 text-xs font-medium text-slate-500">+{extra}</span>
      )}
    </div>
  );
}
