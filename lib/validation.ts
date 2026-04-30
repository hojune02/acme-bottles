import { z } from "zod";

import { MATERIAL_TYPES, PRODUCT_TYPES } from "@/lib/constants";

export const purchaseOrderSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required."),
  product: z.enum(PRODUCT_TYPES, {
    errorMap: () => ({ message: "Choose a valid product." })
  }),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .positive("Quantity must be greater than zero."),
  notes: z.string().trim().optional()
});

export const supplyOrderSchema = z.object({
  material: z.enum(MATERIAL_TYPES, {
    errorMap: () => ({ message: "Choose a valid material." })
  }),
  quantityKg: z.coerce.number().positive("Quantity must be greater than zero."),
  supplierName: z.string().trim().optional(),
  trackingCode: z.string().trim().min(1, "Tracking code is required."),
  eta: z.coerce.date({
    errorMap: () => ({ message: "ETA must be a valid date and time." })
  })
});
