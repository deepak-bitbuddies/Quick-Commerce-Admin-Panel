import type { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"

import {
  verifyCredentials,
  InvalidCredentialsError,
  AccountDisabledError,
} from "../services/auth.service.js"

const loginSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
})

export async function loginHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) {
    reply.code(400).send({
      message: "Invalid login payload",
      issues: parsed.error.issues,
    })
    return
  }

  try {
    const user = await verifyCredentials(
      parsed.data.email,
      parsed.data.password,
    )

    // expiresIn defaults from the `sign` options passed at @fastify/jwt
    // registration time (config/fastify.ts) — no need to repeat it here.
    const token = await reply.jwtSign({
      id: String(user._id),
      role: user.role,
    })

    reply.send({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      reply.code(401).send({ message: err.message })
      return
    }
    if (err instanceof AccountDisabledError) {
      reply.code(403).send({ message: err.message })
      return
    }
    throw err
  }
}
