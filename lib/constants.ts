export const PRODUCT_TYPES = ["ONE_LITER_BOTTLE", "ONE_GALLON_BOTTLE"] as const;
export const MATERIAL_TYPES = ["PET_RESIN", "PTA", "EG"] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const PRODUCT_LABELS: Record<ProductType, string> = {
  ONE_LITER_BOTTLE: "1-Liter Bottle",
  ONE_GALLON_BOTTLE: "1-Gallon Bottle"
};

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  PET_RESIN: "PET Resin",
  PTA: "PTA",
  EG: "EG"
};

export const LINE_CONFIG = {
  ONE_LITER_BOTTLE: {
    key: "oneLiterLine",
    lineName: "1-Liter Production Line",
    capacityPerHour: 2000
  },
  ONE_GALLON_BOTTLE: {
    key: "oneGallonLine",
    lineName: "1-Gallon Production Line",
    capacityPerHour: 1500
  }
} as const satisfies Record<
  ProductType,
  {
    key: "oneLiterLine" | "oneGallonLine";
    lineName: string;
    capacityPerHour: number;
  }
>;

export const MATERIAL_REQUIREMENTS_GRAMS: Record<ProductType, Record<MaterialType, number>> = {
  ONE_LITER_BOTTLE: {
    PET_RESIN: 20,
    PTA: 15,
    EG: 10
  },
  ONE_GALLON_BOTTLE: {
    PET_RESIN: 65,
    PTA: 45,
    EG: 20
  }
};
