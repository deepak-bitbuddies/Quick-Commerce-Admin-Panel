import { api } from "@/lib/axios"
import type {
  CatalogNode,
  CatalogNodeTreeNode,
  CatalogNodeStatus,
} from "../types/category-types"

export interface CategoryListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: CatalogNodeStatus
  type?: string
  // true -> only soft-deleted nodes (the "deleted" view, for Restore).
  // Omitted/false -> the default view, which never includes deleted nodes.
  deleted?: boolean
}

export interface CategoryListResult {
  nodes: CatalogNode[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

export async function getCategories(
  params: CategoryListParams = {}
): Promise<CategoryListResult> {
  const { data } = await api.get<{
    data: CatalogNode[]
    meta: CategoryListResult["meta"]
  }>("/categories", { params })
  return { nodes: data.data, meta: data.meta }
}

export async function getCategoryTree(): Promise<CatalogNodeTreeNode[]> {
  const { data } = await api.get<{ data: CatalogNodeTreeNode[] }>("/categories/tree")
  return data.data
}

export async function getCategory(id: string): Promise<CatalogNode> {
  const { data } = await api.get<{ data: CatalogNode }>(`/categories/${id}`)
  return data.data
}

export async function createCategory(input: Record<string, unknown>): Promise<CatalogNode> {
  const { data } = await api.post<{ data: CatalogNode }>("/categories", input)
  return data.data
}

export async function updateCategory(
  id: string,
  input: Record<string, unknown>
): Promise<CatalogNode> {
  const { data } = await api.patch<{ data: CatalogNode }>(
    `/categories/${id}`,
    input
  )
  return data.data
}

export async function deleteCategory(id: string, reason?: string): Promise<CatalogNode> {
  const { data } = await api.delete<{ data: CatalogNode }>(
    `/categories/${id}`,
    { params: { reason } }
  )
  return data.data
}

export async function restoreCategory(id: string): Promise<CatalogNode> {
  const { data } = await api.post<{ data: CatalogNode }>(`/categories/${id}/restore`)
  return data.data
}

export async function bulkReorderCategories(
  nodes: Array<{ id: string; sortOrder: number }>
): Promise<void> {
  await api.post("/categories/bulk-reorder", { nodes })
}

export async function bulkDeleteCategories(
  ids: string[],
  reason?: string
): Promise<void> {
  await api.post("/categories/bulk-delete", { ids, reason })
}

export async function bulkStatusUpdateCategories(
  ids: string[],
  status: CatalogNodeStatus
): Promise<void> {
  await api.post("/categories/bulk-status", { ids, status })
}
