import { z } from "zod"

import { SettingGroup, ApplicationType, AnnouncementStyle } from "./enums.js"

export const generalSchema = z.object({
  businessName: z.string().min(1),
  legalCompanyName: z.string().min(1),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(1),
  supportWhatsapp: z.string().min(1),
  website: z.string().url(),
  businessAddress: z.string().min(1),
})

export const logoGroupSchema = z.object({
  lightLogo: z.string().min(1),
  darkLogo: z.string().min(1),
})

export const brandingSchema = z.object({
  platformDisplayName: z.string().min(1),
  admin: logoGroupSchema,
  customer: logoGroupSchema,
  delivery: logoGroupSchema,
  browser: z.object({
    title: z.string().min(1),
    favicon: z.string().min(1),
  }),
})

export const localizationSchema = z.object({
  defaultLanguage: z.string().min(2),
  availability: z.object({
    admin: z.array(z.string()),
    customer: z.array(z.string()),
    delivery: z.array(z.string()),
  }),
})

export const regionalSchema = z.object({
  currency: z.string().min(3).max(3),
  currencySymbol: z.string().min(1),
  decimalPlaces: z.number().int().min(0).max(4),
  timezone: z.string().min(1),
  dateFormat: z.string().min(1),
  timeFormat: z.enum(["12h", "24h"]),
})

export const customerAppSchema = z.object({
  maintenance: z.object({
    enabled: z.boolean(),
    message: z.string(),
    image: z.string().optional().nullable().or(z.literal("")),
  }),
  features: z.object({
    wallet: z.boolean(),
    referral: z.boolean(),
    ratings: z.boolean(),
    reviews: z.boolean(),
    guestCheckout: z.boolean(),
    coupons: z.boolean(),
    offers: z.boolean(),
  }),
  orders: z.object({
    minOrderAmount: z.number().nonnegative(),
    freeDeliveryThreshold: z.number().nonnegative(),
    orderCancellationWindow: z.number().int().nonnegative(), // minutes
    returnWindow: z.number().int().nonnegative(), // days
    estimatedDeliveryBuffer: z.number().int().nonnegative(), // minutes
  }),
  announcements: z.object({
    enabled: z.boolean(),
    message: z.string(),
    style: z.enum([AnnouncementStyle.INFO, AnnouncementStyle.WARNING, AnnouncementStyle.EMERGENCY]),
  }),
})

export const appVersionConfigSchema = z.object({
  minVersion: z.string().min(1),
  latestVersion: z.string().min(1),
  forceUpdate: z.boolean(),
})

export const clientApplicationsSchema = z.object({
  customer: appVersionConfigSchema,
  delivery: appVersionConfigSchema,
  admin: appVersionConfigSchema,
})

// Central setting validators registry mapped to the SettingGroup enum values
export const settingsValidators: Record<string, z.ZodTypeAny> = {
  [SettingGroup.GENERAL]: generalSchema,
  [SettingGroup.BRANDING]: brandingSchema,
  [SettingGroup.LOCALIZATION]: localizationSchema,
  [SettingGroup.REGIONAL]: regionalSchema,
  [SettingGroup.CUSTOMER_APP]: customerAppSchema,
  [SettingGroup.CLIENT_APPLICATIONS]: clientApplicationsSchema,
}

// Request validator for patching settings group
export const updateSettingsGroupParamsSchema = z.object({
  groupId: z.nativeEnum(SettingGroup),
})

// Request validator for application platform config resolver
export const platformConfigQuerySchema = z.object({
  application: z.nativeEnum(ApplicationType),
})
