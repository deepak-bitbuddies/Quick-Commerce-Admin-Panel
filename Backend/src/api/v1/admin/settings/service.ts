import { findSettingsGroup, upsertSettingsGroup, createAuditLog } from "./repository.js"
import { defaultSettings } from "./defaults.js"
import { SettingGroup, ApplicationType } from "./enums.js"

// Cache Abstraction Interface
export interface CacheProvider {
  get(key: string): any
  set(key: string, value: any): void
  delete(key: string): void
  clear(): void
}

// In-Memory cache-aside provider
export class MemoryCacheProvider implements CacheProvider {
  private store = new Map<string, any>()

  get(key: string): any {
    return this.store.get(key)
  }

  set(key: string, value: any): void {
    this.store.set(key, value)
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

const settingsCache = new MemoryCacheProvider()

export async function getSettingsGroup(groupId: string): Promise<Record<string, any>> {
  const cached = settingsCache.get(groupId)
  if (cached) {
    return cached
  }

  const dbDoc = await findSettingsGroup(groupId)
  if (dbDoc) {
    let values = dbDoc.values
    if (values && typeof (values as any).entries === "function") {
      values = Object.fromEntries((values as any).entries())
    }
    settingsCache.set(groupId, values)
    return values
  }

  // Fallback to default configuration
  const fallback = defaultSettings[groupId] || {}
  settingsCache.set(groupId, fallback)
  return fallback
}

export async function getSettingsList(): Promise<Record<string, Record<string, any>>> {
  const result: Record<string, Record<string, any>> = {}
  for (const group of Object.values(SettingGroup)) {
    result[group] = await getSettingsGroup(group)
  }
  return result
}

export async function saveSettingsGroup(
  groupId: string,
  values: Record<string, any>,
  updatedBy: string,
): Promise<Record<string, any>> {
  // Fetch old values for audit log delta comparison
  const oldDoc = await findSettingsGroup(groupId)
  let oldValues: Record<string, any> | undefined = undefined
  if (oldDoc) {
    oldValues = oldDoc.values
    if (oldValues && typeof (oldValues as any).entries === "function") {
      oldValues = Object.fromEntries((oldValues as any).entries())
    }
  }

  const updatedDoc = await upsertSettingsGroup(groupId, values, updatedBy)

  let newValues = updatedDoc.values
  if (newValues && typeof (newValues as any).entries === "function") {
    newValues = Object.fromEntries((newValues as any).entries())
  }

  // Invalidate Cache
  settingsCache.delete(groupId)

  // Asynchronous Audit Log creation
  createAuditLog(
    groupId,
    updatedBy,
    oldValues,
    newValues,
    updatedDoc.version,
  ).catch((err) => {
    console.error(`[SettingsService] Failed to create audit log for group ${groupId}:`, err)
  })

  return newValues
}

export async function fetchApplicationConfig(app: ApplicationType): Promise<Record<string, any>> {
  const general = await getSettingsGroup(SettingGroup.GENERAL)
  const branding = await getSettingsGroup(SettingGroup.BRANDING)
  const localization = await getSettingsGroup(SettingGroup.LOCALIZATION)
  const regional = await getSettingsGroup(SettingGroup.REGIONAL)

  // Fetch document meta to resolve active version count
  const generalDoc = await findSettingsGroup(SettingGroup.GENERAL)
  const brandingDoc = await findSettingsGroup(SettingGroup.BRANDING)
  const localizationDoc = await findSettingsGroup(SettingGroup.LOCALIZATION)
  const regionalDoc = await findSettingsGroup(SettingGroup.REGIONAL)

  const versionsList = [
    generalDoc?.version || 1,
    brandingDoc?.version || 1,
    localizationDoc?.version || 1,
    regionalDoc?.version || 1,
  ]

  const responseData: Record<string, any> = {
    general,
    regional,
  }

  if (app === ApplicationType.ADMIN) {
    responseData.branding = {
      platformDisplayName: branding.platformDisplayName,
      admin: branding.admin,
      browser: branding.browser,
    }
    responseData.localization = {
      defaultLanguage: localization.defaultLanguage,
      availability: localization.availability?.admin || [],
    }
  } else if (app === ApplicationType.CUSTOMER) {
    const customerApp = await getSettingsGroup(SettingGroup.CUSTOMER_APP)
    const clientApps = await getSettingsGroup(SettingGroup.CLIENT_APPLICATIONS)

    const customerDoc = await findSettingsGroup(SettingGroup.CUSTOMER_APP)
    const clientDoc = await findSettingsGroup(SettingGroup.CLIENT_APPLICATIONS)

    versionsList.push(customerDoc?.version || 1)
    versionsList.push(clientDoc?.version || 1)

    responseData.branding = {
      platformDisplayName: branding.platformDisplayName,
      customer: branding.customer,
    }
    responseData.localization = {
      defaultLanguage: localization.defaultLanguage,
      availability: localization.availability?.customer || [],
    }
    responseData.customerApp = customerApp
    responseData.clientApplications = {
      customer: clientApps.customer,
    }
  } else if (app === ApplicationType.DELIVERY) {
    const clientApps = await getSettingsGroup(SettingGroup.CLIENT_APPLICATIONS)
    const clientDoc = await findSettingsGroup(SettingGroup.CLIENT_APPLICATIONS)

    versionsList.push(clientDoc?.version || 1)

    responseData.branding = {
      platformDisplayName: branding.platformDisplayName,
      delivery: branding.delivery,
    }
    responseData.localization = {
      defaultLanguage: localization.defaultLanguage,
      availability: localization.availability?.delivery || [],
    }
    responseData.clientApplications = {
      delivery: clientApps.delivery,
    }
  }

  const activeVersion = Math.max(...versionsList)
  const now = new Date()
  const cacheUntil = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes cache buffer

  return {
    application: app,
    version: activeVersion,
    generatedAt: now.toISOString(),
    cacheUntil: cacheUntil.toISOString(),
    ...responseData,
  }
}
