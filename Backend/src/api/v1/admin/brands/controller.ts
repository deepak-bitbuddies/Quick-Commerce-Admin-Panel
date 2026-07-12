import type { FastifyReply, FastifyRequest } from "fastify"

import {
  createBrandRecord,
  getBrands,
  getBrandById,
  updateBrandRecord,
  updateBrandActiveStatus,
  deleteBrandRecord,
  restoreBrandRecord,
  executeBulkDeleteBrands,
  executeBulkStatusUpdateBrands,
} from "./service.js"
import { toBrandResponseDto } from "./mapper.js"
import {
  createBrandSchema,
  updateBrandSchema,
  listBrandsQuerySchema,
  setStatusBodySchema,
  brandIdParamsSchema,
  bulkDeleteSchema,
  bulkStatusSchema,
} from "./schema.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"

export async function createBrandHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = validateSchema(createBrandSchema, request.body)
  const creator = request.user?.id || "system"
  const brand = await createBrandRecord(body, creator)
  sendSuccess(reply, toBrandResponseDto(brand), "Brand created", 201)
}

export async function listBrandsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const query = validateSchema(listBrandsQuerySchema, request.query)
  const { brands, total } = await getBrands(query)
  sendSuccess(reply, brands.map(toBrandResponseDto), "Brands fetched", 200, {
    total,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  })
}

export async function getBrandHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { brandId } = validateSchema(brandIdParamsSchema, request.params)
  const brand = await getBrandById(brandId)
  sendSuccess(reply, toBrandResponseDto(brand))
}

export async function updateBrandHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { brandId } = validateSchema(brandIdParamsSchema, request.params)
  const body = validateSchema(updateBrandSchema, request.body)
  const updater = request.user?.id || "system"
  const brand = await updateBrandRecord(brandId, body, updater)
  sendSuccess(reply, toBrandResponseDto(brand), "Brand updated")
}

export async function setBrandStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { brandId } = validateSchema(brandIdParamsSchema, request.params)
  const { status } = validateSchema(setStatusBodySchema, request.body)
  const updater = request.user?.id || "system"
  const brand = await updateBrandActiveStatus(brandId, status, updater)
  sendSuccess(reply, toBrandResponseDto(brand), "Brand status updated")
}

export async function deleteBrandHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { brandId } = validateSchema(brandIdParamsSchema, request.params)
  const { reason } = (request.query as { reason?: string }) || {}
  const deleter = request.user?.id || "system"
  const brand = await deleteBrandRecord(brandId, deleter, reason)
  sendSuccess(reply, toBrandResponseDto(brand), "Brand soft-deleted successfully")
}

export async function restoreBrandHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { brandId } = validateSchema(brandIdParamsSchema, request.params)
  const updater = request.user?.id || "system"
  const brand = await restoreBrandRecord(brandId, updater)
  sendSuccess(reply, toBrandResponseDto(brand), "Brand restored successfully")
}

export async function bulkDeleteBrandsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const payload = validateSchema(bulkDeleteSchema, request.body)
  const deleter = request.user?.id || "system"
  await executeBulkDeleteBrands(payload.ids, deleter, payload.reason)
  sendSuccess(reply, null, "Brands deleted successfully")
}

export async function bulkStatusBrandsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const payload = validateSchema(bulkStatusSchema, request.body)
  const updater = request.user?.id || "system"
  await executeBulkStatusUpdateBrands(payload.ids, payload.status, updater)
  sendSuccess(reply, null, "Brands status updated successfully")
}
