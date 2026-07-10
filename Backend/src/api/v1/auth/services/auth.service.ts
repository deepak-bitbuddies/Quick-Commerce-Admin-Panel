import { compare } from "bcryptjs"

import { findUserByEmail } from "../../../../repositories/user.repository.js"
import type { UserDocument } from "../../../../models/User.model.js"

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password")
    this.name = "InvalidCredentialsError"
  }
}

export class AccountDisabledError extends Error {
  constructor() {
    super("This account has been deactivated")
    this.name = "AccountDisabledError"
  }
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<UserDocument> {
  const user = await findUserByEmail(email)
  if (!user) {
    throw new InvalidCredentialsError()
  }

  const passwordMatches = await compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw new InvalidCredentialsError()
  }

  if (!user.isActive) {
    throw new AccountDisabledError()
  }

  return user
}
