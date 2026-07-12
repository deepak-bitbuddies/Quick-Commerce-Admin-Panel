import { Schema, model, type InferSchemaType } from "mongoose"

import { CatalogNodeStatus, CatalogNodeType } from "./enums.js"

const catalogNodeSchema = new Schema(
  {
    _id: { type: String, required: true }, // GUID (UUIDv4)
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(CatalogNodeType),
      default: CatalogNodeType.NORMAL,
      required: true,
      index: true,
    },
    parentId: {
      type: String,
      ref: "CatalogNode",
      default: null,
      index: true,
    },
    level: { type: Number, default: 0, index: true },
    path: { type: String, required: true, index: true }, // Materialized path e.g. "/root-id/child-id"
    isLeaf: { type: Boolean, default: true, index: true },
    childCount: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    description: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    icon: { type: String, trim: true },
    banner: { type: String, trim: true },
    coverImage: { type: String, trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: Object.values(CatalogNodeStatus),
      default: CatalogNodeStatus.ACTIVE,
      required: true,
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    showInMenu: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: true },
    backgroundColor: { type: String, trim: true },
    accentColor: { type: String, trim: true },
    searchKeywords: { type: [String], default: [], index: true },
    allowedAttributeGroups: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
    deletedBy: { type: String, default: null },
    deletedReason: { type: String, default: null },
    seo: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      metaKeywords: { type: [String], default: [] },
    },
    visibilityRules: {
      enabled: { type: Boolean, default: false },
      cities: { type: [String], default: [] },
      stores: { type: [String], default: [] },
      zones: { type: [String], default: [] },
      customerSegments: { type: [String], default: [] },
      membershipPlans: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    collection: "catalog_nodes",
  },
)

// Add compound index for optimized tree listing on path & sortOrder
catalogNodeSchema.index({ path: 1, sortOrder: 1 })

export type CatalogNodeDocument = InferSchemaType<typeof catalogNodeSchema> & { _id: string }
export const CatalogNodeModel = model("CatalogNode", catalogNodeSchema)
