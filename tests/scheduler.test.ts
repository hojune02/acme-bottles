import { describe, expect, it } from "vitest";

import {
  calculateProductionSchedule,
  calculateRequiredMaterialsKg,
  type PurchaseOrderInput,
  type SupplyOrderInput
} from "@/lib/scheduler";

const now = new Date("2026-04-30T12:00:00.000Z");

function hoursFromNow(hours: number) {
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

function po(overrides: Partial<PurchaseOrderInput>): PurchaseOrderInput {
  return {
    id: "po-1",
    poNumber: "PO-2026-001",
    customerName: "Globex",
    product: "ONE_LITER_BOTTLE",
    quantity: 1000,
    createdAt: now,
    ...overrides
  };
}

function enoughSupplies(eta = hoursFromNow(-1)): SupplyOrderInput[] {
  return [
    {
      id: "s-1",
      material: "PET_RESIN",
      quantityKg: 10000,
      eta,
      createdAt: eta
    },
    {
      id: "s-2",
      material: "PTA",
      quantityKg: 10000,
      eta,
      createdAt: eta
    },
    {
      id: "s-3",
      material: "EG",
      quantityKg: 10000,
      eta,
      createdAt: eta
    }
  ];
}

describe("calculateProductionSchedule", () => {
  it("uses 2,000 bottles/hour capacity for 1-liter orders", () => {
    const schedule = calculateProductionSchedule({
      purchaseOrders: [po({ quantity: 4000 })],
      supplyOrders: enoughSupplies(),
      now
    });

    const order = schedule.scheduledOrders[0];
    expect(order.expectedStartAt?.toISOString()).toBe(now.toISOString());
    expect(order.expectedCompletionAt?.toISOString()).toBe(hoursFromNow(2).toISOString());
  });

  it("uses 1,500 bottles/hour capacity for 1-gallon orders", () => {
    const schedule = calculateProductionSchedule({
      purchaseOrders: [
        po({
          product: "ONE_GALLON_BOTTLE",
          quantity: 3000
        })
      ],
      supplyOrders: enoughSupplies(),
      now
    });

    const order = schedule.scheduledOrders[0];
    expect(order.expectedCompletionAt?.toISOString()).toBe(hoursFromNow(2).toISOString());
  });

  it("converts material requirements from grams to kilograms", () => {
    expect(calculateRequiredMaterialsKg("ONE_GALLON_BOTTLE", 1000)).toEqual({
      PET_RESIN: 65,
      PTA: 45,
      EG: 20
    });
    expect(calculateRequiredMaterialsKg("ONE_LITER_BOTTLE", 1000)).toEqual({
      PET_RESIN: 20,
      PTA: 15,
      EG: 10
    });
  });

  it("processes orders FIFO by creation time", () => {
    const schedule = calculateProductionSchedule({
      purchaseOrders: [
        po({ id: "po-2", poNumber: "PO-2026-002", quantity: 2000, createdAt: hoursFromNow(1) }),
        po({ id: "po-1", poNumber: "PO-2026-001", quantity: 2000, createdAt: now })
      ],
      supplyOrders: enoughSupplies(),
      now
    });

    expect(schedule.scheduledOrders.map((order) => order.poNumber)).toEqual([
      "PO-2026-001",
      "PO-2026-002"
    ]);
    expect(schedule.scheduledOrders[1].expectedStartAt?.toISOString()).toBe(
      hoursFromNow(1).toISOString()
    );
  });

  it("allows independent production lines to operate simultaneously", () => {
    const schedule = calculateProductionSchedule({
      purchaseOrders: [
        po({ id: "po-1", poNumber: "PO-2026-001", product: "ONE_LITER_BOTTLE" }),
        po({ id: "po-2", poNumber: "PO-2026-002", product: "ONE_GALLON_BOTTLE" })
      ],
      supplyOrders: enoughSupplies(),
      now
    });

    expect(schedule.scheduledOrders[0].expectedStartAt?.toISOString()).toBe(now.toISOString());
    expect(schedule.scheduledOrders[1].expectedStartAt?.toISOString()).toBe(now.toISOString());
  });

  it("marks an order as delayed when future incoming materials can satisfy it", () => {
    const schedule = calculateProductionSchedule({
      purchaseOrders: [po({ quantity: 1000 })],
      supplyOrders: enoughSupplies(hoursFromNow(5)),
      now
    });

    const order = schedule.scheduledOrders[0];
    expect(order.status).toBe("Delay expected");
    expect(order.expectedStartAt?.toISOString()).toBe(hoursFromNow(5).toISOString());
  });

  it("marks an order unable to fulfill when total supplies can never satisfy it", () => {
    const schedule = calculateProductionSchedule({
      purchaseOrders: [po({ quantity: 1000 })],
      supplyOrders: [],
      now
    });

    const order = schedule.scheduledOrders[0];
    expect(order.status).toBe("Unable to fulfill");
    expect(order.expectedStartAt).toBeNull();
    expect(order.expectedCompletionAt).toBeNull();
  });

  it("computes Completed, In Production, and Pending statuses from now", () => {
    const schedule = calculateProductionSchedule({
      purchaseOrders: [
        po({
          id: "po-1",
          poNumber: "PO-2026-001",
          product: "ONE_LITER_BOTTLE",
          quantity: 2000,
          createdAt: hoursFromNow(-3)
        }),
        po({
          id: "po-2",
          poNumber: "PO-2026-002",
          product: "ONE_GALLON_BOTTLE",
          quantity: 3000,
          createdAt: hoursFromNow(-1)
        }),
        po({
          id: "po-3",
          poNumber: "PO-2026-003",
          product: "ONE_GALLON_BOTTLE",
          quantity: 1500,
          createdAt: hoursFromNow(-0.5)
        })
      ],
      supplyOrders: enoughSupplies(hoursFromNow(-4)),
      now
    });

    expect(schedule.scheduledOrders[0].status).toBe("Completed");
    expect(schedule.scheduledOrders[1].status).toBe("In Production");
    expect(schedule.scheduledOrders[2].status).toBe("Pending");
    expect(schedule.currentProduction.oneGallonLine.currentOrder?.poNumber).toBe("PO-2026-002");
  });
});
