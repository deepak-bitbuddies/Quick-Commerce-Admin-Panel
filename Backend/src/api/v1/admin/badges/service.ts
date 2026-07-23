import {
  createBadge,
  findBadgeById,
  findBadgeByNormalizedName,
  listBadges,
  updateBadge,
  setBadgeStatus,
  deleteBadge,
  restoreBadge,
  type ListBadgesOptions,
} from "./repository.js"
import type { BadgeDocument } from "./model.js"
import { NotFoundError, ConflictError } from "../../../../shared/errors/index.js"
import type { CreateBadgeDto, UpdateBadgeDto } from "./dto.js"

export async function createBadgeRecord(
  input: CreateBadgeDto,
  creator?: string,
): Promise<BadgeDocument> {
  const normalizedName = input.name.toLowerCase()
  const existing = await findBadgeByNormalizedName(normalizedName)
  if (existing) {
    throw new ConflictError("A badge with this name already exists")
  }

  return createBadge({
    name: input.name,
    normalizedName,
    color: input.color,
    textColor: input.textColor,
    createdBy: creator,
  })
}

export async function getBadges(
  options: ListBadgesOptions,
): Promise<{ badges: BadgeDocument[]; total: number }> {
  return listBadges(options)
}

export async function getBadgeById(badgeId: string): Promise<BadgeDocument> {
  const badge = await findBadgeById(badgeId)
  if (!badge) {
    throw new NotFoundError("Badge not found")
  }
  return badge
}

export async function updateBadgeRecord(
  badgeId: string,
  input: UpdateBadgeDto,
  updater?: string,
): Promise<BadgeDocument> {
  const badge = await getBadgeById(badgeId)

  let normalizedName: string | undefined
  if (input.name) {
    normalizedName = input.name.toLowerCase()
    const existing = await findBadgeByNormalizedName(normalizedName)
    if (existing && String(existing._id) !== String(badge._id)) {
      throw new ConflictError("A badge with this name already exists")
    }
  }

  const updated = await updateBadge(badgeId, {
    name: input.name,
    normalizedName,
    color: input.color,
    textColor: input.textColor,
    status: input.status,
    updatedBy: updater,
  })
  if (!updated) {
    throw new NotFoundError("Badge not found")
  }
  return updated
}

export async function updateBadgeActiveStatus(
  badgeId: string,
  status: string,
  updatedBy?: string,
): Promise<BadgeDocument> {
  const badge = await setBadgeStatus(badgeId, status, updatedBy)
  if (!badge) {
    throw new NotFoundError("Badge not found")
  }
  return badge
}

export async function deleteBadgeRecord(
  badgeId: string,
  deleter?: string,
  reason?: string,
): Promise<BadgeDocument> {
  await getBadgeById(badgeId) // Will throw NotFoundError if not found
  const deleted = await deleteBadge(badgeId, deleter, reason)
  if (!deleted) {
    throw new NotFoundError("Badge not found")
  }
  return deleted
}

export async function restoreBadgeRecord(
  badgeId: string,
  updater: string,
): Promise<BadgeDocument> {
  const badge = await restoreBadge(badgeId, updater)
  if (!badge) {
    throw new NotFoundError("Badge not found")
  }
  return badge
}
