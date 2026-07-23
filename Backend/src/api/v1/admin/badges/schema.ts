import { z } from "zod"

import { BadgeStatus } from "./enums.js"

const statusSchema = z.enum([BadgeStatus.ACTIVE, BadgeStatus.INACTIVE])

export const createBadgeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().min(1, "Color is required").max(50),
  textColor: z.string().min(1, "Text color is required").max(50),
})

export const updateBadgeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().min(1).max(50).optional(),
  textColor: z.string().min(1).max(50).optional(),
  status: statusSchema.optional(),
})

export const listBadgesQuerySchema = z.object({
  search: z.string().max(100).optional(),
  status: statusSchema.optional(),
  deleted: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

export const badgeIdParamsSchema = z.object({
  badgeId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid badge id"),
})

export const setStatusBodySchema = z.object({
  status: statusSchema,
})
