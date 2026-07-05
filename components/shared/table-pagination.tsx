import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TablePagination({
  total,
  page = 1,
  pageSize = 10,
  onPageChange,
  itemLabel = "entry",
}: {
  total: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  itemLabel?: string;
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const label = total === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-slate-500">
        Showing {from} to {to} of {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 border-slate-200"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-8 border-blue-200 bg-blue-50 px-3 text-blue-600"
          disabled
        >
          {page}
        </Button>
        {totalPages > 1 && (
          <span className="px-1 text-sm text-slate-500">of {totalPages}</span>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 border-slate-200"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
