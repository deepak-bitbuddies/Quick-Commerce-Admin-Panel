import { Types } from "mongoose"

import {
  createProduct as dbCreateProduct,
  findProductById,
  findProductBySlug,
  listProducts as dbListProducts,
  updateProduct as dbUpdateProduct,
  softDeleteProduct as dbSoftDeleteProduct,
  createVariant as dbCreateVariant,
  findVariantById,
  findVariantBySku,
  findVariantsByProductId,
  updateVariant as dbUpdateVariant,
  softDeleteVariantsByProductId,
  duplicateProduct as dbDuplicateProduct,
  duplicateVariant as dbDuplicateVariant,
  createStockTransaction,
  findStockTransactionsByVariantId,
  type ListProductsFilters,
} from "./repository.js"
import {
  type CreateProductDto,
  type CreateVariantDto,
  type UpdateProductDto,
  type UpdateVariantDto,
  type AdjustStockDto,
} from "./dto.js"
import { ProductStatus, VariantStatus, StockTransactionType, ProductAvailability } from "./enums.js"
import { CatalogNodeModel } from "../categories/model.js"
import { BrandModel } from "../brands/model.js"
import { TaxRateModel } from "../tax-rates/model.js"
import { ConflictError, NotFoundError, ValidationError } from "../../../../shared/errors/index.js"
import { ProductModel, VariantModel, type ProductDocument, type VariantDocument, type StockTransactionDocument } from "./model.js"
import { BadgeModel } from "../badges/model.js"

export interface ProductWithVariants {
  product: ProductDocument
  variants: VariantDocument[]
}

export interface PaginatedProducts {
  products: Array<ProductDocument & { variants: VariantDocument[] }>
  total: number
  page: number
  limit: number
}

export interface StockSyncResult {
  matchedCount: number
  unmatchedCount: number
  unmatchedList: Array<{
    line: number
    sku?: string
    reason: string
  }>
}

/**
 * Automatically generates a Variant Name from Unit and Unit Value.
 */
export function generateVariantName(unit: string, unitValue: number): string {
  const u = unit.toUpperCase()
  if (u === "PCS") {
    return unitValue > 1 ? `Pack of ${unitValue}` : `1 PCS`
  }
  return `${unitValue} ${u}`
}

/**
 * Automatically generates a unique SKU matching grocery patterns.
 * Example: SUGAR-500GM-0001, MILK-1L-0002
 */
export async function generateSku(productName: string, unit: string, unitValue: number): Promise<string> {
  const cleanName = productName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  const prefix = cleanName.slice(0, 6) || "SKU"
  
  let unitSuffix = unit.toUpperCase()
  if (unitSuffix === "LITRE") {
    unitSuffix = "L"
  }
  const unitStr = `${unitValue}${unitSuffix}`

  let count = 1
  let sku = `${prefix}-${unitStr}-${String(count).padStart(4, "0")}`
  while (await VariantModel.exists({ sku })) {
    count++
    sku = `${prefix}-${unitStr}-${String(count).padStart(4, "0")}`
  }
  return sku
}

/**
 * Validates Category, Sub-Category, Brand, Tax, and Badges referential integrity.
 */
async function validateReferences(
  dto: { categoryId: string; subCategoryId?: string; brandId: string; taxId: string; badgeIds?: string[] }
): Promise<void> {
  const categoryExists = await CatalogNodeModel.exists({ _id: dto.categoryId, isDeleted: false })
  if (!categoryExists) {
    throw new NotFoundError(`Category with ID '${dto.categoryId}' not found`)
  }

  if (dto.subCategoryId) {
    const subCategoryExists = await CatalogNodeModel.exists({ _id: dto.subCategoryId, isDeleted: false })
    if (!subCategoryExists) {
      throw new NotFoundError(`Sub-Category with ID '${dto.subCategoryId}' not found`)
    }
  }

  if (!Types.ObjectId.isValid(dto.brandId)) {
    throw new ValidationError("Invalid brandId format")
  }
  const brandExists = await BrandModel.exists({ _id: new Types.ObjectId(dto.brandId), isDeleted: false })
  if (!brandExists) {
    throw new NotFoundError(`Brand with ID '${dto.brandId}' not found`)
  }

  if (!Types.ObjectId.isValid(dto.taxId)) {
    throw new ValidationError("Invalid taxId format")
  }
  const taxExists = await TaxRateModel.exists({ _id: new Types.ObjectId(dto.taxId), isDeleted: false })
  if (!taxExists) {
    throw new NotFoundError(`Tax with ID '${dto.taxId}' not found`)
  }

  if (dto.badgeIds && dto.badgeIds.length > 0) {
    for (const bId of dto.badgeIds) {
      if (!Types.ObjectId.isValid(bId)) {
        throw new ValidationError(`Invalid badge ID format: ${bId}`)
      }
      const badgeExists = await BadgeModel.exists({ _id: new Types.ObjectId(bId), isDeleted: false })
      if (!badgeExists) {
        throw new NotFoundError(`Badge with ID '${bId}' not found`)
      }
    }
  }
}

/**
 * Creates a Product and its initial variants.
 */
export async function createProduct(dto: CreateProductDto, createdBy: string): Promise<ProductWithVariants> {
  const normalizedName = dto.name.trim().toLowerCase()

  const existingProduct = await ProductModel.findOne({ normalizedName, isDeleted: false })
  if (existingProduct) {
    throw new ConflictError(`Product with name '${dto.name}' already exists`)
  }

  const slugExists = await findProductBySlug(dto.seo.slug)
  if (slugExists) {
    throw new ConflictError(`SEO URL slug '${dto.seo.slug}' already exists`)
  }

  await validateReferences({
    categoryId: dto.categoryId,
    subCategoryId: dto.subCategoryId,
    brandId: dto.brandId,
    taxId: dto.taxId,
    badgeIds: dto.badgeIds,
  })

  // Verify unique SKUs in DB if provided
  if (dto.variants && dto.variants.length > 0) {
    const skuList = dto.variants.map((v) => v.sku?.toUpperCase().trim()).filter(Boolean) as string[]
    if (skuList.length !== new Set(skuList).size) {
      throw new ValidationError("Duplicate SKUs detected in the request variants list")
    }
    for (const sku of skuList) {
      const existing = await findVariantBySku(sku)
      if (existing) {
        throw new ConflictError(`SKU '${sku}' is already assigned to another variant`)
      }
    }
  }

  const productData: Partial<ProductDocument> = {
    productType: dto.productType,
    name: dto.name.trim(),
    normalizedName,
    description: dto.description?.trim(),
    categoryId: dto.categoryId,
    subCategoryId: dto.subCategoryId || null,
    brandId: new Types.ObjectId(dto.brandId),
    taxId: new Types.ObjectId(dto.taxId),
    badgeIds: (dto.badgeIds || []).map((id) => new Types.ObjectId(id)),
    primaryImage: dto.primaryImage?.trim(),
    galleryImages: dto.galleryImages || [],
    tags: dto.tags || [],
    seo: {
      metaTitle: dto.seo.metaTitle?.trim(),
      metaDescription: dto.seo.metaDescription?.trim(),
      slug: dto.seo.slug.trim().toLowerCase(),
      keywords: dto.seo.keywords || [],
    },
    sortOrder: dto.sortOrder ?? 0,
    availability: dto.availability || ProductAvailability.IN_STOCK,
    status: dto.status || ProductStatus.DRAFT,
    createdBy,
    updatedBy: createdBy,
  }

  const product = await dbCreateProduct(productData)

  const createdVariants: VariantDocument[] = []
  if (dto.variants && dto.variants.length > 0) {
    for (const vDto of dto.variants) {
      const appStock = vDto.appStock ?? 0
      const localStock = vDto.localStock ?? 0
      const availableStock = appStock + localStock

      // Auto name generation
      const name = generateVariantName(vDto.unit, vDto.unitValue)
      
      // Auto SKU generation if blank
      const sku = vDto.sku
        ? vDto.sku.toUpperCase().trim()
        : await generateSku(dto.name, vDto.unit, vDto.unitValue)

      const variantData: Partial<VariantDocument> = {
        productId: product._id,
        name,
        unit: vDto.unit,
        unitValue: vDto.unitValue,
        sku,
        mrp: vDto.mrp,
        sellingPrice: vDto.sellingPrice,
        offerPrice: vDto.offerPrice || null,
        costPrice: vDto.costPrice,
        primaryImage: vDto.primaryImage?.trim(),
        galleryImages: vDto.galleryImages || [],
        inventory: {
          availableStock,
          appStock,
          localStock,
          minStock: vDto.minStock ?? 0,
          reorderLevel: vDto.reorderLevel ?? 0,
          reservedStock: vDto.reservedStock ?? 0,
        },
        sortOrder: vDto.sortOrder ?? 0,
        isDefault: vDto.isDefault ?? false,
        availability: vDto.availability || ProductAvailability.IN_STOCK,
        status: vDto.status || VariantStatus.ACTIVE,
        createdBy,
        updatedBy: createdBy,
      }

      const variant = await dbCreateVariant(variantData)
      createdVariants.push(variant)

      if (availableStock > 0) {
        await createStockTransaction({
          variantId: variant._id,
          type: StockTransactionType.INITIAL_STOCK,
          qtyChanged: availableStock,
          previousStock: 0,
          newStock: availableStock,
          reason: "Initial stock setup on product creation",
          reference: "INITIAL_CREATION",
          createdBy,
          updatedBy: createdBy,
        })
      }
    }
  }

  return { product, variants: createdVariants }
}

/**
 * Lists products with their corresponding variants.
 */
export async function listProducts(filters: ListProductsFilters): Promise<PaginatedProducts> {
  const { products, total } = await dbListProducts(filters)
  const productIds = products.map((p) => p._id)

  const allVariants = await VariantModel.find({
    productId: { $in: productIds },
    isDeleted: false,
  })
    .sort({ sortOrder: 1, mrp: 1 })
    .lean()
    .exec()

  const productListWithVariants = products.map((product) => {
    const variants = allVariants.filter(
      (v: any) => v.productId.toString() === product._id.toString()
    ) as VariantDocument[]
    return {
      ...product,
      variants,
    }
  })

  return {
    products: productListWithVariants,
    total,
    page: filters.page,
    limit: filters.limit,
  }
}

/**
 * Fetches a single Product and its variants by ID.
 */
export async function getProductById(productId: string): Promise<ProductWithVariants> {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ValidationError("Invalid product ID format")
  }

  const productObjectId = new Types.ObjectId(productId)
  const product = await findProductById(productObjectId)
  if (!product) {
    throw new NotFoundError(`Product with ID '${productId}' not found`)
  }

  const variants = await findVariantsByProductId(productObjectId)
  return { product, variants }
}

/**
 * Updates a Product Master record.
 */
export async function updateProduct(
  productId: string,
  dto: UpdateProductDto,
  updatedBy: string,
): Promise<ProductDocument> {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ValidationError("Invalid product ID format")
  }

  const productObjectId = new Types.ObjectId(productId)
  const product = await findProductById(productObjectId)
  if (!product) {
    throw new NotFoundError(`Product with ID '${productId}' not found`)
  }

  const updateData: Partial<ProductDocument> = { updatedBy }

  if (dto.categoryId || dto.subCategoryId || dto.brandId || dto.taxId || dto.badgeIds) {
    await validateReferences({
      categoryId: dto.categoryId || product.categoryId,
      subCategoryId: dto.subCategoryId !== undefined ? (dto.subCategoryId || undefined) : (product.subCategoryId || undefined),
      brandId: dto.brandId || String(product.brandId),
      taxId: dto.taxId || String(product.taxId),
      badgeIds: dto.badgeIds || (product.badgeIds || []).map(String),
    })
  }

  if (dto.name !== undefined) {
    const normalizedName = dto.name.trim().toLowerCase()
    if (normalizedName !== product.normalizedName) {
      const nameExists = await ProductModel.findOne({ normalizedName, isDeleted: false })
      if (nameExists) {
        throw new ConflictError(`Product with name '${dto.name}' already exists`)
      }
      updateData.name = dto.name.trim()
      updateData.normalizedName = normalizedName
    }
  }

  if (dto.seo?.slug !== undefined) {
    const slug = dto.seo.slug.trim().toLowerCase()
    if (slug !== product.seo?.slug) {
      const slugExists = await findProductBySlug(slug)
      if (slugExists) {
        throw new ConflictError(`SEO URL slug '${slug}' already exists`)
      }
    }
  }

  if (dto.description !== undefined) updateData.description = dto.description ? dto.description.trim() : undefined
  if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId
  if (dto.subCategoryId !== undefined) updateData.subCategoryId = dto.subCategoryId
  if (dto.brandId !== undefined) updateData.brandId = new Types.ObjectId(dto.brandId)
  if (dto.taxId !== undefined) updateData.taxId = new Types.ObjectId(dto.taxId)
  if (dto.badgeIds !== undefined) updateData.badgeIds = dto.badgeIds.map((id) => new Types.ObjectId(id))
  
  if (dto.primaryImage !== undefined) {
    updateData.primaryImage = dto.primaryImage === null ? undefined : dto.primaryImage
  }
  if (dto.galleryImages !== undefined) updateData.galleryImages = dto.galleryImages
  if (dto.tags !== undefined) updateData.tags = dto.tags
  if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder
  if (dto.availability !== undefined) updateData.availability = dto.availability
  if (dto.status !== undefined) updateData.status = dto.status

  if (dto.seo) {
    updateData.seo = {
      metaTitle: dto.seo.metaTitle !== undefined ? dto.seo.metaTitle : product.seo?.metaTitle,
      metaDescription: dto.seo.metaDescription !== undefined ? dto.seo.metaDescription : product.seo?.metaDescription,
      slug: dto.seo.slug !== undefined ? dto.seo.slug.trim().toLowerCase() : (product.seo?.slug || ""),
      keywords: dto.seo.keywords !== undefined ? dto.seo.keywords : (product.seo?.keywords || []),
    }
  }

  const updatedProduct = await dbUpdateProduct(productObjectId, updateData)
  if (!updatedProduct) {
    throw new NotFoundError(`Product with ID '${productId}' not found`)
  }

  return updatedProduct
}

/**
 * Soft deletes/archives a product master record and all of its variants.
 */
export async function deleteProduct(productId: string, deletedBy: string, reason?: string): Promise<void> {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ValidationError("Invalid product ID format")
  }

  const productObjectId = new Types.ObjectId(productId)
  const exists = await findProductById(productObjectId)
  if (!exists) {
    throw new NotFoundError(`Product with ID '${productId}' not found`)
  }

  await dbSoftDeleteProduct(productObjectId, deletedBy, reason)
  await softDeleteVariantsByProductId(productObjectId)
}

/**
 * Duplicates a product and replicates all variants with uniqueness overrides.
 */
export async function duplicateProduct(productId: string, creator: string): Promise<ProductWithVariants> {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ValidationError("Invalid product ID format")
  }

  const duplicatedProduct = await dbDuplicateProduct(productId, creator)
  if (!duplicatedProduct) {
    throw new NotFoundError(`Product with ID '${productId}' not found`)
  }

  const originalVariants = await findVariantsByProductId(new Types.ObjectId(productId))
  const duplicatedVariants: VariantDocument[] = []

  for (const variant of originalVariants) {
    const duplicatedVar = await dbDuplicateVariant(variant._id.toString(), creator)
    if (duplicatedVar) {
      const reassociated = await dbUpdateVariant(duplicatedVar._id, {
        productId: duplicatedProduct._id
      })
      if (reassociated) {
        duplicatedVariants.push(reassociated)
        
        const totalStock = reassociated.inventory?.availableStock ?? 0
        if (totalStock > 0) {
          await createStockTransaction({
            variantId: reassociated._id,
            type: StockTransactionType.INITIAL_STOCK,
            qtyChanged: totalStock,
            previousStock: 0,
            newStock: totalStock,
            reason: `Initial stock from product duplication copy of ${variant.sku}`,
            reference: `PRODUCT_DUPLICATION`,
            createdBy: creator,
            updatedBy: creator,
          })
        }
      }
    }
  }

  return { product: duplicatedProduct, variants: duplicatedVariants }
}

/**
 * Creates a new Variant SKU linked to a product.
 */
export async function addVariant(
  productId: string,
  dto: CreateVariantDto,
  createdBy: string,
): Promise<VariantDocument> {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ValidationError("Invalid product ID format")
  }

  const productObjectId = new Types.ObjectId(productId)
  const product = await findProductById(productObjectId)
  if (!product) {
    throw new NotFoundError(`Product with ID '${productId}' not found`)
  }

  // Auto SKU generation if not provided
  const sku = dto.sku
    ? dto.sku.toUpperCase().trim()
    : await generateSku(product.name, dto.unit, dto.unitValue)

  const existingSku = await findVariantBySku(sku)
  if (existingSku) {
    throw new ConflictError(`Variant SKU '${sku}' already exists`)
  }

  const appStock = dto.appStock ?? 0
  const localStock = dto.localStock ?? 0
  const availableStock = appStock + localStock

  // Auto name generation
  const name = generateVariantName(dto.unit, dto.unitValue)

  const variantData: Partial<VariantDocument> = {
    productId: productObjectId,
    name,
    unit: dto.unit,
    unitValue: dto.unitValue,
    sku,
    mrp: dto.mrp,
    sellingPrice: dto.sellingPrice,
    offerPrice: dto.offerPrice || null,
    costPrice: dto.costPrice,
    primaryImage: dto.primaryImage?.trim(),
    galleryImages: dto.galleryImages || [],
    inventory: {
      availableStock,
      appStock,
      localStock,
      minStock: dto.minStock ?? 0,
      reorderLevel: dto.reorderLevel ?? 0,
      reservedStock: dto.reservedStock ?? 0,
    },
    sortOrder: dto.sortOrder ?? 0,
    isDefault: dto.isDefault ?? false,
    availability: dto.availability || ProductAvailability.IN_STOCK,
    status: dto.status || VariantStatus.ACTIVE,
    createdBy,
    updatedBy: createdBy,
  }

  const variant = await dbCreateVariant(variantData)

  if (availableStock > 0) {
    await createStockTransaction({
      variantId: variant._id,
      type: StockTransactionType.INITIAL_STOCK,
      qtyChanged: availableStock,
      previousStock: 0,
      newStock: availableStock,
      reason: "Initial stock setup on variant addition",
      reference: "VARIANT_CREATION",
      createdBy,
      updatedBy: createdBy,
    })
  }

  return variant
}

/**
 * Updates a Variant SKU.
 */
export async function updateVariant(
  variantId: string,
  dto: UpdateVariantDto,
  updatedBy: string,
): Promise<VariantDocument> {
  if (!Types.ObjectId.isValid(variantId)) {
    throw new ValidationError("Invalid variant ID format")
  }

  const variantObjectId = new Types.ObjectId(variantId)
  const variant = await findVariantById(variantObjectId)
  if (!variant) {
    throw new NotFoundError(`Variant with ID '${variantId}' not found`)
  }

  const updateData: Partial<VariantDocument> = { updatedBy }

  if (dto.sku !== undefined) {
    const sku = dto.sku.toUpperCase().trim()
    if (sku !== variant.sku) {
      const skuExists = await findVariantBySku(sku)
      if (skuExists) {
        throw new ConflictError(`Variant SKU '${sku}' already exists`)
      }
      updateData.sku = sku
    }
  }

  // Automatic variant name generation if unit or unitValue changes
  const unit = dto.unit !== undefined ? dto.unit : variant.unit
  const unitValue = dto.unitValue !== undefined ? dto.unitValue : variant.unitValue
  updateData.name = generateVariantName(unit, unitValue)
  updateData.unit = unit
  updateData.unitValue = unitValue

  if (dto.mrp !== undefined) updateData.mrp = dto.mrp
  if (dto.sellingPrice !== undefined) updateData.sellingPrice = dto.sellingPrice
  if (dto.offerPrice !== undefined) updateData.offerPrice = dto.offerPrice || null
  if (dto.costPrice !== undefined) updateData.costPrice = dto.costPrice
  
  if (dto.primaryImage !== undefined) {
    updateData.primaryImage = dto.primaryImage === null ? undefined : dto.primaryImage
  }
  if (dto.galleryImages !== undefined) updateData.galleryImages = dto.galleryImages
  if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder
  if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault
  if (dto.availability !== undefined) updateData.availability = dto.availability
  if (dto.status !== undefined) updateData.status = dto.status

  const appStock = dto.appStock !== undefined ? dto.appStock : (variant.inventory?.appStock ?? 0)
  const localStock = dto.localStock !== undefined ? dto.localStock : (variant.inventory?.localStock ?? 0)
  const minStock = dto.minStock !== undefined ? dto.minStock : (variant.inventory?.minStock ?? 0)
  const reorderLevel = dto.reorderLevel !== undefined ? dto.reorderLevel : (variant.inventory?.reorderLevel ?? 0)
  const reservedStock = dto.reservedStock !== undefined ? dto.reservedStock : (variant.inventory?.reservedStock ?? 0)
  const availableStock = appStock + localStock

  const prevApp = variant.inventory?.appStock ?? 0
  const prevLocal = variant.inventory?.localStock ?? 0
  const prevTotal = variant.inventory?.availableStock ?? 0

  updateData.inventory = {
    availableStock,
    appStock,
    localStock,
    minStock,
    reorderLevel,
    reservedStock,
  }

  const updated = await dbUpdateVariant(variantObjectId, updateData)
  if (!updated) {
    throw new NotFoundError(`Variant with ID '${variantId}' not found`)
  }

  const diffApp = appStock - prevApp
  const diffLocal = localStock - prevLocal

  if (diffApp !== 0) {
    await createStockTransaction({
      variantId: variantObjectId,
      type: StockTransactionType.MANUAL_ADJUSTMENT,
      qtyChanged: diffApp,
      previousStock: prevTotal,
      newStock: prevTotal + diffApp,
      reason: "Form-based manual override of App stock",
      reference: "FORM_UPDATE",
      createdBy: updatedBy,
      updatedBy,
    })
  }

  if (diffLocal !== 0) {
    await createStockTransaction({
      variantId: variantObjectId,
      type: StockTransactionType.MANUAL_ADJUSTMENT,
      qtyChanged: diffLocal,
      previousStock: prevTotal + diffApp,
      newStock: availableStock,
      reason: "Form-based manual override of Local stock",
      reference: "FORM_UPDATE",
      createdBy: updatedBy,
      updatedBy,
    })
  }

  return updated
}

/**
 * Soft deletes/archives a variant SKU.
 */
export async function deleteVariant(variantId: string): Promise<void> {
  if (!Types.ObjectId.isValid(variantId)) {
    throw new ValidationError("Invalid variant ID format")
  }

  const variantObjectId = new Types.ObjectId(variantId)
  const exists = await findVariantById(variantObjectId)
  if (!exists) {
    throw new NotFoundError(`Variant with ID '${variantId}' not found`)
  }

  await dbUpdateVariant(variantObjectId, {
    status: VariantStatus.INACTIVE,
    isDeleted: true
  })
}

/**
 * Clones a variant document.
 */
export async function duplicateVariant(variantId: string, creator: string): Promise<VariantDocument> {
  if (!Types.ObjectId.isValid(variantId)) {
    throw new ValidationError("Invalid variant ID format")
  }

  const clone = await dbDuplicateVariant(variantId, creator)
  if (!clone) {
    throw new NotFoundError(`Variant with ID '${variantId}' not found`)
  }

  const totalStock = clone.inventory?.availableStock ?? 0
  if (totalStock > 0) {
    await createStockTransaction({
      variantId: clone._id,
      type: StockTransactionType.INITIAL_STOCK,
      qtyChanged: totalStock,
      previousStock: 0,
      newStock: totalStock,
      reason: `Initial stock from duplicate clone variant`,
      reference: `VARIANT_DUPLICATION`,
      createdBy: creator,
      updatedBy: creator,
    })
  }

  return clone
}

/**
 * Parses raw CSV content with support for double-quoted cells.
 */
function parseCsv(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/)
  const result: string[][] = []

  for (const line of lines) {
    if (!line.trim()) continue
    const row: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    row.push(current.trim())
    result.push(row)
  }
  return result
}

/**
 * Synchronizes variants stock levels from a CSV export.
 */
export async function syncStockFromCsv(csvText: string, updatedBy: string): Promise<StockSyncResult> {
  const rows = parseCsv(csvText)
  if (rows.length < 2) {
    throw new ValidationError("CSV file must contain a header row and at least one data row")
  }

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[\s_-]+/g, ""))

  const skuIdx = headers.findIndex((h) => ["sku", "skucode", "itemcode", "code"].includes(h))
  const appStockIdx = headers.findIndex((h) => ["appstock", "onlinestock"].includes(h))
  const localStockIdx = headers.findIndex((h) => ["localstock", "storestock", "posstock", "stock", "quantity", "qty"].includes(h))
  const mrpIdx = headers.findIndex((h) => ["mrp", "price", "mrpprice"].includes(h))
  const sellingPriceIdx = headers.findIndex((h) => ["sellingprice", "rate", "apprate", "ratea"].includes(h))
  const costPriceIdx = headers.findIndex((h) => ["costprice", "cost", "purchaseprice"].includes(h))
  const unitIdx = headers.findIndex((h) => ["unit"].includes(h))

  if (skuIdx === -1) {
    throw new ValidationError("CSV must contain a 'SKU' column to identify variants")
  }

  let matchedCount = 0
  let unmatchedCount = 0
  const unmatchedList: StockSyncResult["unmatchedList"] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const sku = row[skuIdx]
    const appStockVal = appStockIdx !== -1 ? row[appStockIdx] : undefined
    const localStockVal = localStockIdx !== -1 ? row[localStockIdx] : undefined
    const mrpVal = mrpIdx !== -1 ? row[mrpIdx] : undefined
    const sellingPriceVal = sellingPriceIdx !== -1 ? row[sellingPriceIdx] : undefined
    const costPriceVal = costPriceIdx !== -1 ? row[costPriceIdx] : undefined
    const unitVal = unitIdx !== -1 ? row[unitIdx] : undefined

    if (!sku) {
      unmatchedCount++
      unmatchedList.push({
        line: i + 1,
        reason: "SKU identifier is blank",
      })
      continue
    }

    const variant = await VariantModel.findOne({ sku: sku.toUpperCase().trim(), isDeleted: false })
    if (!variant) {
      unmatchedCount++
      unmatchedList.push({
        line: i + 1,
        sku,
        reason: "No variant found matching this SKU",
      })
      continue
    }

    const prevApp = variant.inventory?.appStock ?? 0
    const prevLocal = variant.inventory?.localStock ?? 0
    const prevTotal = variant.inventory?.availableStock ?? 0

    let appStock = prevApp
    let localStock = prevLocal

    if (appStockVal !== undefined && appStockVal !== "") {
      const parsed = parseInt(appStockVal, 10)
      if (!isNaN(parsed)) appStock = Math.max(0, parsed)
    }
    if (localStockVal !== undefined && localStockVal !== "") {
      const parsed = parseInt(localStockVal, 10)
      if (!isNaN(parsed)) localStock = Math.max(0, parsed)
    }

    const availableStock = appStock + localStock
    const inventoryUpdate = {
      ...variant.inventory,
      appStock,
      localStock,
      availableStock,
    }

    const updateData: any = {
      inventory: inventoryUpdate,
      updatedBy,
    }

    if (mrpVal !== undefined && mrpVal !== "") {
      const parsed = parseFloat(mrpVal)
      if (!isNaN(parsed) && parsed > 0) updateData.mrp = Math.round(parsed * 100)
    }
    if (sellingPriceVal !== undefined && sellingPriceVal !== "") {
      const parsed = parseFloat(sellingPriceVal)
      if (!isNaN(parsed) && parsed >= 0) updateData.sellingPrice = Math.round(parsed * 100)
    }
    if (costPriceVal !== undefined && costPriceVal !== "") {
      const parsed = parseFloat(costPriceVal)
      if (!isNaN(parsed) && parsed >= 0) updateData.costPrice = Math.round(parsed * 100)
    }
    if (unitVal !== undefined && unitVal !== "") {
      updateData.unit = unitVal.trim()
    }

    await VariantModel.updateOne({ _id: variant._id }, { $set: updateData })
    matchedCount++

    const diffApp = appStock - prevApp
    const diffLocal = localStock - prevLocal

    if (diffApp !== 0) {
      await createStockTransaction({
        variantId: variant._id,
        type: StockTransactionType.MANUAL_ADJUSTMENT,
        qtyChanged: diffApp,
        previousStock: prevTotal,
        newStock: prevTotal + diffApp,
        reason: "CSV Sync Stock Adjustment (App Pool)",
        reference: "CSV_SYNC",
        createdBy: updatedBy,
        updatedBy,
      })
    }

    if (diffLocal !== 0) {
      await createStockTransaction({
        variantId: variant._id,
        type: StockTransactionType.MANUAL_ADJUSTMENT,
        qtyChanged: diffLocal,
        previousStock: prevTotal + diffApp,
        newStock: availableStock,
        reason: "CSV Sync Stock Adjustment (Local Pool)",
        reference: "CSV_SYNC",
        createdBy: updatedBy,
        updatedBy,
      })
    }
  }

  return { matchedCount, unmatchedCount, unmatchedList }
}

/**
 * Adjusts stock count of a variant SKU pool and creates a stock transaction history audit log.
 */
export async function adjustVariantStock(
  variantId: string,
  dto: AdjustStockDto,
  createdBy: string,
): Promise<VariantDocument> {
  if (!Types.ObjectId.isValid(variantId)) {
    throw new ValidationError("Invalid variant ID format")
  }

  const variantObjectId = new Types.ObjectId(variantId)
  const variant = await findVariantById(variantObjectId)
  if (!variant) {
    throw new NotFoundError(`Variant SKU with ID '${variantId}' not found`)
  }

  const isAppPool = dto.poolAffected === "appStock"
  const isLocalPool = dto.poolAffected === "localStock"

  let previousPoolStock = 0
  if (isAppPool) previousPoolStock = variant.inventory?.appStock ?? 0
  else if (isLocalPool) previousPoolStock = variant.inventory?.localStock ?? 0

  const qtyChanged = dto.qtyChanged
  const newPoolStock = previousPoolStock + qtyChanged

  if (newPoolStock < 0) {
    throw new ValidationError(
      `Cannot adjust ${dto.poolAffected} stock below zero. Current stock is ${previousPoolStock}, change requested is ${qtyChanged}`
    )
  }

  const previousTotalStock = variant.inventory?.availableStock ?? 0
  const newTotalStock = previousTotalStock + qtyChanged

  const inventoryUpdate = {
    ...variant.inventory,
    availableStock: newTotalStock,
  }

  if (isAppPool) inventoryUpdate.appStock = newPoolStock
  else if (isLocalPool) inventoryUpdate.localStock = newPoolStock

  const updatedVariant = await dbUpdateVariant(variantObjectId, {
    inventory: inventoryUpdate,
    updatedBy: createdBy
  })

  if (!updatedVariant) {
    throw new NotFoundError(`Variant stock update failed`)
  }

  await createStockTransaction({
    variantId: variantObjectId,
    type: dto.type,
    qtyChanged,
    previousStock: previousTotalStock,
    newStock: newTotalStock,
    reason: dto.reason || `Stock adjustment for ${dto.poolAffected}`,
    reference: dto.reference || "MANUAL_ADJUSTMENT",
    createdBy,
    updatedBy: createdBy,
  })

  return updatedVariant
}

/**
 * Transfers stock between App Stock and Local Store Stock.
 */
export async function transferVariantStock(
  variantId: string,
  qty: number,
  direction: "APP_TO_LOCAL" | "LOCAL_TO_APP",
  reason: string,
  reference: string,
  createdBy: string,
): Promise<VariantDocument> {
  if (!Types.ObjectId.isValid(variantId)) {
    throw new ValidationError("Invalid variant ID format")
  }

  const variantObjectId = new Types.ObjectId(variantId)
  const variant = await findVariantById(variantObjectId)
  if (!variant) {
    throw new NotFoundError(`Variant SKU with ID '${variantId}' not found`)
  }

  const appStock = variant.inventory?.appStock ?? 0
  const localStock = variant.inventory?.localStock ?? 0

  let newApp = appStock
  let newLocal = localStock

  if (direction === "APP_TO_LOCAL") {
    if (appStock < qty) {
      throw new ValidationError(`Insufficient App stock for transfer. Current: ${appStock}, Requested: ${qty}`)
    }
    newApp = appStock - qty
    newLocal = localStock + qty
  } else {
    if (localStock < qty) {
      throw new ValidationError(`Insufficient Local stock for transfer. Current: ${localStock}, Requested: ${qty}`)
    }
    newLocal = localStock - qty
    newApp = appStock + qty
  }

  const totalStock = newApp + newLocal

  const updated = await dbUpdateVariant(variantObjectId, {
    inventory: {
      ...variant.inventory,
      appStock: newApp,
      localStock: newLocal,
      availableStock: totalStock,
    },
    updatedBy: createdBy
  })

  if (!updated) {
    throw new NotFoundError(`Variant transfer update failed`)
  }

  await createStockTransaction({
    variantId: variantObjectId,
    type: StockTransactionType.TRANSFER,
    qtyChanged: qty,
    previousStock: totalStock,
    newStock: totalStock,
    reason: reason || `Transferred ${qty} from ${direction === "APP_TO_LOCAL" ? "App to Local" : "Local to App"}`,
    reference: reference || "STOCK_TRANSFER",
    createdBy,
    updatedBy: createdBy,
  })

  return updated
}

/**
 * Retrieves the stock movement history log for a variant SKU.
 */
export async function getStockHistory(variantId: string): Promise<StockTransactionDocument[]> {
  if (!Types.ObjectId.isValid(variantId)) {
    throw new ValidationError("Invalid variant ID format")
  }
  return findStockTransactionsByVariantId(variantId)
}

/**
 * Retrieves a single variant SKU details by ID.
 */
export async function getVariantById(variantId: string): Promise<VariantDocument> {
  if (!Types.ObjectId.isValid(variantId)) {
    throw new ValidationError("Invalid variant ID format")
  }

  const variantObjectId = new Types.ObjectId(variantId)
  const variant = await findVariantById(variantObjectId)
  if (!variant || variant.isDeleted) {
    throw new NotFoundError(`Variant SKU with ID '${variantId}' not found`)
  }

  return variant
}
