import { compare } from "bcryptjs"

import { findUserByEmail, type UserDocument } from "../users/index.js"
import { InvalidCredentialsError, AccountDisabledError } from "./errors.js"

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
