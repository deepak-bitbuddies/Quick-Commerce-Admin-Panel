import type { FastifyInstance } from "fastify"

import {
  createBrandHandler,
  listBrandsHandler,
  getBrandHandler,
  updateBrandHandler,
  setBrandStatusHandler,
} from "./controller.js"
import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { UserRole } from "../../../../shared/enums/index.js"

export async function brandsRoutes(fastify: FastifyInstance): Promise<void> {
  const guard = [requireAuth, requireRole(UserRole.SUPER_ADMIN)]

  fastify.post("/brands", { preHandler: guard }, createBrandHandler)
  fastify.get("/brands", { preHandler: guard }, listBrandsHandler)
  fastify.get("/brands/:brandId", { preHandler: guard }, getBrandHandler)
  fastify.patch("/brands/:brandId", { preHandler: guard }, updateBrandHandler)
  fastify.patch(
    "/brands/:brandId/status",
    { preHandler: guard },
    setBrandStatusHandler,
  )
}
