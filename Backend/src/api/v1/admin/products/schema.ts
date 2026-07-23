import { z } from "zod"

import { ProductStatus, VariantStatus, ProductType, VariantUnit, StockTransactionType, ProductAvailability } from "./enums.js"

const productStatusSchema = z.enum([
  ProductStatus.DRAFT,
  ProductStatus.ACTIVE,
  ProductStatus.INACTIVE,
  ProductStatus.ARCHIVED,
  ProductStatus.OUT_OF_STOCK,
])
const variantStatusSchema = z.enum([VariantStatus.ACTIVE, VariantStatus.INACTIVE])
const availabilitySchema = z.enum([
  ProductAvailability.IN_STOCK,
  ProductAvailability.OUT_OF_STOCK,
  ProductAvailability.INCOMING,
  ProductAvailability.DISCONTINUED,
])

// Regex to validate a 24-character Mongo ObjectId
const objectIdRegex = /^[0-9a-fA-F]{24}$/

export const createVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required").max(100).optional(), // auto-generated if omitted
  unit: z.enum([VariantUnit.GM, VariantUnit.KG, VariantUnit.LITRE, VariantUnit.ML, VariantUnit.PCS]),
  unitValue: z.number().positive("Unit value must be positive"),
  sku: z.string().min(1, "SKU is required").max(100).optional(), // auto-generated if omitted
  
  mrp: z.number().int().positive("MRP must be positive"), // stored in paise
  sellingPrice: z.number().int().positive("Selling price must be positive"), // stored in paise
  offerPrice: z.number().int().positive("Offer price must be positive").nullable().optional(), // stored in paise
  costPrice: z.number().int().nonnegative().default(0), // stored in paise
  
  primaryImage: z.string().url("Invalid image URL format").optional(),
  galleryImages: z.array(z.string().url("Invalid image URL format")).optional(),
  
  appStock: z.number().int().nonnegative().default(0),
  localStock: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(0),
  reservedStock: z.number().int().nonnegative().default(0),
  
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  availability: availabilitySchema.default(ProductAvailability.IN_STOCK),
  status: variantStatusSchema.default(VariantStatus.ACTIVE),
})
.refine((data) => data.mrp >= data.sellingPrice, {
  message: "mrpLessThanSellingPrice",
  path: ["sellingPrice"],
})
.refine((data) => {
  if (data.offerPrice !== undefined && data.offerPrice !== null) {
    return data.sellingPrice >= data.offerPrice
  }
  return true
}, {
  message: "sellingPriceLessThanOfferPrice",
  path: ["offerPrice"],
})

export const createProductSchema = z.object({
  productType: z.enum([ProductType.SIMPLE, ProductType.VARIABLE]).default(ProductType.SIMPLE),
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(2000).optional(),
  
  // Category Registry UUIDv4 refs
  categoryId: z.string().uuid("Category ID must be a valid UUIDv4"),
  subCategoryId: z.string().uuid("Sub-category ID must be a valid UUIDv4").optional(),
  
  brandId: z.string().regex(objectIdRegex, "Brand ID must be a valid ObjectId reference"),
  taxId: z.string().regex(objectIdRegex, "Tax rate ID must be a valid ObjectId reference"),
  badgeIds: z.array(z.string().regex(objectIdRegex, "Invalid badge ID format")).optional(),
  
  primaryImage: z.string().url("Invalid image URL format").optional(),
  galleryImages: z.array(z.string().url("Invalid image URL format")).optional(),
  tags: z.array(z.string()).optional(),
  
  seo: z.object({
    metaTitle: z.string().max(100).optional(),
    metaDescription: z.string().max(300).optional(),
    slug: z.string().min(1, "Slug is required").max(200),
    keywords: z.array(z.string()).optional()
  }),
  
  sortOrder: z.number().int().default(0),
  availability: availabilitySchema.default(ProductAvailability.IN_STOCK),
  status: productStatusSchema.default(ProductStatus.DRAFT),
  variants: z.array(createVariantSchema).min(1, "At least one variant must be provided").optional(),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
  subCategoryId: z.string().uuid("Sub-category ID must be a valid UUID").nullable().optional(),
  brandId: z.string().regex(objectIdRegex, "Invalid brand ID format").optional(),
  taxId: z.string().regex(objectIdRegex, "Invalid tax rate ID format").optional(),
  badgeIds: z.array(z.string().regex(objectIdRegex, "Invalid badge ID format")).optional(),
  
  primaryImage: z.string().url("Invalid image URL format").nullable().optional(),
  galleryImages: z.array(z.string().url("Invalid image URL format")).optional(),
  tags: z.array(z.string()).optional(),
  
  seo: z.object({
    metaTitle: z.string().max(100).optional(),
    metaDescription: z.string().max(300).optional(),
    slug: z.string().min(1).max(200).optional(),
    keywords: z.array(z.string()).optional()
  }).optional(),
  
  sortOrder: z.number().int().optional(),
  availability: availabilitySchema.optional(),
  status: productStatusSchema.optional(),
})

export const updateVariantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  unit: z.enum([VariantUnit.GM, VariantUnit.KG, VariantUnit.LITRE, VariantUnit.ML, VariantUnit.PCS]).optional(),
  unitValue: z.number().positive().optional(),
  sku: z.string().min(1).max(100).optional(),
  
  mrp: z.number().int().positive().optional(),
  sellingPrice: z.number().int().positive().optional(),
  offerPrice: z.number().int().positive().nullable().optional(),
  costPrice: z.number().int().nonnegative().optional(),
  
  primaryImage: z.string().url("Invalid image URL format").nullable().optional(),
  galleryImages: z.array(z.string().url("Invalid image URL format")).optional(),
  
  appStock: z.number().int().nonnegative().optional(),
  localStock: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  reservedStock: z.number().int().nonnegative().optional(),
  
  sortOrder: z.number().int().optional(),
  isDefault: z.boolean().optional(),
  availability: availabilitySchema.optional(),
  status: variantStatusSchema.optional(),
})
.refine((data) => {
  if (data.mrp !== undefined && data.sellingPrice !== undefined) {
    return data.mrp >= data.sellingPrice
  }
  return true
}, {
  message: "mrpLessThanSellingPrice",
  path: ["sellingPrice"],
})
.refine((data) => {
  const sell = data.sellingPrice
  const offer = data.offerPrice
  if (sell !== undefined && offer !== undefined && offer !== null) {
    return sell >= offer
  }
  return true
}, {
  message: "sellingPriceLessThanOfferPrice",
  path: ["offerPrice"],
})

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.string().uuid().optional(),
  subCategoryId: z.string().uuid().optional(),
  brandId: z.string().regex(objectIdRegex).optional(),
  status: z.string().optional(),
  availability: z.string().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export const productIdParamsSchema = z.object({
  productId: z.string().regex(objectIdRegex, "Invalid product ID"),
})

export const variantIdParamsSchema = z.object({
  variantId: z.string().regex(objectIdRegex, "Invalid variant ID"),
})

export const addVariantParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid product ID"),
})

export const syncStockSchema = z.object({
  csvText: z.string().min(1, "CSV text cannot be empty"),
})

export const adjustStockBodySchema = z.object({
  qtyChanged: z.number().int("Quantity changed must be an integer").refine(q => q !== 0, "Quantity changed cannot be zero"),
  type: z.enum([
    StockTransactionType.INITIAL_STOCK,
    StockTransactionType.PURCHASE,
    StockTransactionType.RETURN,
    StockTransactionType.DAMAGE,
    StockTransactionType.EXPIRY,
    StockTransactionType.TRANSFER,
    StockTransactionType.MANUAL_ADJUSTMENT,
    StockTransactionType.APP_SALE,
    StockTransactionType.LOCAL_SALE,
    StockTransactionType.ORDER_CANCELLATION,
  ]),
  poolAffected: z.enum(["appStock", "localStock"]),
  reason: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
})

export const transferStockBodySchema = z.object({
  qty: z.number().int().positive("Transfer quantity must be positive"),
  reason: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
})

export const adjustStockParamsSchema = z.object({
  variantId: z.string().regex(objectIdRegex, "Invalid variant ID"),
})

export const stockHistoryParamsSchema = z.object({
  variantId: z.string().regex(objectIdRegex, "Invalid variant ID"),
})

// Product FAQs Schemas
export const createFaqSchema = z.object({
  question: z.string().min(1, "Question is required").max(1000),
  answer: z.string().min(1, "Answer is required").max(5000),
  sortOrder: z.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
})

export const updateFaqSchema = z.object({
  question: z.string().min(1).max(1000).optional(),
  answer: z.string().min(1).max(5000).optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

export const faqIdParamsSchema = z.object({
  faqId: z.string().regex(objectIdRegex, "Invalid FAQ ID"),
})

// Product Reviews Schemas
export const createReviewSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(200),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(2000).default(""),
  reviewImages: z.array(z.string().url("Invalid image URL format")).optional(),
  adminReply: z.string().max(2000).optional(),
  isVerifiedPurchase: z.boolean().default(false),
  status: z.enum(["pending", "approved", "rejected"]).default("approved"),
})

export const updateReviewSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().max(2000).optional(),
  reviewImages: z.array(z.string().url("Invalid image URL format")).optional(),
  adminReply: z.string().max(2000).optional(),
  isVerifiedPurchase: z.boolean().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
})

export const reviewIdParamsSchema = z.object({
  reviewId: z.string().regex(objectIdRegex, "Invalid Review ID"),
})
