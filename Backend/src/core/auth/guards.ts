import type { FastifyRequest } from "fastify"

import { ForbiddenError, UnauthorizedError } from "../../shared/errors/index.js"
import type { UserRole } from "../../shared/enums/index.js"

/**
 * Verifies the bearer JWT and attaches the decoded payload to
 * `request.user`. Use as a Fastify `preHandler` on any protected route.
 */
export async function requireAuth(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError("Missing or invalid access token")
  }
}

/**
 * Restricts a route to one or more roles. Must run *after* `requireAuth`
 * (relies on `request.user` already being populated).
 *
 * @example
 * fastify.get("/admin/settlements", {
 *   preHandler: [requireAuth, requireRole("super_admin")],
 * }, handler)
 */
export function requireRole(...roles: UserRole[]) {
  return async function roleGuard(request: FastifyRequest): Promise<void> {
    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError("Insufficient permissions")
    }
  }
}
