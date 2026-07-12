import type { FastifyInstance } from "fastify"

import {
  createBrandHandler,
  listBrandsHandler,
  getBrandHandler,
  updateBrandHandler,
  setBrandStatusHandler,
  deleteBrandHandler,
  restoreBrandHandler,
  bulkDeleteBrandsHandler,
  bulkStatusBrandsHandler,
} from "./controller.js"
import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"

export async function brandsRoutes(fastify: FastifyInstance): Promise<void> {
  const guard = [requireAuth, requireRole(SystemRoleCode.SUPER_ADMIN)]

  fastify.post("/brands", { preHandler: guard }, createBrandHandler)
  fastify.get("/brands", { preHandler: guard }, listBrandsHandler)
  
  // Bulk Actions
  fastify.post("/brands/bulk-delete", { preHandler: guard }, bulkDeleteBrandsHandler)
  fastify.post("/brands/bulk-status", { preHandler: guard }, bulkStatusBrandsHandler)

  fastify.get("/brands/:brandId", { preHandler: guard }, getBrandHandler)
  fastify.patch("/brands/:brandId", { preHandler: guard }, updateBrandHandler)
  fastify.patch(
    "/brands/:brandId/status",
    { preHandler: guard },
    setBrandStatusHandler,
  )
  fastify.delete("/brands/:brandId", { preHandler: guard }, deleteBrandHandler)
  fastify.post("/brands/:brandId/restore", { preHandler: guard }, restoreBrandHandler)
}
