export {
  BackendRoute,
  adminUserRoute,
  adminUserStatusRoute,
  adminBrandRoute,
  adminBrandStatusRoute,
  adminSettingsGroupRoute,
} from "./backend-routes"

export const DEFAULT_PAGE_SIZE = Number(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE) || 10

