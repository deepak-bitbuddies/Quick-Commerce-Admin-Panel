export enum CatalogNodeType {
  NORMAL = "NORMAL",
  COLLECTION = "COLLECTION",
  SEASONAL = "SEASONAL",
  PROMOTIONAL = "PROMOTIONAL",
}

export enum CatalogNodeStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface CatalogNodeSeo {
  metaTitle?: string
  metaDescription?: string
  metaKeywords: string[]
}

export interface CatalogNodeVisibilityRules {
  enabled: boolean
  cities: string[]
  stores: string[]
  zones: string[]
  customerSegments: string[]
  membershipPlans: string[]
}

export interface CatalogNode {
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
  seo: CatalogNodeSeo
  visibilityRules: CatalogNodeVisibilityRules
  createdAt: string
  updatedAt: string
}

export interface CatalogNodeTreeNode extends CatalogNode {
  children: CatalogNodeTreeNode[]
}

export interface CatalogNodeBreadcrumb {
  id: string
  name: string
  slug: string
  level: number
}

export interface CatalogNodeMenu {
  id: string
  name: string
  slug: string
  type: CatalogNodeType
  icon?: string
  thumbnail?: string
  children: CatalogNodeMenu[]
}
