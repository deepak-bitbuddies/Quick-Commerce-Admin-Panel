import type { FastifyInstance } from "fastify"

import { authRoutes } from "./admin/auth/index.js"
import { registerAdminRoutes } from "./admin/index.js"
import { publicSettingsRoutes } from "./admin/settings/index.js"
import { publicCategoriesRoutes } from "./admin/categories/index.js"
import { publicProductsRoutes } from "./admin/products/index.js"

export async function registerV1Routes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(authRoutes, { prefix: "/api/v1/auth" })
  await fastify.register(registerAdminRoutes, { prefix: "/api/v1/admin" })
  await fastify.register(publicSettingsRoutes, { prefix: "/api/v1" })
  await fastify.register(publicCategoriesRoutes, { prefix: "/api/v1" })
  await fastify.register(publicProductsRoutes, { prefix: "/api/v1" })
}
