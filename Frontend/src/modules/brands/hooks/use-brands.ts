"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { ApiErrorPayload } from "@/lib/axios"
import {
  createBrand,
  getBrands,
  updateBrand,
  updateBrandStatus,
} from "../api/brands-api"
import { brandsQueryKeys } from "../constants/query-keys"
import type {
  BrandListParams,
  BrandListResult,
  CreateBrandInput,
  UpdateBrandInput,
  UpdateBrandStatusInput,
} from "../types/brand"

/**
 * List query. `placeholderData: keepPreviousData` keeps the previously
 * fetched rows visible (dimmed by the caller via `isFetching`) instead of
 * tearing down to a full skeleton on every page/search/status change — per
 * `.claude/ui/playbooks/data-table.md`'s Loading section. Explicitly typed
 * against `ApiErrorPayload` (rather than react-query's default `Error`) so
 * callers can branch on `.status` (403 permission / no-status network
 * failure) without an `as` cast at every call site.
 */
export function useBrandsQuery(params: BrandListParams) {
  return useQuery<BrandListResult, ApiErrorPayload>({
    queryKey: brandsQueryKeys.list(params),
    queryFn: () => getBrands(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBrandInput) => createBrand(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() })
    },
  })
}

export function useUpdateBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      brandId,
      input,
    }: {
      brandId: string
      input: UpdateBrandInput
    }) => updateBrand(brandId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() })
    },
  })
}

export function useUpdateBrandStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      brandId,
      input,
    }: {
      brandId: string
      input: UpdateBrandStatusInput
    }) => updateBrandStatus(brandId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() })
    },
  })
}
