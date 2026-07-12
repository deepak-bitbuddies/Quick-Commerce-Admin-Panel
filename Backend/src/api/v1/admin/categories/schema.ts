import { z } from "zod"

import { CatalogNodeStatus, CatalogNodeType } from "./enums.js"

const seoSchema = z.object({
  metaTitle: z.string().max(100).default(""),
  metaDescription: z.string().max(300).default(""),
  metaKeywords: z.array(z.string()).default([]),
})

const visibilityRulesSchema = z.object({
  enabled: z.boolean().default(false),
  cities: z.array(z.string()).default([]),
  stores: z.array(z.string()).default([]),
  zones: z.array(z.string()).default([]),
  customerSegments: z.array(z.string()).default([]),
  membershipPlans: z.array(z.string()).default([]),
})

export const createCatalogNodeSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must be under 50 characters")
    .regex(/^[A-Z0-9_]+$/, "Code must contain only uppercase alphanumeric characters and underscores"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  slug: z.string().max(100).optional().or(z.literal("")),
  type: z.nativeEnum(CatalogNodeType).default(CatalogNodeType.NORMAL),
  parentId: z.string().uuid().nullable().default(null),
  description: z.string().max(500).optional().or(z.literal("")),
  thumbnail: z.string().url("Invalid thumbnail URL").optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
  banner: z.string().url("Invalid banner URL").optional().or(z.literal("")),
  coverImage: z.string().url("Invalid cover image URL").optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
  status: z.nativeEnum(CatalogNodeStatus).default(CatalogNodeStatus.ACTIVE),
  isFeatured: z.boolean().default(false),
  showInMenu: z.boolean().default(true),
  showOnHome: z.boolean().default(true),
  backgroundColor: z.string().optional().or(z.literal("")),
  accentColor: z.string().optional().or(z.literal("")),
  searchKeywords: z.array(z.string()).default([]),
  allowedAttributeGroups: z.array(z.string()).default([]),
  seo: seoSchema.default({ metaTitle: "", metaDescription: "", metaKeywords: [] }),
  visibilityRules: visibilityRulesSchema.default({
    enabled: false,
    cities: [],
    stores: [],
    zones: [],
    customerSegments: [],
    membershipPlans: [],
  }),
})

export const updateCatalogNodeSchema = createCatalogNodeSchema.partial().extend({
  parentId: z.string().uuid().nullable().optional(),
})

export const bulkReorderSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int(),
    })
  ),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Must select at least one node to delete"),
  reason: z.string().max(200).optional(),
})

export const bulkStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Must select at least one node"),
  status: z.nativeEnum(CatalogNodeStatus),
})

export const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(CatalogNodeStatus).optional(),
  type: z.nativeEnum(CatalogNodeType).optional(),
  // Default (omitted/false) view excludes soft-deleted nodes, as before.
  // `deleted=true` flips to showing ONLY soft-deleted nodes — the one and
  // only way a deleted node becomes visible/restorable in the admin UI.
  deleted: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
