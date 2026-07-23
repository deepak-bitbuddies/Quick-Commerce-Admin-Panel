import type { FastifyInstance } from "fastify"

import { usersRoutes } from "./users/index.js"
import { brandsRoutes } from "./brands/index.js"
import { adminSettingsRoutes } from "./settings/index.js"
import { adminCategoriesRoutes } from "./categories/index.js"
import { adminProductsRoutes } from "./products/index.js"
import { taxRatesRoutes } from "./tax-rates/index.js"
import { badgesRoutes } from "./badges/index.js"

export async function registerAdminRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(usersRoutes)
  await fastify.register(brandsRoutes)
  await fastify.register(adminSettingsRoutes)
  await fastify.register(adminCategoriesRoutes)
  await fastify.register(adminProductsRoutes)
  await fastify.register(taxRatesRoutes)
  await fastify.register(badgesRoutes)
}
