export interface TaxRate {
  id: string
  name: string
  sgst: number
  cgst: number
  igst: number
  cess: number
  description?: string
  createdAt: string
}

export interface CreateTaxRateInput {
  name: string
  sgst: number
  cgst: number
  igst: number
  cess?: number
  description?: string
}

export interface UpdateTaxRateInput {
  name?: string
  sgst?: number
  cgst?: number
  igst?: number
  cess?: number
  description?: string | null
}

export interface TaxRatesListParams {
  search?: string
  page?: number
  pageSize?: number
}

export interface TaxRatesListResult {
  nodes: TaxRate[]
  meta: {
    total: number
    page: number
    limit: number
  }
}
