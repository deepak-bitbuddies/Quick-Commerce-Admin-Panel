import { hash } from "bcryptjs"

import {
  createUser,
  findUserById,
  listUsers,
  setUserActive,
  type ListUsersOptions,
} from "../../../../repositories/user.repository.js"
import type { UserDocument } from "../../../../models/User.model.js"
import { UserRole } from "../../../../types/enums/index.js"

const BCRYPT_SALT_ROUNDS = 10

export interface CreateUserServiceInput {
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
}

export class UserServiceError extends Error {}

export async function createUserAccount(
  input: CreateUserServiceInput,
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
    throw new UserServiceError("User not found")
  }
  return user
}

export async function updateUserActiveStatus(
  userId: string,
  isActive: boolean,
): Promise<UserDocument> {
  const user = await setUserActive(userId, isActive)
  if (!user) {
    throw new UserServiceError("User not found")
  }
  return user
}
