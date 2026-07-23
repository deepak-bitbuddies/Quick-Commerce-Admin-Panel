import type { FastifyInstance } from "fastify"

import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import {
  createTaxRateHandler,
  listTaxRatesHandler,
  getTaxRateHandler,
  updateTaxRateHandler,
  deleteTaxRateHandler,
} from "./controller.js"

export async function adminTaxRatesRoutes(fastify: FastifyInstance): Promise<void> {
  const guard = [requireAuth, requireRole(SystemRoleCode.SUPER_ADMIN)]

  fastify.post("/tax-rates", { preHandler: guard }, createTaxRateHandler)
  fastify.get("/tax-rates", { preHandler: guard }, listTaxRatesHandler)
  fastify.get("/tax-rates/:taxRateId", { preHandler: guard }, getTaxRateHandler)
  fastify.patch("/tax-rates/:taxRateId", { preHandler: guard }, updateTaxRateHandler)
  fastify.delete("/tax-rates/:taxRateId", { preHandler: guard }, deleteTaxRateHandler)
}
