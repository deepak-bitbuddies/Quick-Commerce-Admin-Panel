import type { z } from "zod"

import type { UserRole } from "../../../../shared/enums/index.js"
import type {
  createUserSchema,
  listUsersQuerySchema,
  setStatusBodySchema,
} from "./schema.js"

export type CreateUserDto = z.infer<typeof createUserSchema>
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>
export type UpdateUserStatusDto = z.infer<typeof setStatusBodySchema>

export interface UserResponseDto {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  isActive: boolean
  createdAt: Date
}
