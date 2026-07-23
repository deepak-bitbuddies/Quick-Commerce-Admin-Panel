import { Types } from "mongoose"

import { ProductModel, VariantModel, StockTransactionModel, type ProductDocument, type VariantDocument, type StockTransactionDocument } from "./model.js"
import { ProductStatus } from "./enums.js"

export interface ListProductsFilters {
  categoryId?: string
  subCategoryId?: string
  brandId?: string
  status?: string
  availability?: string
  search?: string
  page: number
  limit: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface ListProductsResult {
  products: ProductDocument[]
  total: number
}

/** Escapes regex metacharacters for safe pattern searching. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Creates a new Product document.
 */
export async function createProduct(data: Partial<ProductDocument>): Promise<ProductDocument> {
  const product = new ProductModel(data)
  await product.save()
  return product.toObject() as ProductDocument
}

/**
 * Finds a Product by ID.
 */
export async function findProductById(id: string | Types.ObjectId): Promise<ProductDocument | null> {
  const doc = await ProductModel.findOne({ _id: id, isDeleted: false })
  return doc ? (doc.toObject() as ProductDocument) : null
}

/**
 * Finds a Product by slug.
 */
export async function findProductBySlug(slug: string): Promise<ProductDocument | null> {
  const doc = await ProductModel.findOne({ "seo.slug": slug, isDeleted: false })
  return doc ? (doc.toObject() as ProductDocument) : null
}

/**
 * Lists products based on filters, tag search, and pagination.
 * Supports searching Product Name, Variant Name, SKU, and Tags.
 */
export async function listProducts(filters: ListProductsFilters): Promise<ListProductsResult> {
  const query: Record<string, any> = { isDeleted: false }

  if (filters.categoryId) {
    query.categoryId = filters.categoryId
  }
  if (filters.subCategoryId) {
    query.subCategoryId = filters.subCategoryId
  }
  if (filters.brandId) {
    query.brandId = new Types.ObjectId(filters.brandId)
  }
  if (filters.status) {
    query.status = filters.status
  }
  if (filters.availability) {
    query.availability = filters.availability
  }

  if (filters.search) {
    const escapedSearch = escapeRegExp(filters.search)
    const searchRegex = { $regex: escapedSearch, $options: "i" }

    // 1. Find matching variants by SKU or Variant Name
    const matchingVariants = await VariantModel.find({
      $or: [
        { sku: searchRegex },
        { name: searchRegex }
      ],
      isDeleted: false
    }).select("productId").lean().exec()

    const variantProductIds = matchingVariants.map(v => v.productId)

    // 2. Query products matching Name, Tags, or linked Variant IDs
    query.$or = [
      { name: searchRegex },
      { tags: { $in: [new RegExp(escapedSearch, "i")] } },
      { _id: { $in: variantProductIds } }
    ]
  }

  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  // Sorting
  const sortOption: Record<string, any> = {}
  if (filters.sortBy) {
    sortOption[filters.sortBy] = filters.sortOrder === "asc" ? 1 : -1
  } else {
    sortOption.sortOrder = 1 // default sorting order
    sortOption.createdAt = -1
  }

  const [products, total] = await Promise.all([
    ProductModel.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    ProductModel.countDocuments(query).exec(),
  ])

  return {
    products: products as ProductDocument[],
    total,
  }
}

/**
 * Updates a Product by ID.
 */
export async function updateProduct(
  id: string | Types.ObjectId,
  data: Partial<ProductDocument>,
): Promise<ProductDocument | null> {
  const doc = await ProductModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: data },
    { new: true },
  )
  return doc ? (doc.toObject() as ProductDocument) : null
}

/**
 * Soft deletes/archives a Product by ID.
 */
export async function softDeleteProduct(
  id: string | Types.ObjectId,
  deletedBy: string,
  reason?: string,
): Promise<boolean> {
  const result = await ProductModel.updateOne(
    { _id: id, isDeleted: false },
    {
      $set: {
        isDeleted: true,
        status: ProductStatus.ARCHIVED,
        deletedAt: new Date(),
        deletedBy,
        deletedReason: reason ?? "Manual archive",
      },
    },
  )
  return result.modifiedCount > 0
}

/**
 * Duplicates a Product.
 */
export async function duplicateProduct(productId: string, creator: string): Promise<ProductDocument | null> {
  const original = await ProductModel.findOne({ _id: productId, isDeleted: false }).lean()
  if (!original) return null

  let slug = `${original.seo.slug}-copy`
  let count = 1
  while (await ProductModel.exists({ "seo.slug": slug })) {
    slug = `${original.seo.slug}-copy-${count}`
    count++
  }

  const { _id, createdAt, updatedAt, ...copyData } = original
  const duplicate = new ProductModel({
    ...copyData,
    name: `Copy of ${original.name}`,
    normalizedName: `copy of ${original.name.toLowerCase()}`,
    status: ProductStatus.DRAFT,
    seo: {
      ...original.seo,
      slug
    },
    createdBy: creator,
    updatedBy: creator
  })

  await duplicate.save()
  return duplicate.toObject() as ProductDocument
}

/**
 * Creates a Variant document.
 */
export async function createVariant(data: Partial<VariantDocument>): Promise<VariantDocument> {
  const variant = new VariantModel(data)
  await variant.save()
  return variant.toObject() as VariantDocument
}

/**
 * Finds a Variant by ID.
 */
export async function findVariantById(id: string | Types.ObjectId): Promise<VariantDocument | null> {
  const doc = await VariantModel.findOne({ _id: id, isDeleted: false })
  return doc ? (doc.toObject() as VariantDocument) : null
}

/**
 * Finds a Variant by SKU.
 */
export async function findVariantBySku(sku: string): Promise<VariantDocument | null> {
  const doc = await VariantModel.findOne({ sku: sku.toUpperCase(), isDeleted: false })
  return doc ? (doc.toObject() as VariantDocument) : null
}

/**
 * Lists all variants belonging to a Product ID.
 */
export async function findVariantsByProductId(productId: string | Types.ObjectId): Promise<VariantDocument[]> {
  const docs = await VariantModel.find({
    productId: new Types.ObjectId(productId),
    isDeleted: false,
  })
    .sort({ sortOrder: 1, mrp: 1 })
    .lean()
    .exec()
  return docs as VariantDocument[]
}

/**
 * Updates a Variant by ID.
 */
export async function updateVariant(
  id: string | Types.ObjectId,
  data: Partial<VariantDocument>,
): Promise<VariantDocument | null> {
  const doc = await VariantModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: data },
    { new: true },
  )
  return doc ? (doc.toObject() as VariantDocument) : null
}

/**
 * Soft deletes/archives a single variant by ID.
 */
export async function softDeleteVariant(id: string | Types.ObjectId): Promise<boolean> {
  const result = await VariantModel.updateOne(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
  )
  return result.modifiedCount > 0
}

/**
 * Soft deletes all variants belonging to a Product.
 */
export async function softDeleteVariantsByProductId(productId: string | Types.ObjectId): Promise<number> {
  const result = await VariantModel.updateMany(
    { productId: new Types.ObjectId(productId), isDeleted: false },
    { $set: { isDeleted: true } },
  )
  return result.modifiedCount
}

/**
 * Duplicates a Variant and automatically generates a unique SKU.
 */
export async function duplicateVariant(variantId: string, creator: string): Promise<VariantDocument | null> {
  const original = await VariantModel.findOne({ _id: variantId, isDeleted: false }).lean()
  if (!original) return null

  // Ensure unique SKU
  let sku = `${original.sku}-COPY`
  let count = 1
  while (await VariantModel.exists({ sku })) {
    sku = `${original.sku}-COPY-${count}`
    count++
  }

  const { _id, createdAt, updatedAt, ...copyData } = original
  const duplicate = new VariantModel({
    ...copyData,
    sku,
    isDefault: false,
    createdBy: creator,
    updatedBy: creator
  })

  await duplicate.save()
  return duplicate.toObject() as VariantDocument
}

/**
 * Writes a transaction log to StockTransaction.
 */
export async function createStockTransaction(
  data: Partial<StockTransactionDocument>
): Promise<StockTransactionDocument> {
  const tx = new StockTransactionModel(data)
  await tx.save()
  return tx.toObject() as StockTransactionDocument
}

/**
 * Lists stock transactions by variant.
 */
export async function findStockTransactionsByVariantId(variantId: string): Promise<StockTransactionDocument[]> {
  const docs = await StockTransactionModel.find({ variantId: new Types.ObjectId(variantId) })
    .sort({ createdAt: -1 })
    .lean()
    .exec()
  return docs as StockTransactionDocument[]
}
