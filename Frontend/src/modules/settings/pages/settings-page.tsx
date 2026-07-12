"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Gear,
  Palette,
  Translate,
  Coins,
  ShieldCheck,
  DeviceMobile,
} from "@phosphor-icons/react"

import { PageHeader } from "@/components/layout/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { useSettingsQuery } from "../hooks/use-settings"
import { SettingGroup } from "../enums/settings-group"
import { cn } from "@/lib/utils"
import {
  GeneralForm,
  BrandingForm,
  LocalizationForm,
  RegionalForm,
  CustomerAppForm,
  ClientApplicationsForm,
} from "../components"

export function SettingsPage() {
  const t = useTranslations("Settings")
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as SettingGroup) || SettingGroup.GENERAL

  const { data, isLoading, isError } = useSettingsQuery()

  const tabs = [
    { id: SettingGroup.GENERAL, label: t("tabGeneral"), icon: Gear },
    { id: SettingGroup.BRANDING, label: t("tabBranding"), icon: Palette },
    // { id: SettingGroup.LOCALIZATION, label: t("tabLocalization"), icon: Translate },
    { id: SettingGroup.REGIONAL, label: t("tabRegional"), icon: Coins },
    { id: SettingGroup.CUSTOMER_APP, label: t("tabCustomerApp"), icon: ShieldCheck },
    { id: SettingGroup.CLIENT_APPLICATIONS, label: t("tabClientApplications"), icon: DeviceMobile },
  ]

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("tab", tabId)
    router.push(`?${params.toString()}`)
  }

  const renderActiveForm = () => {
    if (!data) return null

    switch (activeTab) {
      case SettingGroup.GENERAL:
        return <GeneralForm initialValues={data[SettingGroup.GENERAL]} />
      case SettingGroup.BRANDING:
        return <BrandingForm initialValues={data[SettingGroup.BRANDING]} />
      case SettingGroup.LOCALIZATION:
        return <LocalizationForm initialValues={data[SettingGroup.LOCALIZATION]} />
      case SettingGroup.REGIONAL:
        return <RegionalForm initialValues={data[SettingGroup.REGIONAL]} />
      case SettingGroup.CUSTOMER_APP:
        return <CustomerAppForm initialValues={data[SettingGroup.CUSTOMER_APP]} />
      case SettingGroup.CLIENT_APPLICATIONS:
        return <ClientApplicationsForm initialValues={data[SettingGroup.CLIENT_APPLICATIONS]} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="md:col-span-3">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      ) : isError ? (
        <div className="p-8 border-2 border-dashed rounded-xl text-center text-muted-foreground">
          {t("fetchError")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings Left Navigation */}
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1 border-b md:border-b-0 md:border-r border-border pr-0 md:pr-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Form Content Panel */}
          <div className="md:col-span-3">
            {renderActiveForm()}
          </div>
        </div>
      )}
    </div>
  )
}
