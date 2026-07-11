export const UserRole = {
  SUPER_ADMIN: "super_admin",
  RIDER: "rider",
  CUSTOMER: "customer",
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]
