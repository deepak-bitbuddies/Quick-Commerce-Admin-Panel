import { randomUUID } from "crypto"

import {
  createCatalogNode,
  findCatalogNodeById,
  findCatalogNodeBySlug,
  findCatalogNodeByCode,
  findCatalogNodeByNormalizedName,
  recalculateParentCounters,
  listCatalogNodes,
  getAllActiveCatalogNodes,
  updateCatalogNode,
  softDeleteCatalogNode,
  restoreCatalogNode,
  countActiveChildren,
  bulkReorder,
  bulkDelete,
  bulkStatusUpdate,
} from "./repository.js"
import { CatalogNodeModel, type CatalogNodeDocument } from "./model.js"
import { CatalogNodeStatus, CatalogNodeType } from "./enums.js"
import type {
  CatalogNodeDto,
  CatalogNodeTreeNodeDto,
  CatalogNodeBreadcrumbDto,
  CatalogNodeMenuDto,
} from "./dto.js"
import { ConflictError, NotFoundError, ValidationError } from "../../../../shared/errors/index.js"

// Helper to map DB document to public DTO
function mapToDto(doc: CatalogNodeDocument): CatalogNodeDto {
  return {
    id: doc._id,
    code: doc.code,
    name: doc.name,
    slug: doc.slug,
    type: doc.type as CatalogNodeType,
    parentId: doc.parentId || null,
    level: doc.level ?? 0,
    path: doc.path,
    isLeaf: doc.isLeaf ?? true,
    childCount: doc.childCount ?? 0,
    productCount: doc.productCount ?? 0,
    description: doc.description || undefined,
    thumbnail: doc.thumbnail || undefined,
    icon: doc.icon || undefined,
    banner: doc.banner || undefined,
    coverImage: doc.coverImage || undefined,
    sortOrder: doc.sortOrder ?? 0,
    status: doc.status as CatalogNodeStatus,
    isFeatured: doc.isFeatured ?? false,
    showInMenu: doc.showInMenu ?? true,
    showOnHome: doc.showOnHome ?? true,
    backgroundColor: doc.backgroundColor || undefined,
    accentColor: doc.accentColor || undefined,
    searchKeywords: doc.searchKeywords || [],
    allowedAttributeGroups: doc.allowedAttributeGroups || [],
    isDeleted: doc.isDeleted ?? false,
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
    deletedBy: doc.deletedBy || null,
    deletedReason: doc.deletedReason || null,
    seo: {
      metaTitle: doc.seo?.metaTitle || undefined,
      metaDescription: doc.seo?.metaDescription || undefined,
      metaKeywords: doc.seo?.metaKeywords || [],
    },
    visibilityRules: {
      enabled: doc.visibilityRules?.enabled ?? false,
      cities: doc.visibilityRules?.cities || [],
      stores: doc.visibilityRules?.stores || [],
      zones: doc.visibilityRules?.zones || [],
      customerSegments: doc.visibilityRules?.customerSegments || [],
      membershipPlans: doc.visibilityRules?.membershipPlans || [],
    },
    createdAt: (doc as any).createdAt ? (doc as any).createdAt.toISOString() : new Date().toISOString(),
    updatedAt: (doc as any).updatedAt ? (doc as any).updatedAt.toISOString() : new Date().toISOString(),
  }
}

// Helper to normalize and slugify names
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters
    .replace(/[\s_]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single one
}

export async function createNode(input: any, createdBy: string): Promise<CatalogNodeDto> {
  const normalizedName = input.name.trim().toLowerCase()
  const code = input.code.trim().toUpperCase()

  // 1. Uniqueness Checks
  const [existingName, existingCode] = await Promise.all([
    findCatalogNodeByNormalizedName(normalizedName),
    findCatalogNodeByCode(code),
  ])

  if (existingName) {
    throw new ConflictError(`Catalog Node with name '${input.name}' already exists`)
  }
  if (existingCode) {
    throw new ConflictError(`Catalog Node with integration code '${input.code}' already exists`)
  }

  // 2. Slug Resolution
  const baseSlug = input.slug?.trim() ? generateSlug(input.slug) : generateSlug(input.name)
  let slug = baseSlug
  let counter = 1
  while (await findCatalogNodeBySlug(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const id = randomUUID()
  let parentLevel = 0
  let parentPath = ""

  // 3. Parent Validation & Path Building
  if (input.parentId) {
    const parent = await findCatalogNodeById(input.parentId)
    if (!parent || parent.isDeleted) {
      throw new ValidationError("Proposed parent node does not exist or is deleted")
    }
    parentLevel = parent.level ?? 0
    parentPath = parent.path
  }

  const newPath = input.parentId ? `${parentPath}/${id}` : `/${id}`
  const newLevel = input.parentId ? parentLevel + 1 : 0

  const doc = await createCatalogNode({
    _id: id,
    code,
    name: input.name,
    normalizedName,
    slug,
    type: input.type,
    parentId: input.parentId,
    level: newLevel,
    path: newPath,
    description: input.description,
    thumbnail: input.thumbnail,
    icon: input.icon,
    banner: input.banner,
    coverImage: input.coverImage,
    sortOrder: input.sortOrder ?? 0,
    status: input.status,
    isFeatured: input.isFeatured,
    showInMenu: input.showInMenu,
    showOnHome: input.showOnHome,
    backgroundColor: input.backgroundColor,
    accentColor: input.accentColor,
    searchKeywords: input.searchKeywords || [],
    allowedAttributeGroups: input.allowedAttributeGroups || [],
    createdBy,
    updatedBy: createdBy,
    seo: input.seo || { metaKeywords: [] },
    visibilityRules: input.visibilityRules || {
      enabled: false,
      cities: [],
      stores: [],
      zones: [],
      customerSegments: [],
      membershipPlans: [],
    },
  })

  // 4. Update Parent Counters
  if (input.parentId) {
    await recalculateParentCounters(input.parentId)
  }

  return mapToDto(doc)
}

export async function getNodeById(id: string): Promise<CatalogNodeDto> {
  const doc = await findCatalogNodeById(id)
  if (!doc || doc.isDeleted) {
    throw new NotFoundError("Catalog Node not found")
  }
  return mapToDto(doc)
}

export async function getNodeBySlug(slug: string): Promise<CatalogNodeDto> {
  const doc = await findCatalogNodeBySlug(slug)
  if (!doc) {
    throw new NotFoundError("Catalog Node not found")
  }
  return mapToDto(doc)
}

export async function updateNode(id: string, updatePayload: any, updatedBy: string): Promise<CatalogNodeDto> {
  const node = await findCatalogNodeById(id)
  if (!node || node.isDeleted) {
    throw new NotFoundError("Catalog Node not found")
  }

  const updates: Partial<CatalogNodeDocument> = {}

  // 1. Rename logic
  if (updatePayload.name && updatePayload.name.trim().toLowerCase() !== node.normalizedName) {
    const normalizedName = updatePayload.name.trim().toLowerCase()
    const existing = await findCatalogNodeByNormalizedName(normalizedName)
    if (existing && existing._id !== id) {
      throw new ConflictError(`Catalog Node with name '${updatePayload.name}' already exists`)
    }
    updates.name = updatePayload.name
    updates.normalizedName = normalizedName
  }

  // 2. Code check
  if (updatePayload.code && updatePayload.code.trim().toUpperCase() !== node.code) {
    const code = updatePayload.code.trim().toUpperCase()
    const existing = await findCatalogNodeByCode(code)
    if (existing && existing._id !== id) {
      throw new ConflictError(`Catalog Node with integration code '${updatePayload.code}' already exists`)
    }
    updates.code = code
  }

  // 3. Slug check
  if (updatePayload.slug && updatePayload.slug.trim() !== node.slug) {
    let slug = generateSlug(updatePayload.slug)
    let counter = 1
    while (true) {
      const existing = await findCatalogNodeBySlug(slug)
      if (!existing || existing._id === id) {
        break
      }
      slug = `${generateSlug(updatePayload.slug)}-${counter}`
      counter++
    }
    updates.slug = slug
  }

  // 4. Reparenting and materialized path shift
  const parentIdChanged = updatePayload.parentId !== undefined && updatePayload.parentId !== node.parentId
  const oldParentId = node.parentId

  if (parentIdChanged) {
    const newParentId = updatePayload.parentId
    if (newParentId === id) {
      throw new ValidationError("A node cannot be its own parent")
    }

    let newLevel = 0
    let newPath = ""

    if (newParentId) {
      const parent = await findCatalogNodeById(newParentId)
      if (!parent || parent.isDeleted) {
        throw new ValidationError("Proposed parent node does not exist or is deleted")
      }
      // Circular Reference Blocker: Walk up parent path
      if (parent.path.startsWith(`${node.path}/`) || parent.path === node.path) {
        throw new ValidationError("Circular reference detected: cannot assign a child node as its parent")
      }
      newLevel = parent.level + 1
      newPath = `${parent.path}/${id}`
    } else {
      newPath = `/${id}`
    }

    updates.parentId = newParentId
    updates.level = newLevel
    updates.path = newPath

    // Move all descendants recursively
    const oldPath = node.path
    const levelDiff = newLevel - node.level

    const descendants = await CatalogNodeModel.find({ path: new RegExp(`^${oldPath}/`), isDeleted: false })
    for (const desc of descendants) {
      const descNewPath = desc.path.replace(oldPath, newPath)
      const descNewLevel = desc.level + levelDiff
      await CatalogNodeModel.updateOne(
        { _id: desc._id },
        { $set: { path: descNewPath, level: descNewLevel, updatedBy } }
      )
    }
  }

  // Bind direct fields
  const fields = [
    "description",
    "thumbnail",
    "icon",
    "banner",
    "coverImage",
    "sortOrder",
    "status",
    "isFeatured",
    "showInMenu",
    "showOnHome",
    "backgroundColor",
    "accentColor",
    "searchKeywords",
    "allowedAttributeGroups",
    "seo",
    "visibilityRules",
  ]
  for (const field of fields) {
    if (updatePayload[field] !== undefined) {
      ;(updates as any)[field] = updatePayload[field]
    }
  }

  const updatedDoc = await updateCatalogNode(id, updates, updatedBy)
  if (!updatedDoc) {
    throw new NotFoundError("Catalog Node not found")
  }

  // Recalculate old parent counters, new parent counters, and self
  if (parentIdChanged) {
    if (oldParentId) await recalculateParentCounters(oldParentId)
    if (updates.parentId) await recalculateParentCounters(updates.parentId)
  }
  await recalculateParentCounters(id)

  return mapToDto(updatedDoc)
}

export async function deleteNode(id: string, deletedBy: string, reason?: string): Promise<CatalogNodeDto> {
  const node = await findCatalogNodeById(id)
  if (!node || node.isDeleted) {
    throw new NotFoundError("Catalog Node not found")
  }

  // Prevent delete if it has active subcategories
  const childCount = await countActiveChildren(id)
  if (childCount > 0) {
    throw new ValidationError("Cannot delete a category node that has active child subcategories")
  }

  const deletedDoc = await softDeleteCatalogNode(id, deletedBy, reason)
  if (!deletedDoc) {
    throw new NotFoundError("Catalog Node not found")
  }

  // Recalculate parent counters
  if (node.parentId) {
    await recalculateParentCounters(node.parentId)
  }

  return mapToDto(deletedDoc)
}

export async function restoreNode(id: string, updatedBy: string): Promise<CatalogNodeDto> {
  const node = await findCatalogNodeById(id)
  if (!node || !node.isDeleted) {
    throw new ValidationError("Catalog Node is not soft-deleted")
  }

  const restoredDoc = await restoreCatalogNode(id, updatedBy)
  if (!restoredDoc) {
    throw new NotFoundError("Catalog Node not found")
  }

  // Recalculate parent counters
  if (node.parentId) {
    await recalculateParentCounters(node.parentId)
  }

  return mapToDto(restoredDoc)
}

export async function getFlatNodes(queryOptions: any) {
  const { nodes, total } = await listCatalogNodes(queryOptions)
  return {
    nodes: nodes.map(mapToDto),
    total,
  }
}

// In-Memory Tree Builder
export async function getTree(): Promise<CatalogNodeTreeNodeDto[]> {
  const allNodes = await getAllActiveCatalogNodes()

  const nodeMap = new Map<string, CatalogNodeTreeNodeDto>()
  const rootNodes: CatalogNodeTreeNodeDto[] = []

  // Initialize nodes map with empty children arrays
  for (const node of allNodes) {
    const dto = mapToDto(node)
    nodeMap.set(dto.id, { ...dto, children: [] })
  }

  // Build tree
  for (const node of allNodes) {
    const item = nodeMap.get(node._id)!
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId)
      if (parent) {
        parent.children.push(item)
      } else {
        // Parent might be inactive/deleted, treat as root for safety
        rootNodes.push(item)
      }
    } else {
      rootNodes.push(item)
    }
  }

  // Sort children by sortOrder and name
  const sortTreeNodes = (nodes: CatalogNodeTreeNodeDto[]) => {
    nodes.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return a.name.localeCompare(b.name)
    })
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortTreeNodes(node.children)
      }
    }
  }

  sortTreeNodes(rootNodes)
  return rootNodes
}

// Lightweight tree for Navbar/Dropdown Menus
export async function getMenu(): Promise<CatalogNodeMenuDto[]> {
  const tree = await getTree()

  const mapToMenu = (node: CatalogNodeTreeNodeDto): CatalogNodeMenuDto | null => {
    if (!node.showInMenu || node.status !== CatalogNodeStatus.ACTIVE) {
      return null
    }

    const childMenu: CatalogNodeMenuDto[] = []
    for (const child of node.children) {
      const mapped = mapToMenu(child)
      if (mapped) childMenu.push(mapped)
    }

    return {
      id: node.id,
      name: node.name,
      slug: node.slug,
      type: node.type,
      icon: node.icon,
      thumbnail: node.thumbnail,
      children: childMenu,
    }
  }

  return tree.map((node) => mapToMenu(node)).filter(Boolean) as CatalogNodeMenuDto[]
}

// Home screen category clusters
export async function getHomeNodes(): Promise<CatalogNodeDto[]> {
  const docs = await CatalogNodeModel.find({
    isDeleted: false,
    status: CatalogNodeStatus.ACTIVE,
    $or: [{ showOnHome: true }, { isFeatured: true }],
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean()

  return docs.map(mapToDto)
}

// Path Breadcrumbs generator
export async function getBreadcrumbs(slug: string): Promise<CatalogNodeBreadcrumbDto[]> {
  const node = await findCatalogNodeBySlug(slug)
  if (!node) {
    throw new NotFoundError("Catalog Node not found")
  }

  const ids = node.path.split("/").filter(Boolean)
  const ancestors = await CatalogNodeModel.find({ _id: { $in: ids }, isDeleted: false })
    .sort({ level: 1 })
    .lean()

  return ancestors.map((doc) => ({
    id: doc._id,
    name: doc.name,
    slug: doc.slug,
    level: doc.level ?? 0,
  }))
}

// Bulk Actions
export async function executeBulkReorder(nodes: Array<{ id: string; sortOrder: number }>, updatedBy: string): Promise<void> {
  await bulkReorder(nodes, updatedBy)
}

export async function executeBulkDelete(ids: string[], deletedBy: string, reason?: string): Promise<void> {
  // Verify none have active subcategories
  for (const id of ids) {
    const childCount = await countActiveChildren(id)
    if (childCount > 0) {
      throw new ValidationError(`Cannot delete node '${id}' because it has active child subcategories`)
    }
  }
  await bulkDelete(ids, deletedBy, reason)
}

export async function executeBulkStatusUpdate(ids: string[], status: CatalogNodeStatus, updatedBy: string): Promise<void> {
  await bulkStatusUpdate(ids, status, updatedBy)
}
