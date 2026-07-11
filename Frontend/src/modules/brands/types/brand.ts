/**
 * Mirrors the confirmed live contract of `Backend`'s
 * `/api/v1/admin/brands` router (`super_admin`-only). Note the response
 * field is `logo`, not `logoUrl`.
 */
export type BrandStatus = "active" | "inactive"

export const BRAND_STATUSES: BrandStatus[] = ["active", "inactive"]

export interface Brand {
  id: string
  name: string
  logo?: string
  description?: string
  status: BrandStatus
  createdAt: string
}

export interface CreateBrandInput {
  name: string
  logo?: string
  description?: string
}

export interface UpdateBrandInput {
  name?: string
  // `null` explicitly clears the field on the backend; `undefined` (key
  // omitted) leaves it untouched — see brand-form.tsx's edit-mode submit
  // handler, which is the only place that needs to send `null`.
  logo?: string | null
  description?: string | null
}

export interface UpdateBrandStatusInput {
  status: BrandStatus
}

export interface BrandListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: BrandStatus
}

export interface BrandListMeta {
  total: number
  page: number
  pageSize: number
}

export interface BrandListResult {
  brands: Brand[]
  meta: BrandListMeta
}
