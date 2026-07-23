export const ProductStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
  OUT_OF_STOCK: "out_of_stock", // kept for compatibility
} as const

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus]

export const ProductAvailability = {
  IN_STOCK: "in_stock",
  OUT_OF_STOCK: "out_of_stock",
  INCOMING: "incoming",
  DISCONTINUED: "discontinued",
} as const

export type ProductAvailability = (typeof ProductAvailability)[keyof typeof ProductAvailability]

export const ProductType = {
  SIMPLE: "simple",
  VARIABLE: "variable",
} as const

export type ProductType = (typeof ProductType)[keyof typeof ProductType]

export const VariantStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export type VariantStatus = (typeof VariantStatus)[keyof typeof VariantStatus]

export const VariantUnit = {
  GM: "gm",
  KG: "kg",
  LITRE: "litre",
  ML: "ml",
  PCS: "pcs",
} as const

export type VariantUnit = (typeof VariantUnit)[keyof typeof VariantUnit]

export const StockTransactionType = {
  INITIAL_STOCK: "INITIAL_STOCK",
  PURCHASE: "PURCHASE",
  RETURN: "RETURN",
  DAMAGE: "DAMAGE",
  EXPIRY: "EXPIRY",
  TRANSFER: "TRANSFER",
  MANUAL_ADJUSTMENT: "MANUAL_ADJUSTMENT",
  APP_SALE: "APP_SALE",
  LOCAL_SALE: "LOCAL_SALE",
  ORDER_CANCELLATION: "ORDER_CANCELLATION",
} as const

export type StockTransactionType = (typeof StockTransactionType)[keyof typeof StockTransactionType]
