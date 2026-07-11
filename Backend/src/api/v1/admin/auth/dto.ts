import type { z } from "zod"

import type { loginSchema } from "./schema.js"
import type { UserResponseDto } from "../users/index.js"

export type LoginRequestDto = z.infer<typeof loginSchema>

export interface LoginResponseDto {
  token: string
  user: UserResponseDto
}
