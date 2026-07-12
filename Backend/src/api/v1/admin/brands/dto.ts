import type { z } from "zod"

import type { BrandStatus } from "./enums.js"
import type {
  createBrandSchema,
  updateBrandSchema,
  listBrandsQuerySchema,
  setStatusBodySchema,
} from "./schema.js"

export type CreateBrandDto = z.infer<typeof createBrandSchema>
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>
export type ListBrandsQueryDto = z.infer<typeof listBrandsQuerySchema>
export type SetBrandStatusDto = z.infer<typeof setStatusBodySchema>

export interface BrandResponseDto {
  id: string
  name: string
  logo?: string
  description?: string
  status: BrandStatus
  // Delete/restore is orthogonal to status (see repository.ts) — the UI
  // needs isDeleted directly to know when a row is only reachable via the
  // `deleted=true` list view and should show Restore instead of Edit/
  // Delete/Activate/Deactivate.
  isDeleted: boolean
  deletedAt?: Date
  deletedReason?: string
  createdAt: Date
}
