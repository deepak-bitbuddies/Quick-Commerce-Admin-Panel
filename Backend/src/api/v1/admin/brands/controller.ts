import type { FastifyReply, FastifyRequest } from "fastify"

import {
  createBrandRecord,
  getBrands,
  getBrandById,
  updateBrandRecord,
  updateBrandActiveStatus,
} from "./service.js"
import { toBrandResponseDto } from "./mapper.js"
import {
  createBrandSchema,
  updateBrandSchema,
  listBrandsQuerySchema,
  setStatusBodySchema,
  brandIdParamsSchema,
} from "./schema.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"

export async function createBrandHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = validateSchema(createBrandSchema, request.body)
  const brand = await createBrandRecord(body)
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
  const brand = await updateBrandRecord(brandId, body)
  sendSuccess(reply, toBrandResponseDto(brand), "Brand updated")
}

export async function setBrandStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { brandId } = validateSchema(brandIdParamsSchema, request.params)
  const { status } = validateSchema(setStatusBodySchema, request.body)
  const brand = await updateBrandActiveStatus(brandId, status)
  sendSuccess(reply, toBrandResponseDto(brand), "Brand status updated")
}
