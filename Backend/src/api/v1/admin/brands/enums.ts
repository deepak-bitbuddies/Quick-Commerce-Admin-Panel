export const BrandStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const
export type BrandStatus = (typeof BrandStatus)[keyof typeof BrandStatus]
