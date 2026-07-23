import type { z } from "zod"

import type { BadgeStatus } from "./enums.js"
import type {
  createBadgeSchema,
  updateBadgeSchema,
  listBadgesQuerySchema,
  setStatusBodySchema,
} from "./schema.js"

export type CreateBadgeDto = z.infer<typeof createBadgeSchema>
export type UpdateBadgeDto = z.infer<typeof updateBadgeSchema>
export type ListBadgesQueryDto = z.infer<typeof listBadgesQuerySchema>
export type SetBadgeStatusDto = z.infer<typeof setStatusBodySchema>

export interface BadgeResponseDto {
  id: string
  name: string
  color: string
  textColor: string
  status: BadgeStatus
  isDeleted: boolean
  deletedAt?: Date
  deletedReason?: string
  createdAt: Date
}
