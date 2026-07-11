/**
 * Bootstraps the first super_admin account. There's no public registration
 * endpoint by design (POST /api/v1/admin/users is itself admin-only), so a
 * fresh database needs exactly one way in — this script.
 *
 * Usage: npm run seed:admin
 * Override via env vars: SEED_ADMIN_NAME, SEED_ADMIN_EMAIL,
 * SEED_ADMIN_PHONE, SEED_ADMIN_PASSWORD
 */
import { hash } from "bcryptjs"

import { connectDatabase, disconnectDatabase } from "../core/database/db.js"
import { findUserByEmail, createUser } from "../api/v1/admin/users/index.js"
import { UserRole } from "../shared/enums/index.js"
import { BCRYPT_SALT_ROUNDS } from "../shared/constants/auth.constants.js"
import { logger } from "../core/logger/logger.js"

async function main(): Promise<void> {
  const name = process.env.SEED_ADMIN_NAME ?? "Super Admin"
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@quickcommerce.com"
  const phone = process.env.SEED_ADMIN_PHONE ?? "9999999999"
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!"

  await connectDatabase()

  const existing = await findUserByEmail(email)
  if (existing) {
    logger.info({ email }, "[seed-admin] a user with this email already exists, skipping")
    await disconnectDatabase()
    return
  }

  const passwordHash = await hash(password, BCRYPT_SALT_ROUNDS)
  await createUser({
    name,
    email,
    phone,
    passwordHash,
    role: UserRole.SUPER_ADMIN,
  })

  logger.info({ email }, "[seed-admin] super_admin account created")
  if (!process.env.SEED_ADMIN_PASSWORD) {
    logger.warn(
      "[seed-admin] using the default password — set SEED_ADMIN_PASSWORD and re-seed for anything beyond local dev",
    )
  }

  await disconnectDatabase()
}

main().catch((err: unknown) => {
  logger.error({ err }, "[seed-admin] failed")
  process.exit(1)
})
