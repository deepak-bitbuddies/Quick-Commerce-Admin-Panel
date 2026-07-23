import { Schema, model, type Types } from "mongoose"

import { ProductStatus, VariantStatus, ProductType, VariantUnit, StockTransactionType, ProductAvailability } from "./enums.js"

export interface ProductDocument {
  _id: Types.ObjectId
  productType: "simple" | "variable"
  name: string
  normalizedName: string
  description?: string
  categoryId: string
  subCategoryId?: string | null
  brandId: Types.ObjectId
  taxId: Types.ObjectId
  badgeIds?: Types.ObjectId[]
  primaryImage?: string
  galleryImages: string[]
  tags: string[]
  seo: {
    metaTitle?: string
    metaDescription?: string
    slug: string
    keywords?: string[]
  }
  sortOrder: number
  availability: "in_stock" | "out_of_stock" | "incoming" | "discontinued"
  status: "draft" | "active" | "inactive" | "archived" | "out_of_stock"
  isDeleted: boolean
  deletedAt?: Date
  deletedBy?: string
  deletedReason?: string
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface VariantDocument {
  _id: Types.ObjectId
  productId: Types.ObjectId
  name: string
  unit: "gm" | "kg" | "litre" | "ml" | "pcs"
  unitValue: number
  sku: string
  mrp: number
  sellingPrice: number
  offerPrice?: number | null
  costPrice: number
  primaryImage?: string
  galleryImages: string[]
  inventory: {
    availableStock: number
    appStock: number
    localStock: number
    minStock: number
    reorderLevel: number
    reservedStock: number
  }
  sortOrder: number
  isDefault: boolean
  availability: "in_stock" | "out_of_stock" | "incoming" | "discontinued"
  status: "active" | "inactive"
  isDeleted: boolean
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface StockTransactionDocument {
  _id: Types.ObjectId
  variantId: Types.ObjectId
  type: string
  qtyChanged: number
  previousStock: number
  newStock: number
  reason?: string
  reference?: string
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

// PRODUCT SCHEMA (Product Master)
const productSchema = new Schema<ProductDocument>(
  {
    productType: {
      type: String,
      enum: Object.values(ProductType),
      default: ProductType.SIMPLE,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: { type: String, trim: true },
    
    // Category Registry (UUID string referencing CatalogNode)
    categoryId: { type: String, ref: "CatalogNode", required: true, index: true },
    subCategoryId: { type: String, ref: "CatalogNode", default: null, index: true },
    
    // Brand reference
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    
    // Tax Rate configuration (Lookup class)
    taxId: { type: Schema.Types.ObjectId, ref: "TaxRate", required: true, index: true },
    
    // Multiple Badges
    badgeIds: [{ type: Schema.Types.ObjectId, ref: "Badge", index: true }],
    
    // Image configuration (Primary & Gallery)
    primaryImage: { type: String, trim: true },
    galleryImages: { type: [String], default: [] },
    
    // Searchable tag keywords
    tags: { type: [String], default: [], index: true },
    
    // Display sequence
    sortOrder: { type: Number, default: 0, index: true },
    
    // Separate Status and Availability
    availability: {
      type: String,
      enum: Object.values(ProductAvailability),
      default: ProductAvailability.IN_STOCK,
      required: true,
      index: true,
    },
    seo: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      slug: { type: String, required: true, unique: true, index: true },
      keywords: { type: [String], default: [] }
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.DRAFT,
      required: true,
      index: true,
    },
    isDeleted: { type: Boolean, default: false, required: true, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: String },
    deletedReason: { type: String },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "products",
  },
)

// Index optimizations
productSchema.index({ categoryId: 1, status: 1, isDeleted: 1 })
productSchema.index({ name: "text", description: "text", tags: "text" })

export const ProductModel = model<ProductDocument>("Product", productSchema)

// VARIANT SCHEMA (SKU Variant)
const variantSchema = new Schema<VariantDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    name: { type: String, required: true, trim: true }, // generated from unit + value
    unit: {
      type: String,
      enum: Object.values(VariantUnit),
      required: true,
      index: true,
    },
    unitValue: { type: Number, required: true }, // e.g. 500, 1
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    
    // Pricing (Stored as integer Paise/Cents)
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    offerPrice: { type: Number, default: null },
    costPrice: { type: Number, required: true, default: 0 },
    
    // Variant Images (Primary & Gallery, falls back to Product if empty)
    primaryImage: { type: String, trim: true },
    galleryImages: { type: [String], default: [] },
    
    // Inventory pool structure
    inventory: {
      availableStock: { type: Number, required: true, default: 0 },
      appStock: { type: Number, required: true, default: 0 },
      localStock: { type: Number, required: true, default: 0 },
      minStock: { type: Number, required: true, default: 0 },
      reorderLevel: { type: Number, required: true, default: 0 },
      reservedStock: { type: Number, required: true, default: 0 }
    },

    // Display sequence
    sortOrder: { type: Number, default: 0, index: true },

    // Default variant indicator
    isDefault: { type: Boolean, default: false, index: true },

    // Separate Status and Availability per Variant
    availability: {
      type: String,
      enum: Object.values(ProductAvailability),
      default: ProductAvailability.IN_STOCK,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(VariantStatus),
      default: VariantStatus.ACTIVE,
      required: true,
      index: true,
    },
    isDeleted: { type: Boolean, default: false, required: true, index: true },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "variants",
  },
)

variantSchema.index({ productId: 1, status: 1, isDeleted: 1 })

export const VariantModel = model<VariantDocument>("Variant", variantSchema)

// STOCK TRANSACTION LED SCHEMA (Stock Transaction Audit Log)
const stockTransactionSchema = new Schema<StockTransactionDocument>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: "Variant", required: true, index: true },
    type: {
      type: String,
      enum: Object.values(StockTransactionType),
      required: true,
      index: true,
    },
    qtyChanged: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, trim: true, default: null },
    reference: { type: String, trim: true, default: null },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "stock_transactions",
  },
)

stockTransactionSchema.index({ variantId: 1, createdAt: -1 })

export const StockTransactionModel = model<StockTransactionDocument>("StockTransaction", stockTransactionSchema)
