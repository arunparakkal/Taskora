import { Card } from "@/components/ui/card";
import { TablePagination } from "@/components/shared/table-pagination";

export function DataTableCard({
  children,
  total,
  scrollable = true,
  pagination,
}: {
  children: React.ReactNode;
  total: number;
  scrollable?: boolean;
  /** Override the default (decorative) pager — e.g. with `LinkPagination` for server-paginated lists. */
  pagination?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
      <div className={scrollable ? "overflow-x-auto" : undefined}>{children}</div>
      {pagination ?? <TablePagination total={total} />}
    </Card>
  );
}
