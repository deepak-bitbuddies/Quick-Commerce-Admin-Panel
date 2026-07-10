import type { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"

import {
  createUserAccount,
  getUserById,
  getUsers,
  updateUserActiveStatus,
  UserServiceError,
} from "../services/user.service.js"
import { UserRole } from "../../../../types/enums/index.js"

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum([UserRole.SUPER_ADMIN, UserRole.RIDER, UserRole.CUSTOMER]),
})

export async function createUserHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = createUserSchema.safeParse(request.body)
  if (!parsed.success) {
    reply.code(400).send({
      message: "Invalid user payload",
      issues: parsed.error.issues,
    })
    return
  }

  const user = await createUserAccount(parsed.data)
  reply.code(201).send({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  })
}

const listUsersQuerySchema = z.object({
  role: z.enum([UserRole.SUPER_ADMIN, UserRole.RIDER, UserRole.CUSTOMER]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

export async function listUsersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = listUsersQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    reply.code(400).send({ message: "Invalid query", issues: parsed.error.issues })
    return
  }

  const result = await getUsers(parsed.data)
  reply.send(result)
}

const userIdParamsSchema = z.object({ userId: z.string().min(1) })

export async function getUserHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = userIdParamsSchema.safeParse(request.params)
  if (!parsed.success) {
    reply.code(400).send({ message: "userId is required" })
    return
  }

  try {
    const user = await getUserById(parsed.data.userId)
    reply.send(user)
  } catch (err) {
    if (err instanceof UserServiceError) {
      reply.code(404).send({ message: err.message })
      return
    }
    throw err
  }
}

const setStatusBodySchema = z.object({ isActive: z.boolean() })

export async function setUserStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const params = userIdParamsSchema.safeParse(request.params)
  const body = setStatusBodySchema.safeParse(request.body)

  if (!params.success || !body.success) {
    reply.code(400).send({ message: "Invalid request" })
    return
  }

  try {
    const user = await updateUserActiveStatus(
      params.data.userId,
      body.data.isActive,
    )
    reply.send(user)
  } catch (err) {
    if (err instanceof UserServiceError) {
      reply.code(404).send({ message: err.message })
      return
    }
    throw err
  }
}
