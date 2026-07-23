import type { FastifyReply, FastifyRequest } from "fastify"

import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import {
  createTaxRateSchema,
  updateTaxRateSchema,
  listTaxRatesQuerySchema,
  taxRateIdParamsSchema,
} from "./schema.js"
import {
  createTaxRate,
  listTaxRates,
  getTaxRateById,
  updateTaxRate as dbUpdateTaxRate,
  deleteTaxRate as dbDeleteTaxRate,
} from "./service.js"

function toTaxRateResponseDto(doc: any) {
  return {
    id: String(doc._id),
    name: doc.name,
    sgst: doc.sgst,
    cgst: doc.cgst,
    igst: doc.igst,
    cess: doc.cess,
    description: doc.description ?? undefined,
    createdAt: doc.createdAt,
  }
}

export async function createTaxRateHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = validateSchema(createTaxRateSchema, request.body)
  const creator = request.user?.id || "system"
  const doc = await createTaxRate(body, creator)
  sendSuccess(reply, toTaxRateResponseDto(doc), "Tax rate created successfully", 201)
}

export async function listTaxRatesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = validateSchema(listTaxRatesQuerySchema, request.query)
  const result = await listTaxRates(query)
  const mapped = result.nodes.map(toTaxRateResponseDto)
  sendSuccess(reply, mapped, "Tax rates fetched successfully", 200, {
    total: result.total,
    page: query.page ?? 1,
    limit: query.pageSize ?? 10,
  })
}

export async function getTaxRateHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { taxRateId } = validateSchema(taxRateIdParamsSchema, request.params)
  const doc = await getTaxRateById(taxRateId)
  sendSuccess(reply, toTaxRateResponseDto(doc), "Tax rate fetched successfully")
}

export async function updateTaxRateHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { taxRateId } = validateSchema(taxRateIdParamsSchema, request.params)
  const body = validateSchema(updateTaxRateSchema, request.body)
  const updater = request.user?.id || "system"
  const doc = await dbUpdateTaxRate(taxRateId, body, updater)
  sendSuccess(reply, toTaxRateResponseDto(doc), "Tax rate updated successfully")
}

export async function deleteTaxRateHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { taxRateId } = validateSchema(taxRateIdParamsSchema, request.params)
  const deleter = request.user?.id || "system"
  await dbDeleteTaxRate(taxRateId, deleter)
  sendSuccess(reply, null, "Tax rate soft-deleted successfully")
}
