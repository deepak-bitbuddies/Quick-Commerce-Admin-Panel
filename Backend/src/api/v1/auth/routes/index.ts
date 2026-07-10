import type { FastifyInstance } from "fastify"

import { loginHandler } from "../controllers/auth.controller.js"

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/login", loginHandler)
}
