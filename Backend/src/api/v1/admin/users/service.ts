import { hash } from "bcryptjs"

import {
  createUser,
  findUserById,
  listUsers,
  setUserActive,
  type ListUsersOptions,
} from "./repository.js"
import type { UserDocument } from "./model.js"
import { NotFoundError } from "../../../../shared/errors/index.js"
import { BCRYPT_SALT_ROUNDS } from "../../../../shared/constants/auth.constants.js"
import type { CreateUserDto } from "./dto.js"

export async function createUserAccount(
  input: CreateUserDto,
): Promise<UserDocument> {
  const passwordHash = await hash(input.password, BCRYPT_SALT_ROUNDS)

  return createUser({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    role: input.role,
  })
}

export async function getUsers(
  options: ListUsersOptions,
): Promise<{ users: UserDocument[]; total: number }> {
  return listUsers(options)
}

export async function getUserById(userId: string): Promise<UserDocument> {
  const user = await findUserById(userId)
  if (!user) {
    throw new NotFoundError("User not found")
  }
  return user
}

export async function updateUserActiveStatus(
  userId: string,
  isActive: boolean,
): Promise<UserDocument> {
  const user = await setUserActive(userId, isActive)
  if (!user) {
    throw new NotFoundError("User not found")
  }
  return user
}
