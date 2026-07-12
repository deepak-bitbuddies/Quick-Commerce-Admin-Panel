/**
 * Mirrors the confirmed live contract of `Backend`'s
 * `/api/v1/admin/brands` router (`super_admin`-only).
 */
export type BrandStatus = "ACTIVE" | "INACTIVE"

export const BRAND_STATUSES: BrandStatus[] = ["ACTIVE", "INACTIVE"]

export interface Brand {
  id: string
  name: string
  logo?: string
  description?: string
  status: BrandStatus
  // Delete/restore is orthogonal to status — a brand can be soft-deleted
  // regardless of its ACTIVE/INACTIVE value. Only present when the list was
  // fetched with `deleted: true` (see BrandListParams) — the default view
  // never returns deleted brands at all.
  isDeleted?: boolean
  deletedReason?: string
  createdAt: string
}

export interface CreateBrandInput {
  name: string
  logo?: string
  description?: string
}

export interface UpdateBrandInput {
  name?: string
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
  // true -> only soft-deleted brands (the "deleted" view, for Restore).
  // Omitted/false -> the default view, which never includes deleted brands.
  deleted?: boolean
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
