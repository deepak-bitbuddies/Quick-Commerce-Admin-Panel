import { SettingGroup, AnnouncementStyle } from "./enums.js"

export const defaultSettings: Record<string, Record<string, any>> = {
  [SettingGroup.GENERAL]: {
    businessName: "Quick Commerce",
    legalCompanyName: "Bitbuddies Inc.",
    supportEmail: "support@bitbuddies.com",
    supportPhone: "+1234567890",
    supportWhatsapp: "+1234567890",
    website: "https://bitbuddies.com",
    businessAddress: "123 Main St, Tech City",
  },
  [SettingGroup.BRANDING]: {
    platformDisplayName: "Quick Commerce",
    admin: {
      lightLogo: "https://bitbuddies.com/logo.png",
      darkLogo: "https://bitbuddies.com/logo-dark.png",
    },
    customer: {
      lightLogo: "https://bitbuddies.com/logo.png",
      darkLogo: "https://bitbuddies.com/logo-dark.png",
    },
    delivery: {
      lightLogo: "https://bitbuddies.com/logo.png",
      darkLogo: "https://bitbuddies.com/logo-dark.png",
    },
    browser: {
      title: "Quick Commerce Admin Panel",
      favicon: "https://bitbuddies.com/favicon.ico",
    },
  },
  [SettingGroup.LOCALIZATION]: {
    defaultLanguage: "en",
    availability: {
      admin: ["en", "hi"],
      customer: ["en", "hi"],
      delivery: ["en", "hi"],
    },
  },
  [SettingGroup.REGIONAL]: {
    currency: "INR",
    currencySymbol: "₹",
    decimalPlaces: 2,
    timezone: "Asia/Kolkata",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
  },
  [SettingGroup.CUSTOMER_APP]: {
    maintenance: {
      enabled: false,
      message: "We're currently performing system updates. We'll be back online shortly.",
      image: "",
    },
    features: {
      wallet: true,
      referral: true,
      ratings: true,
      reviews: true,
      guestCheckout: true,
      coupons: true,
      offers: true,
    },
    orders: {
      minOrderAmount: 0,
      freeDeliveryThreshold: 499,
      orderCancellationWindow: 5, // minutes
      returnWindow: 7, // days
      estimatedDeliveryBuffer: 10, // minutes
    },
    announcements: {
      enabled: false,
      message: "",
      style: AnnouncementStyle.INFO,
    },
  },
  [SettingGroup.CLIENT_APPLICATIONS]: {
    customer: {
      minVersion: "1.0.0",
      latestVersion: "1.0.0",
      forceUpdate: false,
    },
    delivery: {
      minVersion: "1.0.0",
      latestVersion: "1.0.0",
      forceUpdate: false,
    },
    admin: {
      minVersion: "1.0.0",
      latestVersion: "1.0.0",
      forceUpdate: false,
    },
  },
}
