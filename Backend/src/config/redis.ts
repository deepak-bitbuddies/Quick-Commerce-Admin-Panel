import { Redis } from "ioredis"

import { env } from "./env.js"
import { logger } from "../utils/logger.js"

/**
 * Single shared connection for general commands (atomic counters, cache
 * reads, GEOADD telemetry). BullMQ and the Socket.io adapter each get their
 * own dedicated connections (see queues/connection.ts) since ioredis
 * connections used for blocking commands (BRPOPLPUSH, subscribe) can't be
 * shared with regular request/response traffic.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableAutoPipelining: true,
})

redis.on("connect", () => logger.info("[redis] connected"))
redis.on("error", (err: Error) =>
  logger.error({ err }, "[redis] connection error"),
)

export function inventoryKey(storeId: string, productId: string): string {
  return `inventory:${storeId}:${productId}`
}

export const RIDER_LOCATIONS_KEY = "riders:locations"

export function homepageCacheKey(storeId: string): string {
  return `cache:homepage:${storeId}`
}
