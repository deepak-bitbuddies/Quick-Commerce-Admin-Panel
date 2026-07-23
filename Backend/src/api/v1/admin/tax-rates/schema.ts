import { z } from "zod"

const objectIdRegex = /^[0-9a-fA-F]{24}$/

export const createTaxRateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sgst: z.number().nonnegative("SGST must be non-negative").max(100, "SGST cannot exceed 100"),
  cgst: z.number().nonnegative("CGST must be non-negative").max(100, "CGST cannot exceed 100"),
  igst: z.number().nonnegative("IGST must be non-negative").max(100, "IGST cannot exceed 100"),
  cess: z.number().nonnegative("Cess must be non-negative").max(100, "Cess cannot exceed 100").default(0),
  description: z.string().optional(),
})

export const updateTaxRateSchema = z.object({
  name: z.string().min(1).optional(),
  sgst: z.number().nonnegative().max(100).optional(),
  cgst: z.number().nonnegative().max(100).optional(),
  igst: z.number().nonnegative().max(100).optional(),
  cess: z.number().nonnegative().max(100).optional(),
  description: z.string().nullable().optional(),
})

export const listTaxRatesQuerySchema = z.object({
  search: z.string().min(1).max(100).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

export const taxRateIdParamsSchema = z.object({
  taxRateId: z.string().regex(objectIdRegex, "Invalid tax rate id format"),
})
