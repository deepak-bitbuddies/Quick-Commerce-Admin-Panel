import { z } from "zod"



export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().min(1),
})

export const listUsersQuerySchema = z.object({
  role: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

export const userIdParamsSchema = z.object({ userId: z.string().min(1) })

export const setStatusBodySchema = z.object({ isActive: z.boolean() })
