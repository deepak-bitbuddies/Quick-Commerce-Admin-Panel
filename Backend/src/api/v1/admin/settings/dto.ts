import type { z } from "zod"

import type {
  generalSchema,
  brandingSchema,
  localizationSchema,
  regionalSchema,
  customerAppSchema,
  clientApplicationsSchema,
} from "./schema.js"

export type GeneralSettingsDto = z.infer<typeof generalSchema>
export type BrandingSettingsDto = z.infer<typeof brandingSchema>
export type LocalizationSettingsDto = z.infer<typeof localizationSchema>
export type RegionalSettingsDto = z.infer<typeof regionalSchema>
export type CustomerAppSettingsDto = z.infer<typeof customerAppSchema>
export type ClientApplicationsSettingsDto = z.infer<typeof clientApplicationsSchema>

export interface UpdateSettingsGroupDto {
  values: Record<string, any>
  updatedBy: string
}
