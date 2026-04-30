import { Clock, Factory } from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime, formatProduct } from "@/lib/formatters";
import type { ProductionLineState } from "@/lib/scheduler";

export function ProductionLineCard({ line }: { line: ProductionLineState }) {
  const order = line.currentOrder;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <Factory aria-hidden className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-950">{line.lineName}</h2>
        </div>
        {order ? <StatusBadge status={order.status} /> : <StatusBadge status="Idle" />}
      </div>

      {order ? (
        <div className="grid gap-3 text-sm">
          <LineItem label="Current order" value={order.poNumber} />
          <LineItem label="Customer" value={order.customerName} />
          <LineItem label="Product" value={formatProduct(order.product)} />
          <LineItem label="Quantity" value={order.quantity.toLocaleString()} />
          <LineItem label="Started at" value={formatDateTime(order.expectedStartAt)} />
          <LineItem label="ETA" value={formatDateTime(order.expectedCompletionAt)} />
        </div>
      ) : (
        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-700">
            <Clock aria-hidden className="h-4 w-4" />
            <span className="font-medium">Idle</span>
          </div>
          {line.nextOrder ? (
            <>
              <LineItem label="Next order" value={line.nextOrder.poNumber} />
              <LineItem label="Customer" value={line.nextOrder.customerName} />
              <LineItem label="Product" value={formatProduct(line.nextOrder.product)} />
              <LineItem label="Expected start" value={formatDateTime(line.nextOrder.expectedStartAt)} />
            </>
          ) : (
            <p className="text-slate-500">No scheduled order is waiting for this line.</p>
          )}
        </div>
      )}
    </section>
  );
}

function LineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
