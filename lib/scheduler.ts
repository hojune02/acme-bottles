import {
  LINE_CONFIG,
  MATERIAL_REQUIREMENTS_GRAMS,
  MATERIAL_TYPES,
  type MaterialType,
  type ProductType
} from "@/lib/constants";

export type PurchaseOrderInput = {
  id: string;
  poNumber: string;
  customerName: string;
  product: ProductType;
  quantity: number;
  createdAt: Date;
};

export type SupplyOrderInput = {
  id: string;
  material: MaterialType;
  quantityKg: number;
  eta: Date;
  createdAt: Date;
};

export type ProductionStatus =
  | "Completed"
  | "In Production"
  | "Pending"
  | "Delay expected"
  | "Unable to fulfill";

export type RequiredMaterialsKg = Record<MaterialType, number>;

export type ScheduledOrder = PurchaseOrderInput & {
  requiredMaterialsKg: RequiredMaterialsKg;
  expectedStartAt: Date | null;
  expectedCompletionAt: Date | null;
  status: ProductionStatus;
  lineName: string;
  delayReason?: string;
};

export type ProductionLineState = {
  lineName: string;
  currentOrder: ScheduledOrder | null;
  nextOrder: ScheduledOrder | null;
};

export type ProductionSchedule = {
  scheduledOrders: ScheduledOrder[];
  currentProduction: {
    oneLiterLine: ProductionLineState;
    oneGallonLine: ProductionLineState;
  };
  materialSummary: {
    availableNowKg: RequiredMaterialsKg;
    incomingKg: RequiredMaterialsKg;
    allocatedKg: RequiredMaterialsKg;
  };
};

type CalculateProductionScheduleInput = {
  purchaseOrders: PurchaseOrderInput[];
  supplyOrders: SupplyOrderInput[];
  now: Date;
};

type SupplyTimelineEvent = {
  at: Date;
  quantityKg: number;
};

const EMPTY_MATERIALS: RequiredMaterialsKg = {
  PET_RESIN: 0,
  PTA: 0,
  EG: 0
};

export function calculateRequiredMaterialsKg(
  product: ProductType,
  quantity: number
): RequiredMaterialsKg {
  return MATERIAL_TYPES.reduce((acc, material) => {
    acc[material] = (quantity * MATERIAL_REQUIREMENTS_GRAMS[product][material]) / 1000;
    return acc;
  }, { ...EMPTY_MATERIALS });
}

export function calculateProductionSchedule({
  purchaseOrders,
  supplyOrders,
  now
}: CalculateProductionScheduleInput): ProductionSchedule {
  const orderedPurchaseOrders = [...purchaseOrders].sort(comparePurchaseOrders);
  const orderedSupplyOrders = [...supplyOrders].sort(compareSupplyOrders);

  const supplyEvents = buildSupplyEvents(orderedSupplyOrders);
  const materialSummary = buildMaterialSummary(orderedSupplyOrders, now);
  const allocatedKg: RequiredMaterialsKg = { ...EMPTY_MATERIALS };

  const initialAvailability = initialLineAvailability(orderedPurchaseOrders, now);
  const lineAvailability = {
    oneLiterLine: initialAvailability.oneLiterLine,
    oneGallonLine: initialAvailability.oneGallonLine
  };

  const scheduledOrders: ScheduledOrder[] = [];

  for (const order of orderedPurchaseOrders) {
    const line = LINE_CONFIG[order.product];
    const lineKey = line.key;
    const requiredMaterialsKg = calculateRequiredMaterialsKg(order.product, order.quantity);
    const earliestLineStartAt = maxDate(lineAvailability[lineKey], order.createdAt);
    const materialAvailability = findMaterialAvailability({
      requiredMaterialsKg,
      supplyEvents,
      allocatedKg,
      earliestLineStartAt
    });

    if (!materialAvailability.canFulfill) {
      scheduledOrders.push({
        ...order,
        requiredMaterialsKg,
        expectedStartAt: null,
        expectedCompletionAt: null,
        status: "Unable to fulfill",
        lineName: line.lineName,
        delayReason: materialAvailability.reason
      });
      continue;
    }

    const expectedStartAt = maxDate(earliestLineStartAt, materialAvailability.availableAt);
    const durationMs = (order.quantity / line.capacityPerHour) * 60 * 60 * 1000;
    const expectedCompletionAt = new Date(expectedStartAt.getTime() + durationMs);
    const status = determineStatus({
      now,
      expectedStartAt,
      expectedCompletionAt,
      earliestLineStartAt,
      materialAvailableAt: materialAvailability.availableAt
    });

    for (const material of MATERIAL_TYPES) {
      allocatedKg[material] += requiredMaterialsKg[material];
    }

    lineAvailability[lineKey] = expectedCompletionAt;
    scheduledOrders.push({
      ...order,
      requiredMaterialsKg,
      expectedStartAt,
      expectedCompletionAt,
      status,
      lineName: line.lineName,
      delayReason:
        status === "Delay expected"
          ? "Material arrival is later than the production line's first available slot."
          : undefined
    });
  }

  return {
    scheduledOrders,
    currentProduction: {
      oneLiterLine: getLineState("1-Liter Production Line", scheduledOrders, now),
      oneGallonLine: getLineState("1-Gallon Production Line", scheduledOrders, now)
    },
    materialSummary: {
      ...materialSummary,
      allocatedKg
    }
  };
}

function findMaterialAvailability({
  requiredMaterialsKg,
  supplyEvents,
  allocatedKg,
  earliestLineStartAt
}: {
  requiredMaterialsKg: RequiredMaterialsKg;
  supplyEvents: Record<MaterialType, SupplyTimelineEvent[]>;
  allocatedKg: RequiredMaterialsKg;
  earliestLineStartAt: Date;
}): { canFulfill: true; availableAt: Date } | { canFulfill: false; reason: string } {
  const availabilityTimes: Date[] = [];
  const missingMaterials: string[] = [];

  for (const material of MATERIAL_TYPES) {
    const requiredKg = requiredMaterialsKg[material];
    const reservedKg = allocatedKg[material];
    const events = supplyEvents[material];
    const totalKg = events.reduce((sum, event) => sum + event.quantityKg, 0);

    if (totalKg - reservedKg + Number.EPSILON < requiredKg) {
      missingMaterials.push(material);
      continue;
    }

    let cumulativeKg = 0;
    let materialReadyAt: Date | null = null;

    for (const event of events) {
      cumulativeKg += event.quantityKg;
      if (cumulativeKg - reservedKg + Number.EPSILON >= requiredKg) {
        materialReadyAt = maxDate(event.at, earliestLineStartAt);
        break;
      }
    }

    availabilityTimes.push(materialReadyAt ?? earliestLineStartAt);
  }

  if (missingMaterials.length > 0) {
    return {
      canFulfill: false,
      reason: `Insufficient total material for: ${missingMaterials.join(", ")}.`
    };
  }

  return {
    canFulfill: true,
    availableAt: availabilityTimes.reduce(maxDate, earliestLineStartAt)
  };
}

function buildSupplyEvents(
  supplyOrders: SupplyOrderInput[]
): Record<MaterialType, SupplyTimelineEvent[]> {
  const events: Record<MaterialType, SupplyTimelineEvent[]> = {
    PET_RESIN: [],
    PTA: [],
    EG: []
  };

  for (const supply of supplyOrders) {
    events[supply.material].push({
      at: supply.eta,
      quantityKg: supply.quantityKg
    });
  }

  return events;
}

function buildMaterialSummary(supplyOrders: SupplyOrderInput[], now: Date) {
  const availableNowKg: RequiredMaterialsKg = { ...EMPTY_MATERIALS };
  const incomingKg: RequiredMaterialsKg = { ...EMPTY_MATERIALS };

  for (const supply of supplyOrders) {
    if (supply.eta.getTime() <= now.getTime()) {
      availableNowKg[supply.material] += supply.quantityKg;
    } else {
      incomingKg[supply.material] += supply.quantityKg;
    }
  }

  return { availableNowKg, incomingKg };
}

function determineStatus({
  now,
  expectedStartAt,
  expectedCompletionAt,
  earliestLineStartAt,
  materialAvailableAt
}: {
  now: Date;
  expectedStartAt: Date;
  expectedCompletionAt: Date;
  earliestLineStartAt: Date;
  materialAvailableAt: Date;
}): ProductionStatus {
  if (expectedCompletionAt.getTime() <= now.getTime()) {
    return "Completed";
  }

  if (
    expectedStartAt.getTime() <= now.getTime() &&
    now.getTime() < expectedCompletionAt.getTime()
  ) {
    return "In Production";
  }

  if (materialAvailableAt.getTime() > earliestLineStartAt.getTime()) {
    return "Delay expected";
  }

  return "Pending";
}

function getLineState(
  lineName: string,
  scheduledOrders: ScheduledOrder[],
  now: Date
): ProductionLineState {
  const lineOrders = scheduledOrders.filter(
    (order) => order.lineName === lineName && order.expectedStartAt && order.expectedCompletionAt
  );
  const currentOrder =
    lineOrders.find(
      (order) =>
        order.expectedStartAt &&
        order.expectedCompletionAt &&
        order.expectedStartAt.getTime() <= now.getTime() &&
        now.getTime() < order.expectedCompletionAt.getTime()
    ) ?? null;
  const nextOrder =
    lineOrders.find(
      (order) => order.expectedStartAt && order.expectedStartAt.getTime() > now.getTime()
    ) ?? null;

  return {
    lineName,
    currentOrder,
    nextOrder
  };
}

function initialLineAvailability(purchaseOrders: PurchaseOrderInput[], now: Date) {
  const oneLiterFirst = firstCreatedAtForProduct(purchaseOrders, "ONE_LITER_BOTTLE") ?? now;
  const oneGallonFirst = firstCreatedAtForProduct(purchaseOrders, "ONE_GALLON_BOTTLE") ?? now;

  return {
    oneLiterLine: minDate(oneLiterFirst, now),
    oneGallonLine: minDate(oneGallonFirst, now)
  };
}

function firstCreatedAtForProduct(purchaseOrders: PurchaseOrderInput[], product: ProductType) {
  return purchaseOrders.find((order) => order.product === product)?.createdAt;
}

function comparePurchaseOrders(a: PurchaseOrderInput, b: PurchaseOrderInput) {
  return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);
}

function compareSupplyOrders(a: SupplyOrderInput, b: SupplyOrderInput) {
  return (
    a.eta.getTime() - b.eta.getTime() ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.id.localeCompare(b.id)
  );
}

function maxDate(a: Date, b: Date) {
  return a.getTime() >= b.getTime() ? a : b;
}

function minDate(a: Date, b: Date) {
  return a.getTime() <= b.getTime() ? a : b;
}
