import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TablePagination({
  total,
  page = 1,
  pageSize = 10,
}: {
  total: number;
  page?: number;
  pageSize?: number;
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
      <p className="text-sm text-slate-500">
        Showing {from} to {to} of {total} {total === 1 ? "entry" : "entries"}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-slate-200"
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 min-w-8 border-blue-200 bg-blue-50 px-3 text-blue-600"
        >
          {page}
        </Button>
        {totalPages > 1 &&
          Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
            .slice(0, 0)
            .map(() => null)}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-slate-200"
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
