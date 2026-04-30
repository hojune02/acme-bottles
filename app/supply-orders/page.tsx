import { Search } from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";
import { SupplyOrderForm } from "@/components/SupplyOrderForm";
import { MATERIAL_LABELS, MATERIAL_TYPES, type MaterialType } from "@/lib/constants";
import { formatDateTime, formatKg, formatMaterial } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function SuppliesPage({ searchParams }: PageProps) {
  const now = new Date();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const supplyOrders = await prisma.supplyOrder.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
  const availableNow = MATERIAL_TYPES.reduce<Record<MaterialType, number>>(
    (acc, material) => {
      acc[material] = 0;
      return acc;
    },
    {} as Record<MaterialType, number>
  );

  for (const supply of supplyOrders) {
    if (supply.eta.getTime() <= now.getTime()) {
      availableNow[supply.material] += supply.quantityKg;
    }
  }

  const filteredSupplies = query
    ? supplyOrders.filter((supply) => {
        const haystack = [
          MATERIAL_LABELS[supply.material],
          supply.trackingCode,
          supply.supplierName ?? ""
        ].join(" ");
        return haystack.toLowerCase().includes(query.toLowerCase());
      })
    : supplyOrders;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Supply Orders</h2>
          <p className="text-sm text-slate-500">Track received and incoming raw materials.</p>
        </div>
        <SupplyOrderForm />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MATERIAL_TYPES.map((material) => (
          <section
            key={material}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500">{formatMaterial(material)}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatKg(availableNow[material])}
            </p>
            <p className="mt-1 text-xs text-slate-500">Current available total</p>
          </section>
        ))}
      </div>

      <form className="relative max-w-xl" action="/supply-orders">
        <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search material, supplier, or tracking code"
          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Tracking code</th>
                <th className="px-4 py-3">Order date</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSupplies.map((supply) => {
                const status = supply.eta.getTime() <= now.getTime() ? "Received" : "Ordered";

                return (
                  <tr key={supply.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950">
                      {formatMaterial(supply.material)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      {formatKg(supply.quantityKg)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {supply.supplierName || "Not provided"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {supply.trackingCode}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {formatDateTime(supply.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {formatDateTime(supply.eta)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                );
              })}
              {filteredSupplies.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    No supply orders match the current filter.
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
