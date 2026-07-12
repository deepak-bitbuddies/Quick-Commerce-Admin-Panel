import { SettingModel, SettingAuditLogModel } from "./model.js"

export async function findSettingsGroup(groupId: string): Promise<any | null> {
  return SettingModel.findById(groupId).lean()
}

export async function upsertSettingsGroup(
  groupId: string,
  values: Record<string, any>,
  updatedBy: string,
): Promise<any> {
  const existing = await SettingModel.findById(groupId)
  if (existing) {
    existing.values = new Map(Object.entries(values))
    existing.version = (existing.version || 0) + 1
    existing.updatedBy = updatedBy
    await existing.save()
    return existing.toObject()
  }

  const created = await SettingModel.create({
    _id: groupId,
    values: new Map(Object.entries(values)),
    version: 1,
    updatedBy,
  })
  return created.toObject()
}

export async function createAuditLog(
  groupId: string,
  changedBy: string,
  oldValues: Record<string, any> | undefined,
  newValues: Record<string, any>,
  version: number,
): Promise<void> {
  await SettingAuditLogModel.create({
    groupId,
    changedBy,
    oldValues,
    newValues,
    version,
  })
}
