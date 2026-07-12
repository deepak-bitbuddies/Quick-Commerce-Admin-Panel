import type { FastifyInstance } from "fastify"

import {
  getSettingsHandler,
  getPlatformConfigHandler,
  updateSettingsGroupHandler,
} from "./controller.js"
import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"

export async function adminSettingsRoutes(fastify: FastifyInstance): Promise<void> {
  const guard = [requireAuth, requireRole(SystemRoleCode.SUPER_ADMIN)]

  fastify.get("/settings", { preHandler: guard }, getSettingsHandler)
  fastify.patch("/settings/:groupId", { preHandler: guard }, updateSettingsGroupHandler)
}

export async function publicSettingsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/platform-config", getPlatformConfigHandler)
}
