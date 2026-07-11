import type { BrandListParams } from "../types/brand"

/**
 * Centralized query key factory (per `Frontend/AGENTS.md` rule 18) — never
 * type `["brands", ...]` by hand in a hook/component.
 */
export const brandsQueryKeys = {
  all: ["brands"] as const,
  lists: () => [...brandsQueryKeys.all, "list"] as const,
  list: (params: BrandListParams) =>
    [...brandsQueryKeys.lists(), params] as const,
  details: () => [...brandsQueryKeys.all, "detail"] as const,
  detail: (brandId: string) =>
    [...brandsQueryKeys.details(), brandId] as const,
}
