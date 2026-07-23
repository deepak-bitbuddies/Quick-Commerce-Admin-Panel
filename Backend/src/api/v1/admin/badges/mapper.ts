import type { BadgeDocument } from "./model.js"
import type { BadgeResponseDto } from "./dto.js"
import type { BadgeStatus } from "./enums.js"

export function toBadgeResponseDto(badge: BadgeDocument): BadgeResponseDto {
  return {
    id: String(badge._id),
    name: badge.name,
    color: badge.color,
    textColor: badge.textColor,
    status: (badge.status ? badge.status.toLowerCase() : "active") as BadgeStatus,
    isDeleted: badge.isDeleted ?? false,
    deletedAt: badge.deletedAt ?? undefined,
    deletedReason: badge.deletedReason ?? undefined,
    createdAt: badge.createdAt,
  }
}
