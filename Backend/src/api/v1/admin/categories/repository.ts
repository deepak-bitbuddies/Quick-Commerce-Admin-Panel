import { CatalogNodeModel, type CatalogNodeDocument } from "./model.js"
import { CatalogNodeStatus, CatalogNodeType } from "./enums.js"

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export interface CreateCatalogNodeInput {
  _id: string
  code: string
  name: string
  normalizedName: string
  slug: string
  type: CatalogNodeType
  parentId: string | null
  level: number
  path: string
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
  createdBy: string
  updatedBy: string
  seo: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords: string[]
  }
  visibilityRules: {
    enabled: boolean
    cities: string[]
    stores: string[]
    zones: string[]
    customerSegments: string[]
    membershipPlans: string[]
  }
}

export async function createCatalogNode(input: CreateCatalogNodeInput): Promise<CatalogNodeDocument> {
  return CatalogNodeModel.create(input)
}

export async function findCatalogNodeById(id: string): Promise<CatalogNodeDocument | null> {
  return CatalogNodeModel.findById(id).lean()
}

export async function findCatalogNodeBySlug(slug: string): Promise<CatalogNodeDocument | null> {
  return CatalogNodeModel.findOne({ slug, isDeleted: false }).lean()
}

export async function findCatalogNodeByCode(code: string): Promise<CatalogNodeDocument | null> {
  return CatalogNodeModel.findOne({ code, isDeleted: false }).lean()
}

export async function findCatalogNodeByNormalizedName(normalizedName: string): Promise<CatalogNodeDocument | null> {
  return CatalogNodeModel.findOne({ normalizedName, isDeleted: false }).lean()
}

export async function recalculateParentCounters(nodeId: string): Promise<void> {
  const childCount = await CatalogNodeModel.countDocuments({ parentId: nodeId, isDeleted: false })
  await CatalogNodeModel.updateOne(
    { _id: nodeId },
    { childCount, isLeaf: childCount === 0 }
  )
}

export interface ListCatalogNodesOptions {
  search?: string
  status?: CatalogNodeStatus
  type?: CatalogNodeType
  deleted?: boolean
  page?: number
  pageSize?: number
}

export async function listCatalogNodes(
  options: ListCatalogNodesOptions = {}
): Promise<{ nodes: CatalogNodeDocument[]; total: number }> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20
  const filter: Record<string, unknown> = options.deleted
    ? { isDeleted: true }
    : { isDeleted: false }

  if (options.status) {
    filter.status = options.status
  }
  if (options.type) {
    filter.type = options.type
  }
  if (options.search) {
    const escaped = escapeRegExp(options.search)
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { code: { $regex: escaped, $options: "i" } },
      { slug: { $regex: escaped, $options: "i" } },
      { searchKeywords: { $regex: escaped, $options: "i" } },
    ]
  }

  const [nodes, total] = await Promise.all([
    CatalogNodeModel.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    CatalogNodeModel.countDocuments(filter),
  ])

  return { nodes, total }
}

export async function getAllActiveCatalogNodes(): Promise<CatalogNodeDocument[]> {
  return CatalogNodeModel.find({ isDeleted: false })
    .sort({ sortOrder: 1, name: 1 })
    .lean()
}

export async function updateCatalogNode(
  id: string,
  update: Partial<CatalogNodeDocument>,
  updatedBy: string
): Promise<CatalogNodeDocument | null> {
  return CatalogNodeModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...update,
        updatedBy,
      },
    },
    { new: true }
  ).lean()
}

export async function softDeleteCatalogNode(
  id: string,
  deletedBy: string,
  reason?: string
): Promise<CatalogNodeDocument | null> {
  return CatalogNodeModel.findByIdAndUpdate(
    id,
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        deletedReason: reason || null,
      },
    },
    { new: true }
  ).lean()
}

export async function restoreCatalogNode(id: string, updatedBy: string): Promise<CatalogNodeDocument | null> {
  return CatalogNodeModel.findByIdAndUpdate(
    id,
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
        updatedBy,
      },
    },
    { new: true }
  ).lean()
}

export async function countActiveChildren(parentId: string): Promise<number> {
  return CatalogNodeModel.countDocuments({ parentId, isDeleted: false })
}

export async function bulkReorder(nodes: Array<{ id: string; sortOrder: number }>, updatedBy: string): Promise<void> {
  const bulkOps = nodes.map((node) => ({
    updateOne: {
      filter: { _id: node.id, isDeleted: { $ne: true } },
      update: { $set: { sortOrder: node.sortOrder, updatedBy } },
    },
  }))
  await CatalogNodeModel.bulkWrite(bulkOps)
}

export async function bulkDelete(ids: string[], deletedBy: string, reason?: string): Promise<void> {
  await CatalogNodeModel.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        deletedReason: reason || null,
      },
    }
  )
}

export async function bulkStatusUpdate(ids: string[], status: CatalogNodeStatus, updatedBy: string): Promise<void> {
  await CatalogNodeModel.updateMany(
    { _id: { $in: ids }, isDeleted: { $ne: true } },
    { $set: { status, updatedBy } }
  )
}
