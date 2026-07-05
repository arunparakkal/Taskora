import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageSkeleton({ withStats = true }: { withStats?: boolean }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <div className="flex-1 space-y-6 p-6 lg:p-8">
        {withStats && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        )}
        <Skeleton className="h-12 w-full max-w-md rounded-lg" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function AdminLoading() {
  return <AdminPageSkeleton />;
}
