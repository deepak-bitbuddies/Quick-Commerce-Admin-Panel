import type { ProductStatus, VariantStatus, ProductType, VariantUnit, StockTransactionType, ProductAvailability } from "./enums.js"

export interface VariantInventoryDto {
  availableStock: number
  appStock: number
  localStock: number
  minStock: number
  reorderLevel: number
  reservedStock: number
}

export interface CreateVariantDto {
  name?: string // generated if omitted
  unit: VariantUnit
  unitValue: number
  sku?: string // auto-generated if omitted
  mrp: number // in Paise
  sellingPrice: number // in Paise
  offerPrice?: number // in Paise, optional
  costPrice: number // in Paise
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

export interface ProductSeoDto {
  metaTitle?: string
  metaDescription?: string
  slug: string
  keywords?: string[]
}

export interface CreateProductDto {
  productType: ProductType
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
  seo: ProductSeoDto
  sortOrder?: number
  availability?: ProductAvailability
  status?: ProductStatus
  variants?: CreateVariantDto[]
}

export interface UpdateProductDto {
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
  seo?: Partial<ProductSeoDto>
  sortOrder?: number
  availability?: ProductAvailability
  status?: ProductStatus
}

export interface UpdateVariantDto {
  name?: string
  unit?: VariantUnit
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

export interface ProductListFilterDto {
  page?: number
  limit?: number
  categoryId?: string
  subCategoryId?: string
  brandId?: string
  status?: string
  availability?: string
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface VariantResponseDto {
  id: string
  productId: string
  name: string
  unit: VariantUnit
  unitValue: number
  sku: string
  mrp: number
  sellingPrice: number
  offerPrice?: number
  costPrice: number
  primaryImage?: string
  galleryImages: string[]
  inventory: VariantInventoryDto
  sortOrder: number
  isDefault: boolean
  availability: ProductAvailability
  status: VariantStatus
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

export interface ProductResponseDto {
  id: string
  productType: ProductType
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
  seo: ProductSeoDto
  sortOrder: number
  availability: ProductAvailability
  status: ProductStatus
  variants?: VariantResponseDto[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

export interface AdjustStockDto {
  qtyChanged: number
  type: StockTransactionType
  poolAffected: "appStock" | "localStock"
  reason?: string
  reference?: string
}

export interface TransferStockDto {
  qty: number
  reason?: string
  reference?: string
}

export interface StockTransactionResponseDto {
  id: string
  variantId: string
  type: StockTransactionType
  qtyChanged: number
  previousStock: number
  newStock: number
  reason?: string
  reference?: string
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
