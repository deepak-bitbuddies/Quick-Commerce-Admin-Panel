export const BrandStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const
export type BrandStatus = (typeof BrandStatus)[keyof typeof BrandStatus]
