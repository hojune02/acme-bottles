import clsx from "clsx";

import type { ProductionStatus } from "@/lib/scheduler";

type SupplyStatus = "Received" | "Ordered";
type LineStatus = "Idle";

const badgeStyles: Record<ProductionStatus | SupplyStatus | LineStatus, string> = {
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "In Production": "bg-blue-50 text-blue-700 ring-blue-200",
  Pending: "bg-slate-100 text-slate-700 ring-slate-200",
  "Delay expected": "bg-amber-50 text-amber-800 ring-amber-200",
  "Unable to fulfill": "bg-rose-50 text-rose-700 ring-rose-200",
  Idle: "bg-slate-100 text-slate-700 ring-slate-200",
  Received: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Ordered: "bg-indigo-50 text-indigo-700 ring-indigo-200"
};

export function StatusBadge({ status }: { status: ProductionStatus | SupplyStatus | LineStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        badgeStyles[status]
      )}
    >
      {status}
    </span>
  );
}
