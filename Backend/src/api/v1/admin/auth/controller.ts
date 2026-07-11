import type { FastifyReply, FastifyRequest } from "fastify"

import { verifyCredentials } from "./service.js"
import { loginSchema } from "./schema.js"
import { toUserResponseDto } from "../users/index.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import type { LoginResponseDto } from "./dto.js"

export async function loginHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { email, password } = validateSchema(loginSchema, request.body)

  const user = await verifyCredentials(email, password)

  // expiresIn defaults from the `sign` options passed at @fastify/jwt
  // registration time (core/auth/jwt.plugin.ts) — no need to repeat it here.
  const token = await reply.jwtSign({
    id: String(user._id),
    role: user.role,
  })

  const data: LoginResponseDto = { token, user: toUserResponseDto(user) }
  sendSuccess(reply, data, "Login successful")
}
