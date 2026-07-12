import type { BrandDocument } from "./model.js"
import type { BrandResponseDto } from "./dto.js"
import type { BrandStatus } from "./enums.js"

/** Maps a raw Mongo brand document to the public response shape — never
 * leaks normalizedName, __v, or the raw ObjectId. */
export function toBrandResponseDto(brand: BrandDocument): BrandResponseDto {
  return {
    id: String(brand._id),
    name: brand.name,
    logo: brand.logo ?? undefined,
    description: brand.description ?? undefined,
    status: (brand.status ? brand.status.toUpperCase() : "ACTIVE") as BrandStatus,
    isDeleted: brand.isDeleted ?? false,
    deletedAt: brand.deletedAt ?? undefined,
    deletedReason: brand.deletedReason ?? undefined,
    createdAt: brand.createdAt,
  }
}
