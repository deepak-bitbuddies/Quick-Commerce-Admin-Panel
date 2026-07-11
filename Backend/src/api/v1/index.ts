import type { FastifyInstance } from "fastify"

import { authRoutes } from "./admin/auth/index.js"
import { registerAdminRoutes } from "./admin/index.js"

// Deferred to a later pass: api/v1/app/ (customer/rider-facing home, orders,
// shift, location routes) — these return once their backing models do.
export async function registerV1Routes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(authRoutes, { prefix: "/api/v1/auth" })
  await fastify.register(registerAdminRoutes, { prefix: "/api/v1/admin" })
}
