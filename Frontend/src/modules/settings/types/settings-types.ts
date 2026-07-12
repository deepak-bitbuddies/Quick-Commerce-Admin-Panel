import { SettingGroup } from "../enums/settings-group"

export interface GeneralSettings {
  businessName: string
  legalCompanyName: string
  supportEmail: string
  supportPhone: string
  supportWhatsapp: string
  website: string
  businessAddress: string
}

export interface LogoGroup {
  lightLogo: string
  darkLogo: string
}

export interface BrandingSettings {
  platformDisplayName: string
  admin: LogoGroup
  customer: LogoGroup
  delivery: LogoGroup
  browser: {
    title: string
    favicon: string
  }
}

export interface LocalizationSettings {
  defaultLanguage: string
  availability: {
    admin: string[]
    customer: string[]
    delivery: string[]
  }
}

export interface RegionalSettings {
  currency: string
  currencySymbol: string
  decimalPlaces: number
  timezone: string
  dateFormat: string
  timeFormat: "12h" | "24h"
}

export interface CustomerAppSettings {
  maintenance: {
    enabled: boolean
    message: string
    image: string
  }
  features: {
    wallet: boolean
    referral: boolean
    ratings: boolean
    reviews: boolean
    guestCheckout: boolean
    coupons: boolean
    offers: boolean
  }
  orders: {
    minOrderAmount: number
    freeDeliveryThreshold: number
    orderCancellationWindow: number // minutes
    returnWindow: number // days
    estimatedDeliveryBuffer: number // minutes
  }
  announcements: {
    enabled: boolean
    message: string
    style: "info" | "warning" | "emergency"
  }
}

export interface AppVersionConfig {
  minVersion: string
  latestVersion: string
  forceUpdate: boolean
}

export interface ClientApplicationsSettings {
  customer: AppVersionConfig
  delivery: AppVersionConfig
  admin: AppVersionConfig
}

export interface AllSettings {
  [SettingGroup.GENERAL]: GeneralSettings
  [SettingGroup.BRANDING]: BrandingSettings
  [SettingGroup.LOCALIZATION]: LocalizationSettings
  [SettingGroup.REGIONAL]: RegionalSettings
  [SettingGroup.CUSTOMER_APP]: CustomerAppSettings
  [SettingGroup.CLIENT_APPLICATIONS]: ClientApplicationsSettings
}

export interface PlatformConfigResponse {
  application: "admin" | "customer" | "delivery"
  version: number
  generatedAt: string
  cacheUntil: string
  general: GeneralSettings
  regional: RegionalSettings
  branding: Partial<BrandingSettings>
  localization: {
    defaultLanguage: string
    availability: string[]
  }
  customerApp?: CustomerAppSettings
  clientApplications?: Partial<ClientApplicationsSettings>
}
