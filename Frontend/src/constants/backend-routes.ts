/**
 * Single source of truth for the Fastify backend's route paths (see
 * Backend/src/api/v1/index.ts and its sub-routers). Use these instead of
 * hardcoding path strings when calling `backendFetch` / building
 * `${BACKEND_API_URL}...` requests.
 */
export enum BackendRoute {
  AuthLogin = "/api/v1/auth/login",
  AdminUsers = "/api/v1/admin/users",
  AdminBrands = "/api/v1/admin/brands",
}

export function adminUserRoute(userId: string): string {
  return `/api/v1/admin/users/${userId}`
}

export function adminUserStatusRoute(userId: string): string {
  return `/api/v1/admin/users/${userId}/status`
}

export function adminBrandRoute(brandId: string): string {
  return `/api/v1/admin/brands/${brandId}`
}

export function adminBrandStatusRoute(brandId: string): string {
  return `/api/v1/admin/brands/${brandId}/status`
}
