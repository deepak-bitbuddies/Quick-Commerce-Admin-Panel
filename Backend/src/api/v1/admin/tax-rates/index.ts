import type { FastifyInstance } from "fastify"

import { adminTaxRatesRoutes } from "./routes.js"

export async function taxRatesRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(adminTaxRatesRoutes)
}
export { TaxRateModel } from "./model.js"
