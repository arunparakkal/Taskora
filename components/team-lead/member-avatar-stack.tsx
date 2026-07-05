import { EntityAvatar } from "@/components/shared/entity-avatar";
import type { Profile } from "@/types/database";

export function MemberAvatarStack({
  members,
  max = 4,
}: {
  members: Profile[];
  max?: number;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;

  if (members.length === 0) {
    return <span className="text-xs text-slate-400">No members</span>;
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <EntityAvatar
            key={m.id}
            name={m.full_name || m.email}
            size="sm"
            className="ring-2 ring-white"
          />
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-2 text-xs font-medium text-slate-500">+{extra}</span>
      )}
    </div>
  );
}
