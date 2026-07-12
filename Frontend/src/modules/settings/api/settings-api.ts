import { api } from "@/lib/axios"
import type { AllSettings, PlatformConfigResponse } from "../types/settings-types"

/**
 * Client-side calls against this app's Next.js API Route Handlers.
 * These handle JWT token attachment via backend session cookie.
 */
export async function getSettings(): Promise<AllSettings> {
  const { data } = await api.get<{ data: AllSettings }>("/settings")
  return data.data
}

export async function updateSettingsGroup<K extends keyof AllSettings>(
  groupId: K,
  values: AllSettings[K]
): Promise<AllSettings[K]> {
  const { data } = await api.patch<{ data: AllSettings[K] }>(
    `/settings/${groupId}`,
    values
  )
  return data.data
}

export async function getPlatformConfig(
  application: "admin" | "customer" | "delivery"
): Promise<PlatformConfigResponse> {
  const { data } = await api.get<{ data: PlatformConfigResponse }>(
    `/platform-config?application=${application}`
  )
  return data.data
}
