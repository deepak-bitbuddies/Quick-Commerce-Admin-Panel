import type { FastifyInstance } from "fastify"

import {
  createUserHandler,
  listUsersHandler,
  getUserHandler,
  setUserStatusHandler,
} from "../controllers/user.controller.js"
import { requireAuth, requireRole } from "../../../../middlewares/auth.middleware.js"
import { UserRole } from "../../../../types/enums/index.js"

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  const guard = [requireAuth, requireRole(UserRole.SUPER_ADMIN)]

  fastify.post("/users", { preHandler: guard }, createUserHandler)
  fastify.get("/users", { preHandler: guard }, listUsersHandler)
  fastify.get("/users/:userId", { preHandler: guard }, getUserHandler)
  fastify.patch("/users/:userId/status", { preHandler: guard }, setUserStatusHandler)
}
