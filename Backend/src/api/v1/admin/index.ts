import type { FastifyInstance } from "fastify"

import { usersRoutes } from "./users/index.js"
import { brandsRoutes } from "./brands/index.js"
import { adminSettingsRoutes } from "./settings/index.js"
import { adminCategoriesRoutes } from "./categories/index.js"

export async function registerAdminRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(usersRoutes)
  await fastify.register(brandsRoutes)
  await fastify.register(adminSettingsRoutes)
  await fastify.register(adminCategoriesRoutes)
}
