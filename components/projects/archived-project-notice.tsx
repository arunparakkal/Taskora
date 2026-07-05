import { Archive } from "lucide-react";

export function ArchivedProjectNotice({
  adminCanRestore = false,
}: {
  adminCanRestore?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <Archive className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="font-medium text-slate-900">This project is archived.</p>
        <p className="mt-0.5 text-slate-600">
          It is read-only. Tasks and project details cannot be changed.
          {adminCanRestore
            ? " Use Unarchive to restore it to Active."
            : " Contact an admin to unarchive it."}
        </p>
      </div>
    </div>
  );
}
