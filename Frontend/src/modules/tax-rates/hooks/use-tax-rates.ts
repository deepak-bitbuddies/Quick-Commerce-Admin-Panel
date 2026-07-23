"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { ApiErrorPayload } from "@/lib/axios"
import {
  getTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
} from "../api/tax-rates-api"
import type {
  TaxRate,
  TaxRatesListParams,
  TaxRatesListResult,
  CreateTaxRateInput,
  UpdateTaxRateInput,
} from "../types/tax-rate"

const taxRatesQueryKeys = {
  all: ["tax-rates"] as const,
  lists: () => [...taxRatesQueryKeys.all, "list"] as const,
  list: (params: TaxRatesListParams) => [...taxRatesQueryKeys.lists(), params] as const,
  details: () => [...taxRatesQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...taxRatesQueryKeys.details(), id] as const,
}

export function useTaxRatesQuery(params: TaxRatesListParams = {}) {
  return useQuery<TaxRatesListResult, ApiErrorPayload>({
    queryKey: taxRatesQueryKeys.list(params),
    queryFn: () => getTaxRates(params),
    placeholderData: keepPreviousData,
  })
}

export function useTaxRateQuery(taxRateId: string) {
  return useQuery<TaxRate, ApiErrorPayload>({
    queryKey: taxRatesQueryKeys.detail(taxRateId),
    queryFn: () => getTaxRate(taxRateId),
    enabled: !!taxRateId,
  })
}

export function useCreateTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTaxRateInput) => createTaxRate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.lists() })
    },
  })
}

export function useUpdateTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taxRateId,
      input,
    }: {
      taxRateId: string
      input: UpdateTaxRateInput
    }) => updateTaxRate(taxRateId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.detail(variables.taxRateId) })
    },
  })
}

export function useDeleteTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taxRateId: string) => deleteTaxRate(taxRateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.lists() })
    },
  })
}
