import type { FastifyReply, FastifyRequest } from "fastify"

import {
  createBadgeRecord,
  getBadges,
  getBadgeById,
  updateBadgeRecord,
  updateBadgeActiveStatus,
  deleteBadgeRecord,
  restoreBadgeRecord,
} from "./service.js"
import { toBadgeResponseDto } from "./mapper.js"
import {
  createBadgeSchema,
  updateBadgeSchema,
  listBadgesQuerySchema,
  setStatusBodySchema,
  badgeIdParamsSchema,
} from "./schema.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"

export async function createBadgeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = validateSchema(createBadgeSchema, request.body)
  const creator = request.user?.id || "system"
  const badge = await createBadgeRecord(body, creator)
  sendSuccess(reply, toBadgeResponseDto(badge), "Badge created", 201)
}

export async function listBadgesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const query = validateSchema(listBadgesQuerySchema, request.query)
  const { badges, total } = await getBadges(query)
  sendSuccess(reply, badges.map(toBadgeResponseDto), "Badges fetched", 200, {
    total,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  })
}

export async function getBadgeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { badgeId } = validateSchema(badgeIdParamsSchema, request.params)
  const badge = await getBadgeById(badgeId)
  sendSuccess(reply, toBadgeResponseDto(badge))
}

export async function updateBadgeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { badgeId } = validateSchema(badgeIdParamsSchema, request.params)
  const body = validateSchema(updateBadgeSchema, request.body)
  const updater = request.user?.id || "system"
  const badge = await updateBadgeRecord(badgeId, body, updater)
  sendSuccess(reply, toBadgeResponseDto(badge), "Badge updated")
}

export async function setBadgeStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { badgeId } = validateSchema(badgeIdParamsSchema, request.params)
  const { status } = validateSchema(setStatusBodySchema, request.body)
  const updater = request.user?.id || "system"
  const badge = await updateBadgeActiveStatus(badgeId, status, updater)
  sendSuccess(reply, toBadgeResponseDto(badge), "Badge status updated")
}

export async function deleteBadgeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { badgeId } = validateSchema(badgeIdParamsSchema, request.params)
  const { reason } = (request.query as { reason?: string }) || {}
  const deleter = request.user?.id || "system"
  const badge = await deleteBadgeRecord(badgeId, deleter, reason)
  sendSuccess(reply, toBadgeResponseDto(badge), "Badge soft-deleted successfully")
}

export async function restoreBadgeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { badgeId } = validateSchema(badgeIdParamsSchema, request.params)
  const updater = request.user?.id || "system"
  const badge = await restoreBadgeRecord(badgeId, updater)
  sendSuccess(reply, toBadgeResponseDto(badge), "Badge restored successfully")
}
