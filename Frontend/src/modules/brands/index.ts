export { BrandsListPage } from "./pages/brands-list-page"

export { BrandFormDialog } from "./components/brand-form"

export {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  updateBrandStatus,
} from "./api/brands-api"

export {
  useBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useUpdateBrandStatusMutation,
  useDeleteBrandMutation,
  useRestoreBrandMutation,
  useBulkDeleteBrandsMutation,
  useBulkStatusBrandsMutation,
} from "./hooks/use-brands"

export { brandsQueryKeys } from "./constants/query-keys"
export { BRAND_SEARCH_DEBOUNCE_MS, DEFAULT_BRAND_PAGE_SIZE } from "./constants/brands"

export { brandFormSchema, type BrandFormInput, type BrandFormOutput } from "./schema/brand-schema"

export type {
  Brand,
  BrandStatus,
  BrandListParams,
  BrandListMeta,
  BrandListResult,
  CreateBrandInput,
  UpdateBrandInput,
  UpdateBrandStatusInput,
} from "./types/brand"
export { BRAND_STATUSES } from "./types/brand"
