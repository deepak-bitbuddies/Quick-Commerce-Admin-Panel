"use client"

import React, { createContext, useContext, useEffect } from "react"
import { useLocale } from "next-intl"

import { usePlatformConfigQuery } from "@/modules/settings/hooks/use-settings"
import type { PlatformConfigResponse } from "@/modules/settings/types/settings-types"
import { setLocale } from "@/i18n/actions"
import type { AppLocale } from "@/i18n/locales"

interface PlatformConfigContextType {
  config: PlatformConfigResponse | undefined
  isLoading: boolean
  isError: boolean
}

const PlatformConfigContext = createContext<PlatformConfigContextType | undefined>(undefined)

export function PlatformConfigProvider({ children }: { children: React.ReactNode }) {
  const { data: config, isLoading, isError } = usePlatformConfigQuery("admin")
  const locale = useLocale()

  useEffect(() => {
    if (config?.branding?.browser) {
      const browser = config.branding.browser
      if (browser.title) {
        document.title = browser.title
      }
      if (browser.favicon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
        if (!link) {
          link = document.createElement("link")
          link.rel = "icon"
          document.head.appendChild(link)
        }
        link.href = browser.favicon
      }
    }

    if (config?.localization?.availability && config.localization.availability.length > 0) {
      const allowed = config.localization.availability
      if (!allowed.includes(locale)) {
        const fallback = config.localization.defaultLanguage || "en"
        setLocale(fallback as AppLocale).catch(console.error)
      }
    }
  }, [config, locale])

  return (
    <PlatformConfigContext.Provider value={{ config, isLoading, isError }}>
      {children}
    </PlatformConfigContext.Provider>
  )
}

export function usePlatformConfig() {
  const context = useContext(PlatformConfigContext)
  if (context === undefined) {
    throw new Error("usePlatformConfig must be used within a PlatformConfigProvider")
  }
  return context
}
