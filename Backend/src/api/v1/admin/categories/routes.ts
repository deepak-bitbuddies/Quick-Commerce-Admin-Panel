import type { FastifyInstance } from "fastify"

import {
  createNodeHandler,
  getNodeByIdHandler,
  getNodeBySlugHandler,
  updateNodeHandler,
  deleteNodeHandler,
  restoreNodeHandler,
  getFlatNodesHandler,
  getTreeHandler,
  getMenuHandler,
  getHomeNodesHandler,
  getBreadcrumbsHandler,
  bulkReorderHandler,
  bulkDeleteHandler,
  bulkStatusHandler,
} from "./controller.js"
import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"

export async function adminCategoriesRoutes(fastify: FastifyInstance): Promise<void> {
  const guard = [requireAuth, requireRole(SystemRoleCode.SUPER_ADMIN)]

  fastify.post("/categories", { preHandler: guard }, createNodeHandler)
  fastify.get("/categories", { preHandler: guard }, getFlatNodesHandler)
  fastify.get("/categories/tree", { preHandler: guard }, getTreeHandler)
  fastify.get("/categories/:id", { preHandler: guard }, getNodeByIdHandler)
  fastify.patch("/categories/:id", { preHandler: guard }, updateNodeHandler)
  fastify.delete("/categories/:id", { preHandler: guard }, deleteNodeHandler)
  fastify.post("/categories/:id/restore", { preHandler: guard }, restoreNodeHandler)
  fastify.post("/categories/bulk-reorder", { preHandler: guard }, bulkReorderHandler)
  fastify.post("/categories/bulk-delete", { preHandler: guard }, bulkDeleteHandler)
  fastify.post("/categories/bulk-status", { preHandler: guard }, bulkStatusHandler)
}

export async function publicCategoriesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/categories/tree", getTreeHandler)
  fastify.get("/categories/navigation", getMenuHandler)
  fastify.get("/categories/menu", getMenuHandler)
  fastify.get("/categories/home", getHomeNodesHandler)
  fastify.get("/categories/by-slug/:slug", getNodeBySlugHandler)
  fastify.get("/categories/by-slug/:slug/breadcrumbs", getBreadcrumbsHandler)
}
