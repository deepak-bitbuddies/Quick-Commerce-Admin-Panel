import Fastify, { type FastifyError, type FastifyInstance } from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import jwt from "@fastify/jwt"

import { env } from "./env.js"
import { loggerOptions } from "../utils/logger.js"

export async function buildFastify(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: loggerOptions,
    trustProxy: true,
    disableRequestLogging: true, // we log ourselves below with timing
  })

  await fastify.register(helmet, { global: true })
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  })
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  })

  // Sub-30ms budget tracking: log every request's wall-clock time so slow
  // routes surface immediately instead of hiding in aggregate metrics.
  fastify.addHook("onRequest", async (request) => {
    ;(request as { startTime?: number }).startTime = performance.now()
  })
  fastify.addHook("onResponse", async (request, reply) => {
    const startTime = (request as { startTime?: number }).startTime
    const durationMs = startTime ? performance.now() - startTime : undefined
    fastify.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        durationMs: durationMs ? Number(durationMs.toFixed(2)) : undefined,
      },
      "request completed",
    )
  })

  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    fastify.log.error(
      { err: error, method: request.method, url: request.url },
      "unhandled request error",
    )

    const statusCode = error.statusCode ?? 500
    reply.code(statusCode).send({
      message: statusCode >= 500 ? "Internal server error" : error.message,
      code: error.code,
    })
  })

  fastify.setNotFoundHandler((request, reply) => {
    reply
      .code(404)
      .send({ message: `Route ${request.method} ${request.url} not found` })
  })

  return fastify
}
