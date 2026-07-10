import type { FastifyInstance } from "fastify"

import { buildFastify } from "./config/fastify.js"
import { registerV1Routes } from "./api/v1/index.js"

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = await buildFastify()

  fastify.get("/health", async () => ({ status: "ok", timestamp: Date.now() }))

  await registerV1Routes(fastify)

  return fastify
}
