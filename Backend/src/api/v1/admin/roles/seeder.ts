import { randomUUID } from "crypto"

import { RoleModel } from "./model.js"
import { logger } from "../../../../core/logger/logger.js"

export async function seedRoles(): Promise<Record<string, string>> {
  const defaultRoles = [
    {
      code: "super_admin",
      displayName: "Super Admin",
      description: "Ecosystem administrator with full permissions.",
      isSystem: true,
    },
    {
      code: "customer",
      displayName: "Customer",
      description: "End user purchasing goods on customer applications.",
      isSystem: true,
    },
    {
      code: "delivery_boy",
      displayName: "Delivery Boy",
      description: "Logistics agent delivering orders.",
      isSystem: true,
    },
  ]

  const codeToIdMap: Record<string, string> = {}

  for (const defaultRole of defaultRoles) {
    const existing = await RoleModel.findOne({ code: defaultRole.code })
    if (existing) {
      codeToIdMap[defaultRole.code] = existing._id
    } else {
      const guid = randomUUID()
      await RoleModel.create({
        _id: guid,
        ...defaultRole,
      })
      codeToIdMap[defaultRole.code] = guid
      logger.info(`[seeder] Seeded role '${defaultRole.code}' with GUID: ${guid}`)
    }
  }

  return codeToIdMap
}
