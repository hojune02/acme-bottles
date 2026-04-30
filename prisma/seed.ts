import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hoursFrom(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  const now = new Date();
  const year = now.getFullYear();

  await prisma.purchaseOrder.deleteMany();
  await prisma.supplyOrder.deleteMany();

  await prisma.supplyOrder.createMany({
    data: [
      {
        material: "PET_RESIN",
        quantityKg: 600,
        supplierName: "NorthStar Polymers",
        trackingCode: "PET-RECV-001",
        eta: hoursFrom(now, -8),
        createdAt: hoursFrom(now, -36)
      },
      {
        material: "PTA",
        quantityKg: 420,
        supplierName: "ClearPath Chemicals",
        trackingCode: "PTA-RECV-001",
        eta: hoursFrom(now, -8),
        createdAt: hoursFrom(now, -36)
      },
      {
        material: "EG",
        quantityKg: 220,
        supplierName: "Gulf Glycol Supply",
        trackingCode: "EG-RECV-001",
        eta: hoursFrom(now, -8),
        createdAt: hoursFrom(now, -36)
      },
      {
        material: "PET_RESIN",
        quantityKg: 200,
        supplierName: "NorthStar Polymers",
        trackingCode: "PET-IN-002",
        eta: hoursFrom(now, 5),
        createdAt: hoursFrom(now, -2)
      },
      {
        material: "PTA",
        quantityKg: 150,
        supplierName: "ClearPath Chemicals",
        trackingCode: "PTA-IN-002",
        eta: hoursFrom(now, 5),
        createdAt: hoursFrom(now, -2)
      },
      {
        material: "EG",
        quantityKg: 100,
        supplierName: "Gulf Glycol Supply",
        trackingCode: "EG-IN-002",
        eta: hoursFrom(now, 5),
        createdAt: hoursFrom(now, -2)
      }
    ]
  });

  await prisma.purchaseOrder.createMany({
    data: [
      {
        poNumber: `PO-${year}-001`,
        customerName: "BrightMart",
        product: "ONE_LITER_BOTTLE",
        quantity: 4000,
        notes: "Completed demo order",
        createdAt: hoursFrom(now, -6)
      },
      {
        poNumber: `PO-${year}-002`,
        customerName: "Summit Water Co.",
        product: "ONE_GALLON_BOTTLE",
        quantity: 3000,
        notes: "In production on the gallon line",
        createdAt: hoursFrom(now, -1)
      },
      {
        poNumber: `PO-${year}-003`,
        customerName: "Harbor Grocers",
        product: "ONE_LITER_BOTTLE",
        quantity: 5000,
        notes: "In production on the liter line",
        createdAt: hoursFrom(now, -0.5)
      },
      {
        poNumber: `PO-${year}-004`,
        customerName: "Atlas Events",
        product: "ONE_GALLON_BOTTLE",
        quantity: 1500,
        notes: "Pending behind an active gallon order",
        createdAt: hoursFrom(now, -0.25)
      },
      {
        poNumber: `PO-${year}-005`,
        customerName: "Canyon Outfitters",
        product: "ONE_LITER_BOTTLE",
        quantity: 6000,
        notes: "Delayed until future material arrives",
        createdAt: hoursFrom(now, -0.1)
      },
      {
        poNumber: `PO-${year}-006`,
        customerName: "Mega Retail Group",
        product: "ONE_GALLON_BOTTLE",
        quantity: 20000,
        notes: "Unable to fulfill with current and incoming material",
        createdAt: now
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
