import { Card } from "@/components/ui/card";
import { TablePagination } from "@/components/shared/table-pagination";

export function DataTableCard({
  children,
  total,
  scrollable = true,
}: {
  children: React.ReactNode;
  total: number;
  scrollable?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className={scrollable ? "overflow-x-auto" : undefined}>{children}</div>
      <TablePagination total={total} />
    </Card>
  );
}
