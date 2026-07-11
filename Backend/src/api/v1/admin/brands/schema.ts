import { z } from "zod"

import { BrandStatus } from "./enums.js"

export const createBrandSchema = z.object({
  name: z.string().min(1),
  logo: z.string().url().optional(),
  description: z.string().optional(),
})

// `.nullable()` on logo/description carries real meaning here, distinct from
// `.optional()`: an omitted key means "don't touch this field" (repository
// skips it), while an explicit `null` means "clear this field" (repository
// $unsets it) — see repository.ts's `updateBrand`. Without this distinction
// a client had no way to clear an already-set value (Code Review finding).
export const updateBrandSchema = z.object({
  name: z.string().min(1).optional(),
  logo: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const listBrandsQuerySchema = z.object({
  // Capped to bound the cost of the case-insensitive regex scan in
  // repository.ts's listBrands — see the escaping there for the matching
  // ReDoS mitigation (Security review finding).
  search: z.string().min(1).max(100).optional(),
  status: z.enum([BrandStatus.ACTIVE, BrandStatus.INACTIVE]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

// A 24-char hex string is the only shape Mongo's default ObjectId accepts —
// rejecting anything else here as a clean 400 (ValidationError) prevents an
// uncaught Mongoose CastError from reaching the global handler as a generic
// 500 (Testing review finding).
export const brandIdParamsSchema = z.object({
  brandId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid brand id"),
})

export const setStatusBodySchema = z.object({
  status: z.enum([BrandStatus.ACTIVE, BrandStatus.INACTIVE]),
})
