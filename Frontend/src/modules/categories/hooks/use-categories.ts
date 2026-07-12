"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { ApiErrorPayload } from "@/lib/axios"
import {
  getCategories,
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  bulkReorderCategories,
  bulkDeleteCategories,
  bulkStatusUpdateCategories,
  type CategoryListParams,
  type CategoryListResult,
} from "../api/categories-api"
import type { CatalogNode, CatalogNodeTreeNode, CatalogNodeStatus } from "../types/category-types"

export const categoriesQueryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesQueryKeys.all, "list"] as const,
  list: (params: CategoryListParams) => [...categoriesQueryKeys.lists(), params] as const,
  trees: () => [...categoriesQueryKeys.all, "tree"] as const,
  details: () => [...categoriesQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoriesQueryKeys.details(), id] as const,
}

export function useCategoriesQuery(params: CategoryListParams) {
  return useQuery<CategoryListResult, ApiErrorPayload>({
    queryKey: categoriesQueryKeys.list(params),
    queryFn: () => getCategories(params),
    placeholderData: keepPreviousData,
  })
}

export function useCategoryTreeQuery() {
  return useQuery<CatalogNodeTreeNode[], ApiErrorPayload>({
    queryKey: categoriesQueryKeys.trees(),
    queryFn: () => getCategoryTree(),
  })
}

export function useCategoryQuery(id: string, enabled = true) {
  return useQuery<CatalogNode, ApiErrorPayload>({
    queryKey: categoriesQueryKeys.detail(id),
    queryFn: () => getCategory(id),
    enabled: !!id && enabled,
  })
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => updateCategory(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.detail(variables.id) })
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => deleteCategory(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.detail(variables.id) })
    },
  })
}

export function useRestoreCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restoreCategory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.detail(id) })
    },
  })
}

export function useBulkReorderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (nodes: Array<{ id: string; sortOrder: number }>) => bulkReorderCategories(nodes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
    },
  })
}

export function useBulkDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason?: string }) => bulkDeleteCategories(ids, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
    },
  })
}

export function useBulkStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: CatalogNodeStatus }) =>
      bulkStatusUpdateCategories(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
    },
  })
}
