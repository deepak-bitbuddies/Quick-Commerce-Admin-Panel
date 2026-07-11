import { UserModel, type UserDocument } from "./model.js"
import type { UserRole } from "../../../../shared/enums/index.js"

export async function findUserByEmail(
  email: string,
): Promise<UserDocument | null> {
  return UserModel.findOne({ email: email.toLowerCase() })
    .select("+passwordHash")
    .lean()
}

export async function findUserById(id: string): Promise<UserDocument | null> {
  return UserModel.findById(id).lean()
}

export interface CreateUserInput {
  name: string
  email: string
  phone: string
  passwordHash: string
  role: UserRole
}

export async function createUser(
  input: CreateUserInput,
): Promise<UserDocument> {
  return UserModel.create(input)
}

export interface ListUsersOptions {
  role?: UserRole
  page?: number
  pageSize?: number
}

export async function listUsers(
  options: ListUsersOptions = {},
): Promise<{ users: UserDocument[]; total: number }> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20
  const filter = options.role ? { role: options.role } : {}

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    UserModel.countDocuments(filter),
  ])

  return { users, total }
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<UserDocument | null> {
  return UserModel.findByIdAndUpdate(
    userId,
    { $set: { isActive } },
    { new: true },
  ).lean()
}
