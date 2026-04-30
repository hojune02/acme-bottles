import { Search } from "lucide-react";

import { PurchaseOrderForm } from "@/components/PurchaseOrderForm";
import { PRODUCT_LABELS } from "@/lib/constants";
import { formatDateTime, formatProduct } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function PurchaseOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
  const filteredOrders = query
    ? purchaseOrders.filter((order) => {
        const haystack = [
          order.poNumber,
          order.customerName,
          PRODUCT_LABELS[order.product]
        ].join(" ");
        return haystack.toLowerCase().includes(query.toLowerCase());
      })
    : purchaseOrders;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Purchase Orders</h2>
          <p className="text-sm text-slate-500">Newest purchase orders are listed first.</p>
        </div>
        <PurchaseOrderForm />
      </div>

      <form className="relative max-w-xl" action="/purchase-orders">
        <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search PO number, customer, or product"
          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">PO number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Order date</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOrders.map((order) => (
                <tr key={order.id}>
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
                  <td className="min-w-56 px-4 py-3 text-slate-500">{order.notes || "None"}</td>
                </tr>
              ))}
              {filteredOrders.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    No purchase orders match the current filter.
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
