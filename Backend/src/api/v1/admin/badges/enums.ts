export const BadgeStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const
export type BadgeStatus = (typeof BadgeStatus)[keyof typeof BadgeStatus]
