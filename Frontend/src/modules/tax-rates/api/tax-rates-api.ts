import { api } from "@/lib/axios"
import type {
  TaxRate,
  TaxRatesListParams,
  TaxRatesListResult,
  CreateTaxRateInput,
  UpdateTaxRateInput,
} from "../types/tax-rate"

export async function getTaxRates(
  params: TaxRatesListParams = {}
): Promise<TaxRatesListResult> {
  const { data } = await api.get<{
    data: TaxRate[]
    meta: TaxRatesListResult["meta"]
  }>("/tax-rates", { params })
  return { nodes: data.data, meta: data.meta }
}

export async function getTaxRate(taxRateId: string): Promise<TaxRate> {
  const { data } = await api.get<{ data: TaxRate }>(`/tax-rates/${taxRateId}`)
  return data.data
}

export async function createTaxRate(input: CreateTaxRateInput): Promise<TaxRate> {
  const { data } = await api.post<{ data: TaxRate }>("/tax-rates", input)
  return data.data
}

export async function updateTaxRate(
  taxRateId: string,
  input: UpdateTaxRateInput
): Promise<TaxRate> {
  const { data } = await api.patch<{ data: TaxRate }>(
    `/tax-rates/${taxRateId}`,
    input
  )
  return data.data
}

export async function deleteTaxRate(taxRateId: string): Promise<void> {
  await api.delete(`/tax-rates/${taxRateId}`)
}
