import { CatalogNodeStatus, CatalogNodeType } from "./enums.js"

export interface CatalogNodeSeoDto {
  metaTitle?: string
  metaDescription?: string
  metaKeywords: string[]
}

export interface CatalogNodeVisibilityRulesDto {
  enabled: boolean
  cities: string[]
  stores: string[]
  zones: string[]
  customerSegments: string[]
  membershipPlans: string[]
}

export interface CatalogNodeDto {
  id: string
  code: string
  name: string
  slug: string
  type: CatalogNodeType
  parentId: string | null
  level: number
  path: string
  isLeaf: boolean
  childCount: number
  productCount: number
  description?: string
  thumbnail?: string
  icon?: string
  banner?: string
  coverImage?: string
  sortOrder: number
  status: CatalogNodeStatus
  isFeatured: boolean
  showInMenu: boolean
  showOnHome: boolean
  backgroundColor?: string
  accentColor?: string
  searchKeywords: string[]
  allowedAttributeGroups: string[]
  isDeleted: boolean
  deletedAt: string | null
  createdBy: string
  updatedBy: string
  deletedBy: string | null
  deletedReason: string | null
  seo: CatalogNodeSeoDto
  visibilityRules: CatalogNodeVisibilityRulesDto
  createdAt: string
  updatedAt: string
}

export interface CatalogNodeTreeNodeDto extends CatalogNodeDto {
  children: CatalogNodeTreeNodeDto[]
}

export interface CatalogNodeBreadcrumbDto {
  id: string
  name: string
  slug: string
  level: number
}

export interface CatalogNodeMenuDto {
  id: string
  name: string
  slug: string
  type: CatalogNodeType
  icon?: string
  thumbnail?: string
  children: CatalogNodeMenuDto[]
}
