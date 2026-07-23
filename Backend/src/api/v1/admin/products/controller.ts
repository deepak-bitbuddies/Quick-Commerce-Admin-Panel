import type { FastifyReply, FastifyRequest } from "fastify"
import { ProductStatus } from "./enums.js"

import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  addVariant,
  updateVariant,
  deleteVariant,
  duplicateVariant,
  syncStockFromCsv,
  adjustVariantStock,
  transferVariantStock,
  getStockHistory,
  getVariantById,
} from "./service.js"
import { toProductResponseDto, toVariantResponseDto, toStockTransactionResponseDto } from "./mapper.js"
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  createVariantSchema,
  updateVariantSchema,
  variantIdParamsSchema,
  addVariantParamsSchema,
  syncStockSchema,
  adjustStockBodySchema,
  transferStockBodySchema,
  adjustStockParamsSchema,
  stockHistoryParamsSchema,
  createFaqSchema,
  updateFaqSchema,
  faqIdParamsSchema,
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamsSchema,
} from "./schema.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { ValidationError } from "../../../../shared/errors/index.js"
import { Types } from "mongoose"
import { ProductFaqModel } from "./faq-model.js"
import { ProductReviewModel } from "./review-model.js"
import { ProductModel, VariantModel } from "./model.js"

export async function createProductHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = validateSchema(createProductSchema, request.body) as any
  const creator = request.user?.id || "system"
  const result = await createProduct(body, creator)
  
  sendSuccess(
    reply,
    toProductResponseDto(result.product, result.variants),
    "Product and variants created successfully",
    201,
  )
}

export async function listProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const query = validateSchema(listProductsQuerySchema, request.query) as any
  const result = await listProducts(query)
  
  const mappedProducts = result.products.map((p) => toProductResponseDto(p, p.variants))
  
  sendSuccess(
    reply,
    mappedProducts,
    "Products fetched successfully",
    200,
    {
      total: result.total,
      page: result.page,
      limit: result.limit,
    },
  )
}

export async function getProductHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = validateSchema(productIdParamsSchema, request.params) as { productId: string }
  const result = await getProductById(productId)
  
  sendSuccess(
    reply,
    toProductResponseDto(result.product, result.variants),
    "Product details fetched successfully",
  )
}

export async function updateProductHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = validateSchema(productIdParamsSchema, request.params) as { productId: string }
  const body = validateSchema(updateProductSchema, request.body) as any
  const updater = request.user?.id || "system"
  const updatedProduct = await updateProduct(productId, body, updater)
  
  sendSuccess(reply, toProductResponseDto(updatedProduct), "Product updated successfully")
}

export async function deleteProductHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = validateSchema(productIdParamsSchema, request.params) as { productId: string }
  const { reason } = (request.query as { reason?: string }) || {}
  const deleter = request.user?.id || "system"
  
  await deleteProduct(productId, deleter, reason)
  
  sendSuccess(reply, null, "Product and variants soft-deleted successfully")
}

export async function duplicateProductHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = validateSchema(productIdParamsSchema, request.params) as { productId: string }
  const creator = request.user?.id || "system"
  const result = await duplicateProduct(productId, creator)

  sendSuccess(
    reply,
    toProductResponseDto(result.product, result.variants),
    "Product duplicated successfully",
    201,
  )
}

export async function addVariantHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id: productId } = validateSchema(addVariantParamsSchema, request.params) as { id: string }
  const body = validateSchema(createVariantSchema, request.body) as any
  const creator = request.user?.id || "system"
  
  const variant = await addVariant(productId, body, creator)
  
  sendSuccess(reply, toVariantResponseDto(variant), "Variant added successfully", 201)
}

export async function updateVariantHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { variantId } = validateSchema(variantIdParamsSchema, request.params) as { variantId: string }
  const body = validateSchema(updateVariantSchema, request.body) as any
  const updater = request.user?.id || "system"
  
  const variant = await updateVariant(variantId, body, updater)
  
  sendSuccess(reply, toVariantResponseDto(variant), "Variant updated successfully")
}

export async function deleteVariantHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { variantId } = validateSchema(variantIdParamsSchema, request.params) as { variantId: string }
  
  await deleteVariant(variantId)
  
  sendSuccess(reply, null, "Variant soft-deleted successfully")
}

export async function duplicateVariantHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { variantId } = validateSchema(variantIdParamsSchema, request.params) as { variantId: string }
  const creator = request.user?.id || "system"
  const variant = await duplicateVariant(variantId, creator)

  sendSuccess(reply, toVariantResponseDto(variant), "Variant duplicated successfully", 201)
}

export async function syncStockHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { csvText } = validateSchema(syncStockSchema, request.body) as { csvText: string }
  const updater = request.user?.id || "system"
  const result = await syncStockFromCsv(csvText, updater)
  
  sendSuccess(reply, result, "Stock synchronized successfully")
}

export async function adjustStockHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { variantId } = validateSchema(adjustStockParamsSchema, request.params) as { variantId: string }
  const body = validateSchema(adjustStockBodySchema, request.body) as any
  const creator = request.user?.id || "system"
  
  const updatedVariant = await adjustVariantStock(variantId, body, creator)
  
  sendSuccess(reply, toVariantResponseDto(updatedVariant), "Stock adjusted successfully")
}

export async function transferStockHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { variantId } = validateSchema(adjustStockParamsSchema, request.params) as { variantId: string }
  const body = validateSchema(transferStockBodySchema, request.body) as any
  const { direction } = (request.query as { direction: "APP_TO_LOCAL" | "LOCAL_TO_APP" })
  const creator = request.user?.id || "system"

  if (direction !== "APP_TO_LOCAL" && direction !== "LOCAL_TO_APP") {
    throw new ValidationError("Direction query parameter must be 'APP_TO_LOCAL' or 'LOCAL_TO_APP'")
  }

  const updatedVariant = await transferVariantStock(
    variantId,
    body.qty,
    direction,
    body.reason || "",
    body.reference || "",
    creator,
  )

  sendSuccess(reply, toVariantResponseDto(updatedVariant), "Stock transferred successfully")
}

export async function getStockHistoryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { variantId } = validateSchema(stockHistoryParamsSchema, request.params) as { variantId: string }
  const history = await getStockHistory(variantId)
  
  sendSuccess(reply, history.map(toStockTransactionResponseDto), "Stock history fetched successfully")
}

export async function exportStockHistoryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { variantId } = validateSchema(stockHistoryParamsSchema, request.params) as { variantId: string }
  const history = await getStockHistory(variantId)

  // Build CSV Content
  const headers = ["Timestamp", "Transaction Type", "Qty Changed", "Previous Stock", "New Stock", "Reason", "Reference", "Created By"]
  const rows = history.map((tx) => [
    new Date(tx.createdAt).toISOString(),
    tx.type,
    tx.qtyChanged.toString(),
    tx.previousStock.toString(),
    tx.newStock.toString(),
    tx.reason || "",
    tx.reference || "",
    tx.createdBy,
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
  ].join("\n")

  reply
    .header("Content-Type", "text/csv")
    .header("Content-Disposition", `attachment; filename="stock-history-${variantId}.csv"`)
    .send(csvContent)
}

export async function getVariantHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { variantId } = validateSchema(adjustStockParamsSchema, request.params) as { variantId: string }
  const variant = await getVariantById(variantId)
  const product = await getProductById(String(variant.productId))
  
  sendSuccess(reply, {
    variant: toVariantResponseDto(variant, product.product),
    product: product ? toProductResponseDto(product.product, product.variants) : null,
  }, "Variant details retrieved successfully")
}

// --- Product FAQs Handlers ---

export async function listAllFaqsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const faqs = await ProductFaqModel.find({}).populate("productId", "name").sort({ sortOrder: 1, createdAt: -1 })
  sendSuccess(reply, faqs, "All product FAQs retrieved successfully")
}

export async function listProductFaqsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = validateSchema(productIdParamsSchema, request.params) as { productId: string }
  const faqs = await ProductFaqModel.find({ productId: new Types.ObjectId(productId) }).sort({ sortOrder: 1, createdAt: -1 })
  sendSuccess(reply, faqs, "Product FAQs retrieved successfully")
}

export async function createProductFaqHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = validateSchema(productIdParamsSchema, request.params) as { productId: string }
  const body = validateSchema(createFaqSchema, request.body) as any
  const creator = request.user?.id || "system"

  const faq = await ProductFaqModel.create({
    productId: new Types.ObjectId(productId),
    ...body,
    createdBy: creator,
    updatedBy: creator,
  })

  sendSuccess(reply, faq, "Product FAQ created successfully")
}

export async function updateProductFaqHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { faqId } = validateSchema(faqIdParamsSchema, request.params) as { faqId: string }
  const body = validateSchema(updateFaqSchema, request.body) as any
  const creator = request.user?.id || "system"

  const faq = await ProductFaqModel.findByIdAndUpdate(
    new Types.ObjectId(faqId),
    { $set: { ...body, updatedBy: creator } },
    { new: true }
  )

  if (!faq) {
    reply.status(404).send({ success: false, message: "FAQ not found" })
    return
  }

  sendSuccess(reply, faq, "Product FAQ updated successfully")
}

export async function deleteProductFaqHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { faqId } = validateSchema(faqIdParamsSchema, request.params) as { faqId: string }

  const faq = await ProductFaqModel.findByIdAndDelete(new Types.ObjectId(faqId))
  if (!faq) {
    reply.status(404).send({ success: false, message: "FAQ not found" })
    return
  }

  sendSuccess(reply, faq, "Product FAQ deleted successfully")
}

// --- Product Reviews Handlers ---

export async function listAllReviewsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const reviews = await ProductReviewModel.find({}).populate("productId", "name").sort({ createdAt: -1 })
  sendSuccess(reply, reviews, "All product reviews retrieved successfully")
}

export async function listProductReviewsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = validateSchema(productIdParamsSchema, request.params) as { productId: string }
  const reviews = await ProductReviewModel.find({ productId: new Types.ObjectId(productId) }).sort({ createdAt: -1 })
  sendSuccess(reply, reviews, "Product reviews retrieved successfully")
}

export async function createProductReviewHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = validateSchema(productIdParamsSchema, request.params) as { productId: string }
  const body = validateSchema(createReviewSchema, request.body) as any
  const creator = request.user?.id || "system"

  const review = await ProductReviewModel.create({
    productId: new Types.ObjectId(productId),
    ...body,
    createdBy: creator,
    updatedBy: creator,
  })

  sendSuccess(reply, review, "Product review created successfully")
}

export async function updateProductReviewHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { reviewId } = validateSchema(reviewIdParamsSchema, request.params) as { reviewId: string }
  const body = validateSchema(updateReviewSchema, request.body) as any
  const creator = request.user?.id || "system"

  const review = await ProductReviewModel.findByIdAndUpdate(
    new Types.ObjectId(reviewId),
    { $set: { ...body, updatedBy: creator } },
    { new: true }
  )

  if (!review) {
    reply.status(404).send({ success: false, message: "Review not found" })
    return
  }

  sendSuccess(reply, review, "Product review updated successfully")
}

export async function deleteProductReviewHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { reviewId } = validateSchema(reviewIdParamsSchema, request.params) as { reviewId: string }

  const review = await ProductReviewModel.findByIdAndDelete(new Types.ObjectId(reviewId))
  if (!review) {
    reply.status(404).send({ success: false, message: "Review not found" })
    return
  }

  sendSuccess(reply, review, "Product review deleted successfully")
}

export async function getProductsStatsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const totalProducts = await ProductModel.countDocuments({ isDeleted: false })
  const activeProducts = await ProductModel.countDocuments({ status: ProductStatus.ACTIVE, isDeleted: false })
  const inactiveProducts = await ProductModel.countDocuments({ status: ProductStatus.INACTIVE, isDeleted: false })
  const draftProducts = await ProductModel.countDocuments({ status: ProductStatus.DRAFT, isDeleted: false })

  // Count of variants out of stock (available stock = 0)
  const outOfStock = await VariantModel.countDocuments({
    "inventory.availableStock": 0,
    isDeleted: false,
  })

  // Count of variants below or equal to min stock (low stock)
  const lowStock = await VariantModel.countDocuments({
    $expr: { $lte: ["$inventory.availableStock", "$inventory.minStock"] },
    isDeleted: false,
  })

  sendSuccess(reply, {
    totalProducts,
    activeProducts,
    inactiveProducts,
    draftProducts,
    outOfStock,
    lowStock,
  }, "Products statistics fetched successfully")
}

export async function listPublicProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const query = validateSchema(listProductsQuerySchema, request.query) as any
  // Force customer visibility: only active & not deleted
  query.status = ProductStatus.ACTIVE
  const result = await listProducts(query)

  const mappedProducts = result.products.map((p) => toProductResponseDto(p, p.variants))

  sendSuccess(
    reply,
    mappedProducts,
    "Public products fetched successfully",
    200,
    {
      total: result.total,
      page: result.page,
      limit: result.limit,
    },
  )
}

export async function getPublicProductHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = validateSchema(productIdParamsSchema, request.params) as { productId: string }
  const result = await getProductById(productId)

  if (result.product.status !== ProductStatus.ACTIVE || result.product.isDeleted) {
    reply.status(404).send({ success: false, message: "Product not found or not visible" })
    return
  }

  sendSuccess(
    reply,
    toProductResponseDto(result.product, result.variants),
    "Public product details fetched successfully",
  )
}
