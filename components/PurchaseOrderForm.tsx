"use client";

import { Plus, Save, X } from "lucide-react";
import { useActionState, useState } from "react";

import { createPurchaseOrder, type FormState } from "@/app/actions";
import { PRODUCT_LABELS, PRODUCT_TYPES } from "@/lib/constants";

const initialState: FormState = {};

export function PurchaseOrderForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createPurchaseOrder, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        <Plus aria-hidden className="h-4 w-4" />
        Create New PO
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Create Purchase Order</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <form action={formAction} className="space-y-4 px-5 py-5">
              {state.message ? (
                <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {state.message}
                </p>
              ) : null}

              <Field label="Customer name" error={state.errors?.customerName?.[0]}>
                <input
                  name="customerName"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <Field label="Product" error={state.errors?.product?.[0]}>
                <select
                  name="product"
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {PRODUCT_TYPES.map((product) => (
                    <option key={product} value={product}>
                      {PRODUCT_LABELS[product]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantity" error={state.errors?.quantity?.[0]}>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <Field label="Notes" error={state.errors?.notes?.[0]}>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save aria-hidden className="h-4 w-4" />
                  {pending ? "Creating..." : "Create PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
