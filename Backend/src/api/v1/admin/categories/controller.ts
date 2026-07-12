import type { FastifyReply, FastifyRequest } from "fastify"

import {
  createNode,
  getNodeById,
  getNodeBySlug,
  updateNode,
  deleteNode,
  restoreNode,
  getFlatNodes,
  getTree,
  getMenu,
  getHomeNodes,
  getBreadcrumbs,
  executeBulkReorder,
  executeBulkDelete,
  executeBulkStatusUpdate,
} from "./service.js"
import {
  createCatalogNodeSchema,
  updateCatalogNodeSchema,
  bulkReorderSchema,
  bulkDeleteSchema,
  bulkStatusSchema,
  listQuerySchema,
} from "./schema.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"

export async function createNodeHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const payload = validateSchema(createCatalogNodeSchema, request.body)
  const creator = request.user?.id || "system"
  const data = await createNode(payload, creator)
  sendSuccess(reply, data, "Catalog node created successfully", 210)
}

export async function getNodeByIdHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string }
  const data = await getNodeById(id)
  sendSuccess(reply, data, "Catalog node fetched successfully")
}

export async function getNodeBySlugHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { slug } = request.params as { slug: string }
  const data = await getNodeBySlug(slug)
  sendSuccess(reply, data, "Catalog node fetched successfully")
}

export async function updateNodeHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string }
  const payload = validateSchema(updateCatalogNodeSchema, request.body)
  const updater = request.user?.id || "system"
  const data = await updateNode(id, payload, updater)
  sendSuccess(reply, data, "Catalog node updated successfully")
}

export async function deleteNodeHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string }
  const { reason } = (request.query as { reason?: string }) || {}
  const deleter = request.user?.id || "system"
  const data = await deleteNode(id, deleter, reason)
  sendSuccess(reply, data, "Catalog node soft-deleted successfully")
}

export async function restoreNodeHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string }
  const updater = request.user?.id || "system"
  const data = await restoreNode(id, updater)
  sendSuccess(reply, data, "Catalog node restored successfully")
}

export async function getFlatNodesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = validateSchema(listQuerySchema, request.query)
  const data = await getFlatNodes(query)
  sendSuccess(reply, data.nodes, "Catalog nodes flat list fetched successfully", 200, {
    total: data.total,
    page: query.page,
    pageSize: query.pageSize,
  })
}

// Hierarchical list for Admin tree and Customer tree
export async function getTreeHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await getTree()
  sendSuccess(reply, data, "Catalog node tree fetched successfully")
}

// Lightweight Header Menu
export async function getMenuHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await getMenu()
  sendSuccess(reply, data, "Catalog navigation menu fetched successfully")
}

// Home screen category selections
export async function getHomeNodesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await getHomeNodes()
  sendSuccess(reply, data, "Home page catalog nodes fetched successfully")
}

// Breadcrumb path path tracker
export async function getBreadcrumbsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { slug } = request.params as { slug: string }
  const data = await getBreadcrumbs(slug)
  sendSuccess(reply, data, "Catalog node breadcrumbs generated successfully")
}

// Bulk Actions
export async function bulkReorderHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const payload = validateSchema(bulkReorderSchema, request.body)
  const updater = request.user?.id || "system"
  await executeBulkReorder(payload.nodes, updater)
  sendSuccess(reply, null, "Catalog nodes reordered successfully")
}

export async function bulkDeleteHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const payload = validateSchema(bulkDeleteSchema, request.body)
  const deleter = request.user?.id || "system"
  await executeBulkDelete(payload.ids, deleter, payload.reason)
  sendSuccess(reply, null, "Catalog nodes deleted successfully")
}

export async function bulkStatusHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const payload = validateSchema(bulkStatusSchema, request.body)
  const updater = request.user?.id || "system"
  await executeBulkStatusUpdate(payload.ids, payload.status, updater)
  sendSuccess(reply, null, "Catalog nodes status updated successfully")
}
