import { api } from "@/lib/axios"
import type {
  Brand,
  BrandListParams,
  BrandListResult,
  CreateBrandInput,
  UpdateBrandInput,
  UpdateBrandStatusInput,
} from "../types/brand"

/**
 * Client-side calls against this app's own `/api/brands*` Route Handlers
 * (see `src/app/api/brands/`), which in turn call the real Fastify backend
 * server-side via `backendFetch`/`backendFetchWithMeta` — these are
 * `super_admin`-gated endpoints that need the caller's JWT, which only the
 * server-side proxy attaches (per `Frontend/AGENTS.md`'s backend response
 * contract).
 */
export async function getBrands(
  params: BrandListParams = {}
): Promise<BrandListResult> {
  const { data } = await api.get<{
    data: Brand[]
    meta: BrandListResult["meta"]
  }>("/brands", { params })
  return { brands: data.data, meta: data.meta }
}

export async function getBrand(brandId: string): Promise<Brand> {
  const { data } = await api.get<{ data: Brand }>(`/brands/${brandId}`)
  return data.data
}

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const { data } = await api.post<{ data: Brand }>("/brands", input)
  return data.data
}

export async function updateBrand(
  brandId: string,
  input: UpdateBrandInput
): Promise<Brand> {
  const { data } = await api.patch<{ data: Brand }>(
    `/brands/${brandId}`,
    input
  )
  return data.data
}

export async function updateBrandStatus(
  brandId: string,
  input: UpdateBrandStatusInput
): Promise<Brand> {
  const { data } = await api.patch<{ data: Brand }>(
    `/brands/${brandId}/status`,
    input
  )
  return data.data
}

export async function deleteBrand(brandId: string, reason?: string): Promise<Brand> {
  const { data } = await api.delete<{ data: Brand }>(`/brands/${brandId}`, {
    params: { reason },
  })
  return data.data
}

export async function restoreBrand(brandId: string): Promise<Brand> {
  const { data } = await api.post<{ data: Brand }>(`/brands/${brandId}/restore`)
  return data.data
}

export async function bulkDeleteBrands(
  ids: string[],
  reason?: string
): Promise<void> {
  await api.post("/brands/bulk-delete", { ids, reason })
}

export async function bulkStatusUpdateBrands(
  ids: string[],
  status: string
): Promise<void> {
  await api.post("/brands/bulk-status", { ids, status })
}
