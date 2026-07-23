import type { FastifyInstance } from "fastify"

import {
  createProductHandler,
  listProductsHandler,
  getProductHandler,
  updateProductHandler,
  deleteProductHandler,
  restoreProductHandler,
  permanentlyDeleteProductHandler,
  duplicateProductHandler,
  addVariantHandler,
  updateVariantHandler,
  deleteVariantHandler,
  duplicateVariantHandler,
  syncStockHandler,
  adjustStockHandler,
  transferStockHandler,
  getStockHistoryHandler,
  exportStockHistoryHandler,
  getVariantHandler,
  listProductFaqsHandler,
  createProductFaqHandler,
  updateProductFaqHandler,
  deleteProductFaqHandler,
  listProductReviewsHandler,
  createProductReviewHandler,
  updateProductReviewHandler,
  deleteProductReviewHandler,
  listAllFaqsHandler,
  listAllReviewsHandler,
  getProductsStatsHandler,
  listPublicProductsHandler,
  getPublicProductHandler,
} from "./controller.js"
import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"

export async function adminProductsRoutes(fastify: FastifyInstance): Promise<void> {
  const guard = [requireAuth, requireRole(SystemRoleCode.SUPER_ADMIN)]

  // Product FAQs & Reviews (Global lists registered first to avoid route parameter collision)
  fastify.get("/products/faqs", { preHandler: guard }, listAllFaqsHandler)
  fastify.get("/products/reviews", { preHandler: guard }, listAllReviewsHandler)

  // Product Stats & Master CRUD
  fastify.get("/products/stats", { preHandler: guard }, getProductsStatsHandler)
  fastify.post("/products", { preHandler: guard }, createProductHandler)
  fastify.get("/products", { preHandler: guard }, listProductsHandler)
  fastify.post("/products/:productId/duplicate", { preHandler: guard }, duplicateProductHandler)
  fastify.get("/products/:productId", { preHandler: guard }, getProductHandler)
  fastify.patch("/products/:productId", { preHandler: guard }, updateProductHandler)
  fastify.delete("/products/:productId", { preHandler: guard }, deleteProductHandler)
  fastify.post("/products/:productId/restore", { preHandler: guard }, restoreProductHandler)
  fastify.delete("/products/:productId/permanent", { preHandler: guard }, permanentlyDeleteProductHandler)
  fastify.post("/products/sync-stock", { preHandler: guard }, syncStockHandler)

  // Product FAQs & Reviews (Individual Product)
  fastify.get("/products/:productId/faqs", { preHandler: guard }, listProductFaqsHandler)
  fastify.post("/products/:productId/faqs", { preHandler: guard }, createProductFaqHandler)
  fastify.patch("/products/faqs/:faqId", { preHandler: guard }, updateProductFaqHandler)
  fastify.delete("/products/faqs/:faqId", { preHandler: guard }, deleteProductFaqHandler)

  // Product Reviews
  fastify.get("/products/:productId/reviews", { preHandler: guard }, listProductReviewsHandler)
  fastify.post("/products/:productId/reviews", { preHandler: guard }, createProductReviewHandler)
  fastify.patch("/products/reviews/:reviewId", { preHandler: guard }, updateProductReviewHandler)
  fastify.delete("/products/reviews/:reviewId", { preHandler: guard }, deleteProductReviewHandler)

  // Variant SKU CRUD
  fastify.post("/products/:id/variants", { preHandler: guard }, addVariantHandler)
  fastify.post("/products/variants/:variantId/duplicate", { preHandler: guard }, duplicateVariantHandler)
  fastify.patch("/products/variants/:variantId", { preHandler: guard }, updateVariantHandler)
  fastify.delete("/products/variants/:variantId", { preHandler: guard }, deleteVariantHandler)
  fastify.get("/products/variants/:variantId", { preHandler: guard }, getVariantHandler)
  
  // Stock adjustments, transfer, and logs
  fastify.post("/products/variants/:variantId/adjust-stock", { preHandler: guard }, adjustStockHandler)
  fastify.post("/products/variants/:variantId/transfer-stock", { preHandler: guard }, transferStockHandler)
  fastify.get("/products/variants/:variantId/stock-history", { preHandler: guard }, getStockHistoryHandler)
  fastify.get("/products/variants/:variantId/stock-history/export", { preHandler: guard }, exportStockHistoryHandler)
}

export async function publicProductsRoutes(fastify: FastifyInstance): Promise<void> {
  // Public endpoints used by Customer App / Delivery Partner App
  fastify.get("/products", listPublicProductsHandler)
  fastify.get("/products/:productId", getPublicProductHandler)
}
