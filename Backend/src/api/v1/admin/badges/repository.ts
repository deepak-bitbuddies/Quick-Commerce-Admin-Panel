import { BadgeModel, type BadgeDocument } from "./model.js"
import { BadgeStatus } from "./enums.js"

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export interface CreateBadgeInput {
  name: string
  normalizedName: string
  color: string
  textColor: string
  createdBy?: string
}

export async function createBadge(
  input: CreateBadgeInput,
): Promise<BadgeDocument> {
  return BadgeModel.create({
    ...input,
    status: BadgeStatus.ACTIVE,
    isDeleted: false,
  })
}

export async function findBadgeById(
  id: string,
): Promise<BadgeDocument | null> {
  return BadgeModel.findOne({ _id: id, isDeleted: { $ne: true } }).lean()
}

export async function findBadgeByNormalizedName(
  normalizedName: string,
): Promise<BadgeDocument | null> {
  return BadgeModel.findOne({ normalizedName, isDeleted: { $ne: true } }).lean()
}

export interface ListBadgesOptions {
  search?: string
  status?: string
  deleted?: boolean
  page?: number
  pageSize?: number
}

export async function listBadges(
  options: ListBadgesOptions = {},
): Promise<{ badges: BadgeDocument[]; total: number }> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20
  const filter: Record<string, unknown> = options.deleted
    ? { isDeleted: true }
    : { isDeleted: { $ne: true } }

  if (options.status) {
    filter.status = options.status.toLowerCase()
  }
  if (options.search) {
    filter.name = { $regex: escapeRegExp(options.search), $options: "i" }
  }

  const [badges, total] = await Promise.all([
    BadgeModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    BadgeModel.countDocuments(filter),
  ])

  return { badges, total }
}

export interface UpdateBadgeInput {
  name?: string
  normalizedName?: string
  color?: string
  textColor?: string
  status?: string
  updatedBy?: string
}

export async function updateBadge(
  id: string,
  input: UpdateBadgeInput,
): Promise<BadgeDocument | null> {
  const set: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    set[key] = value
  }

  return BadgeModel.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { $set: set },
    { new: true },
  ).lean()
}

export async function setBadgeStatus(
  id: string,
  status: string,
  updatedBy?: string,
): Promise<BadgeDocument | null> {
  return BadgeModel.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { $set: { status: status.toLowerCase(), updatedBy } },
    { new: true },
  ).lean()
}

export async function deleteBadge(
  id: string,
  deleter?: string,
  reason?: string,
): Promise<BadgeDocument | null> {
  return BadgeModel.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deleter || null,
        deletedReason: reason || null,
      },
    },
    { new: true },
  ).lean()
}

export async function restoreBadge(
  id: string,
  updater: string,
): Promise<BadgeDocument | null> {
  return BadgeModel.findOneAndUpdate(
    { _id: id, isDeleted: true },
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
        updatedBy: updater,
      },
    },
    { new: true },
  ).lean()
}
