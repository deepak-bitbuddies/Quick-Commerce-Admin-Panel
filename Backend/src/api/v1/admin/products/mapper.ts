import type { ProductDocument, VariantDocument, StockTransactionDocument } from "./model.js"
import type { ProductResponseDto, VariantResponseDto, StockTransactionResponseDto } from "./dto.js"

/**
 * Maps a Mongoose Variant document to the public response shape.
 * Leverages the parent product as a fallback context for image assets.
 */
export function toVariantResponseDto(
  variant: VariantDocument,
  parentProduct?: { primaryImage?: string; galleryImages?: string[] },
): VariantResponseDto {
  return {
    id: String(variant._id),
    productId: String(variant.productId),
    name: variant.name,
    unit: variant.unit as any,
    unitValue: variant.unitValue,
    sku: variant.sku,
    mrp: variant.mrp,
    sellingPrice: variant.sellingPrice,
    offerPrice: variant.offerPrice ?? undefined,
    costPrice: variant.costPrice,
    
    // Primary & Gallery Fallback
    primaryImage: variant.primaryImage || parentProduct?.primaryImage || undefined,
    galleryImages: (variant.galleryImages && variant.galleryImages.length > 0)
      ? variant.galleryImages
      : (parentProduct?.galleryImages || []),
      
    inventory: {
      availableStock: variant.inventory?.availableStock ?? 0,
      appStock: variant.inventory?.appStock ?? 0,
      localStock: variant.inventory?.localStock ?? 0,
      minStock: variant.inventory?.minStock ?? 0,
      reorderLevel: variant.inventory?.reorderLevel ?? 0,
      reservedStock: variant.inventory?.reservedStock ?? 0,
    },
    sortOrder: variant.sortOrder ?? 0,
    isDefault: variant.isDefault ?? false,
    availability: variant.availability as any,
    status: variant.status as any,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    createdBy: variant.createdBy,
    updatedBy: variant.updatedBy,
  }
}

/**
 * Maps a Mongoose Product document (with optional populated/attached variants)
 * to the public response shape.
 */
export function toProductResponseDto(
  product: ProductDocument,
  variants?: VariantDocument[],
): ProductResponseDto {
  return {
    id: String(product._id),
    productType: product.productType as any,
    name: product.name,
    description: product.description ?? undefined,
    categoryId: product.categoryId,
    subCategoryId: product.subCategoryId ?? undefined,
    brandId: String(product.brandId),
    taxId: String(product.taxId),
    badgeIds: (product.badgeIds || []).map(String),
    primaryImage: product.primaryImage ?? undefined,
    galleryImages: product.galleryImages || [],
    tags: product.tags || [],
    seo: {
      metaTitle: product.seo?.metaTitle ?? undefined,
      metaDescription: product.seo?.metaDescription ?? undefined,
      slug: product.seo?.slug,
      keywords: product.seo?.keywords || [],
    },
    sortOrder: product.sortOrder ?? 0,
    availability: product.availability as any,
    status: product.status as any,
    variants: variants
      ? variants.map((v) => toVariantResponseDto(v, product))
      : undefined,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    createdBy: product.createdBy,
    updatedBy: product.updatedBy,
  }
}

/**
 * Maps a Mongoose StockTransaction document to the public response shape.
 */
export function toStockTransactionResponseDto(tx: StockTransactionDocument): StockTransactionResponseDto {
  return {
    id: String(tx._id),
    variantId: String(tx.variantId),
    type: tx.type as any,
    qtyChanged: tx.qtyChanged,
    previousStock: tx.previousStock,
    newStock: tx.newStock,
    reason: tx.reason ?? undefined,
    reference: tx.reference ?? undefined,
    createdBy: tx.createdBy,
    updatedBy: tx.updatedBy,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  }
}
