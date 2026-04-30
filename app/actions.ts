"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { purchaseOrderSchema, supplyOrderSchema } from "@/lib/validation";

export type FormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

export async function createPurchaseOrder(
  _previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = purchaseOrderSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted fields."
    };
  }

  const data = parsed.data;
  const poNumber = await generatePoNumber();

  try {
    await prisma.purchaseOrder.create({
      data: {
        poNumber,
        customerName: data.customerName,
        product: data.product,
        quantity: data.quantity,
        notes: data.notes || null
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        message: "Could not generate a unique PO number. Please try again."
      };
    }

    throw error;
  }

  revalidatePath("/purchase-orders");
  revalidatePath("/production-status");
  redirect("/purchase-orders");
}

export async function createSupplyOrder(
  _previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = supplyOrderSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted fields."
    };
  }

  const data = parsed.data;
  const existingSupplyOrder = await prisma.supplyOrder.findFirst({
    where: {
      trackingCode: data.trackingCode
    },
    select: {
      id: true
    }
  });

  if (existingSupplyOrder) {
    return {
      errors: {
        trackingCode: ["This tracking code has already been used."]
      },
      message: "Please use a unique tracking code."
    };
  }

  try {
    await prisma.supplyOrder.create({
      data: {
        material: data.material,
        quantityKg: data.quantityKg,
        supplierName: data.supplierName || null,
        trackingCode: data.trackingCode,
        eta: data.eta
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error, "trackingCode")) {
      return {
        errors: {
          trackingCode: ["This tracking code has already been used."]
        },
        message: "Please use a unique tracking code."
      };
    }

    throw error;
  }

  revalidatePath("/supply-orders");
  revalidatePath("/production-status");
  redirect("/supply-orders");
}

async function generatePoNumber() {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const latest = await prisma.purchaseOrder.findFirst({
    where: {
      poNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      poNumber: "desc"
    },
    select: {
      poNumber: true
    }
  });

  const latestNumber = latest?.poNumber.split("-").at(-1);
  const nextSequence = latestNumber ? Number(latestNumber) + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(3, "0")}`;
}

function isUniqueConstraintError(error: unknown, field: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;

  return Array.isArray(target) ? target.includes(field) : target === field;
}
