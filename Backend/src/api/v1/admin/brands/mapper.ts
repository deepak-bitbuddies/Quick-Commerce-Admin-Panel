import type { BrandDocument } from "./model.js"
import type { BrandResponseDto } from "./dto.js"

/** Maps a raw Mongo brand document to the public response shape — never
 * leaks normalizedName, __v, or the raw ObjectId. */
export function toBrandResponseDto(brand: BrandDocument): BrandResponseDto {
  return {
    id: String(brand._id),
    name: brand.name,
    logo: brand.logo ?? undefined,
    description: brand.description ?? undefined,
    status: brand.status,
    createdAt: brand.createdAt,
  }
}
