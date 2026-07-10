import type { FastifyReply, FastifyRequest } from "fastify"

import type { UserRole } from "../types/enums/index.js"

/**
 * Verifies the bearer JWT and attaches the decoded payload to
 * `request.user`. Use as a Fastify `preHandler` on any protected route.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    await reply.code(401).send({ message: "Missing or invalid access token" })
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
  return async function roleGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    if (!roles.includes(request.user.role)) {
      await reply.code(403).send({ message: "Insufficient permissions" })
    }
  }
}
