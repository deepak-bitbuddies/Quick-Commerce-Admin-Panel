import type { FastifyReply, FastifyRequest } from "fastify"

import { verifyCredentials } from "./service.js"
import { loginSchema } from "./schema.js"
import { toUserResponseDto } from "../users/index.js"
import { RoleModel } from "../roles/index.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import type { LoginResponseDto } from "./dto.js"

export async function loginHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { email, password } = validateSchema(loginSchema, request.body)

  const user = await verifyCredentials(email, password)

  // Resolve user.role GUID to stable role code
  const roleDoc = await RoleModel.findById(user.role).lean()
  const roleCode = roleDoc ? roleDoc.code : "customer"

  // expiresIn defaults from the `sign` options passed at @fastify/jwt
  // registration time (core/auth/jwt.plugin.ts) — no need to repeat it here.
  const token = await reply.jwtSign({
    id: String(user._id),
    role: roleCode,
  })

  // Map user to public DTO, swapping the database GUID with the session roleCode
  const mappedUser = toUserResponseDto({
    ...user,
    role: roleCode,
  })

  const data: LoginResponseDto = { token, user: mappedUser }
  sendSuccess(reply, data, "Login successful")
}
