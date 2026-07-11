import type { FastifyReply, FastifyRequest } from "fastify"

import { createUserAccount, getUsers, getUserById, updateUserActiveStatus } from "./service.js"
import { toUserResponseDto } from "./mapper.js"
import {
  createUserSchema,
  listUsersQuerySchema,
  setStatusBodySchema,
  userIdParamsSchema,
} from "./schema.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"

export async function createUserHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = validateSchema(createUserSchema, request.body)
  const user = await createUserAccount(body)
  sendSuccess(reply, toUserResponseDto(user), "User created", 201)
}

export async function listUsersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const query = validateSchema(listUsersQuerySchema, request.query)
  const { users, total } = await getUsers(query)
  sendSuccess(reply, users.map(toUserResponseDto), "Users fetched", 200, {
    total,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  })
}

export async function getUserHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { userId } = validateSchema(userIdParamsSchema, request.params)
  const user = await getUserById(userId)
  sendSuccess(reply, toUserResponseDto(user))
}

export async function setUserStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { userId } = validateSchema(userIdParamsSchema, request.params)
  const { isActive } = validateSchema(setStatusBodySchema, request.body)
  const user = await updateUserActiveStatus(userId, isActive)
  sendSuccess(reply, toUserResponseDto(user), "User status updated")
}
