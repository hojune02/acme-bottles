import { format } from "date-fns";

import { MATERIAL_LABELS, PRODUCT_LABELS, type MaterialType, type ProductType } from "@/lib/constants";

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Not scheduled";
  }

  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function formatShortDateTime(value: Date | string) {
  return format(new Date(value), "MMM d, h:mm a");
}

export function formatKg(value: number) {
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  })} kg`;
}

export function formatProduct(product: ProductType) {
  return PRODUCT_LABELS[product];
}

export function formatMaterial(material: MaterialType) {
  return MATERIAL_LABELS[material];
}
