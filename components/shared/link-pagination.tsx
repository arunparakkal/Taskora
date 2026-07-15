import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Server-renderable, URL-driven pagination bar — pages navigate via plain
 * `<Link>`s (built by `buildHref`) instead of client state, so it works
 * from Server Components with real server-side pagination.
 */
export function LinkPagination({
  page,
  pageSize,
  total,
  itemLabel = "entry",
  buildHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  itemLabel?: string;
  buildHref: (page: number) => string;
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const label = total === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {from} to {to} of {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 border-slate-200 dark:border-slate-700"
          disabled={page <= 1}
          asChild={page > 1}
        >
          {page > 1 ? (
            <Link href={buildHref(page - 1)} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-8 border-blue-200 bg-blue-50 px-3 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
          disabled
        >
          {page}
        </Button>
        {totalPages > 1 && (
          <span className="px-1 text-sm text-slate-500 dark:text-slate-400">
            of {totalPages}
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 border-slate-200 dark:border-slate-700"
          disabled={page >= totalPages}
          asChild={page < totalPages}
        >
          {page < totalPages ? (
            <Link href={buildHref(page + 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
