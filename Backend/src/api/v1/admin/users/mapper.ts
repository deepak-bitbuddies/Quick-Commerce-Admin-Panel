import type { UserDocument } from "./model.js"
import type { UserResponseDto } from "./dto.js"

/** Maps a raw Mongo user document to the public response shape — never
 * leaks passwordHash, __v, or the raw ObjectId. */
export function toUserResponseDto(user: UserDocument): UserResponseDto {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
  }
}
