import { PackageCheck } from "lucide-react";

import { ProductionLineCard } from "@/components/ProductionLineCard";
import { StatusBadge } from "@/components/StatusBadge";
import { MATERIAL_TYPES } from "@/lib/constants";
import { formatDateTime, formatKg, formatMaterial, formatProduct } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { calculateProductionSchedule } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export default async function ProductionStatusPage() {
  const now = new Date();
  const [purchaseOrders, supplyOrders] = await Promise.all([
    prisma.purchaseOrder.findMany(),
    prisma.supplyOrder.findMany()
  ]);
  const schedule = calculateProductionSchedule({
    purchaseOrders,
    supplyOrders,
    now
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Production Status</h2>
          <p className="text-sm text-slate-500">
            FIFO schedule, material constraints, and live line status.
          </p>
        </div>
        <p className="text-sm text-slate-500">Calculated at {formatDateTime(now)}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProductionLineCard line={schedule.currentProduction.oneLiterLine} />
        <ProductionLineCard line={schedule.currentProduction.oneGallonLine} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <PackageCheck aria-hidden className="h-5 w-5 text-blue-700" />
          <h3 className="text-base font-semibold text-slate-950">Material Snapshot</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {MATERIAL_TYPES.map((material) => (
            <div key={material} className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">{formatMaterial(material)}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Available now" value={formatKg(schedule.materialSummary.availableNowKg[material])} />
                <Row label="Incoming" value={formatKg(schedule.materialSummary.incomingKg[material])} />
                <Row label="Allocated FIFO" value={formatKg(schedule.materialSummary.allocatedKg[material])} />
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">Purchase Order Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">PO number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Order date</th>
                <th className="px-4 py-3">Expected start</th>
                <th className="px-4 py-3">ETA / completion</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {schedule.scheduledOrders.map((order) => (
                <tr key={order.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950">
                    {order.poNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{order.customerName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatProduct(order.product)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                    {order.quantity.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatDateTime(order.expectedStartAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatDateTime(order.expectedCompletionAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={order.status} />
                    {order.delayReason ? (
                      <p className="mt-2 max-w-56 text-xs text-slate-500">{order.delayReason}</p>
                    ) : null}
                  </td>
                </tr>
              ))}
              {schedule.scheduledOrders.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    No purchase orders have been created yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
