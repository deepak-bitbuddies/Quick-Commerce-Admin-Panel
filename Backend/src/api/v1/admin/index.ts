import type { FastifyInstance } from "fastify"

import { usersRoutes } from "./users/index.js"
import { brandsRoutes } from "./brands/index.js"

// Deferred to a later pass: roles/, permissions/, dashboard/, products/,
// categories/, inventory/, orders/, customers/, sellers/, stores/,
// delivery/, coupons/, promotions/, banners/, analytics/, reports/,
// settings/, notifications/, uploads/.
export async function registerAdminRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(usersRoutes)
  await fastify.register(brandsRoutes)
}
