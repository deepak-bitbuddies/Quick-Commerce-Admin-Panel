export type ProductStatus = "draft" | "active" | "inactive" | "archived" | "out_of_stock"
export type ProductAvailability = "in_stock" | "out_of_stock" | "incoming" | "discontinued"
export type VariantStatus = "active" | "inactive"

export interface VariantInventory {
  availableStock: number
  appStock: number
  localStock: number
  minStock: number
  reorderLevel: number
  reservedStock: number
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  unit: string
  unitValue: number
  sku: string
  mrp: number // in paise (e.g. 5000 is ₹50.00)
  sellingPrice: number // in paise
  offerPrice?: number // in paise, optional
  costPrice: number // in paise
  primaryImage?: string
  galleryImages: string[]
  inventory: VariantInventory
  sortOrder: number
  isDefault: boolean
  availability: ProductAvailability
  status: VariantStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface ProductSeo {
  metaTitle?: string
  metaDescription?: string
  slug: string
  keywords: string[]
}

export interface Product {
  id: string
  productType: "simple" | "variable"
  name: string
  description?: string
  categoryId: string
  subCategoryId?: string
  brandId: string
  taxId: string
  badgeIds: string[]
  primaryImage?: string
  galleryImages: string[]
  tags: string[]
  seo: ProductSeo
  sortOrder: number
  availability: ProductAvailability
  status: ProductStatus
  variants?: ProductVariant[]
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  isDeleted?: boolean
  deletedAt?: string
  deletedBy?: string
  deletedReason?: string
}

export interface CreateVariantInput {
  name?: string
  unit: string
  unitValue: number
  sku?: string
  mrp: number // in paise
  sellingPrice: number // in paise
  offerPrice?: number // in paise
  costPrice: number // in paise
  primaryImage?: string
  galleryImages?: string[]
  appStock?: number
  localStock?: number
  minStock?: number
  reorderLevel?: number
  reservedStock?: number
  sortOrder?: number
  isDefault?: boolean
  availability?: ProductAvailability
  status?: VariantStatus
}

export interface CreateProductInput {
  productType: "simple" | "variable"
  name: string
  description?: string
  categoryId: string
  subCategoryId?: string
  brandId: string
  taxId: string
  badgeIds?: string[]
  primaryImage?: string
  galleryImages?: string[]
  tags?: string[]
  seo: ProductSeo
  sortOrder?: number
  availability?: ProductAvailability
  status?: ProductStatus
  variants?: CreateVariantInput[]
}

export interface UpdateProductInput {
  name?: string
  description?: string | null
  categoryId?: string
  subCategoryId?: string | null
  brandId?: string
  taxId?: string
  badgeIds?: string[]
  primaryImage?: string | null
  galleryImages?: string[]
  tags?: string[]
  seo?: Partial<ProductSeo>
  sortOrder?: number
  availability?: ProductAvailability
  status?: ProductStatus
}

export interface UpdateVariantInput {
  name?: string
  unit?: string
  unitValue?: number
  sku?: string
  mrp?: number
  sellingPrice?: number
  offerPrice?: number | null
  costPrice?: number
  primaryImage?: string | null
  galleryImages?: string[]
  appStock?: number
  localStock?: number
  minStock?: number
  reorderLevel?: number
  reservedStock?: number
  sortOrder?: number
  isDefault?: boolean
  availability?: ProductAvailability
  status?: VariantStatus
}

export interface ProductListParams {
  page?: number
  pageSize?: number
  categoryId?: string
  subCategoryId?: string
  brandId?: string
  status?: string
  availability?: string
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  showArchived?: boolean
}

export interface ProductListResult {
  products: Product[]
  meta: {
    total: number
    page: number
    limit: number
  }
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

export interface StockTransaction {
  id: string
  variantId: string
  type: string
  qtyChanged: number
  previousStock: number
  newStock: number
  reason?: string
  reference?: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface ProductFaq {
  _id: string
  productId: string | { _id: string; name: string }
  question: string
  answer: string
  sortOrder: number
  status: "active" | "inactive"
  createdAt: string
}

export interface ProductReview {
  _id: string
  productId: string | { _id: string; name: string }
  customerName: string
  rating: number
  reviewText: string
  reviewImages: string[]
  adminReply: string
  isVerifiedPurchase: boolean
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

export interface ProductStats {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  draftProducts: number
  outOfStock: number
  lowStock: number
  archivedProducts: number
}

export interface ProductBadge {
  id: string
  name: string
  color: string
  textColor: string
  status: "active" | "inactive" | "deleted"
  createdAt: string
}
