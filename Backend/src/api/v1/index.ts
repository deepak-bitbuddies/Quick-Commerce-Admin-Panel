import type { FastifyInstance } from "fastify"

import { authRoutes } from "./auth/routes/index.js"
import { adminRoutes } from "./admin/routes/index.js"

// Deferred to a later pass: customer/ (home, orders) and rider/ (shift,
// location) route modules — these return once their backing models do.
export async function registerV1Routes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(authRoutes, { prefix: "/api/v1/auth" })
  await fastify.register(adminRoutes, { prefix: "/api/v1/admin" })
}
