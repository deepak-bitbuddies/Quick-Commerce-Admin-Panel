import type { FastifyInstance } from "fastify"

import {
  createBadgeHandler,
  listBadgesHandler,
  getBadgeHandler,
  updateBadgeHandler,
  setBadgeStatusHandler,
  deleteBadgeHandler,
  restoreBadgeHandler,
} from "./controller.js"
import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"

export async function badgesRoutes(fastify: FastifyInstance): Promise<void> {
  const guard = [requireAuth, requireRole(SystemRoleCode.SUPER_ADMIN)]

  fastify.post("/badges", { preHandler: guard }, createBadgeHandler)
  fastify.get("/badges", { preHandler: guard }, listBadgesHandler)
  fastify.get("/badges/:badgeId", { preHandler: guard }, getBadgeHandler)
  fastify.patch("/badges/:badgeId", { preHandler: guard }, updateBadgeHandler)
  fastify.patch(
    "/badges/:badgeId/status",
    { preHandler: guard },
    setBadgeStatusHandler,
  )
  fastify.delete("/badges/:badgeId", { preHandler: guard }, deleteBadgeHandler)
  fastify.post("/badges/:badgeId/restore", { preHandler: guard }, restoreBadgeHandler)
}
