"use client"

import { useTranslations } from "next-intl"
import { CheckCircle, Info } from "@phosphor-icons/react"

interface ScopeCardProps {
  admin?: boolean
  customer?: boolean
  delivery?: boolean
}

export function ScopeCard({ admin, customer, delivery }: ScopeCardProps) {
  const t = useTranslations("Settings")

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 size-4 text-zinc-500 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {t("scope.title")}
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t("scope.description")}
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <CheckCircle
            weight={admin ? "fill" : "regular"}
            className={`size-4.5 ${admin ? "text-primary" : "text-zinc-300 dark:text-zinc-700"}`}
          />
          <span className={`text-[11px] font-medium ${admin ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}`}>
            {t("scope.adminPanel")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <CheckCircle
            weight={customer ? "fill" : "regular"}
            className={`size-4.5 ${customer ? "text-primary" : "text-zinc-300 dark:text-zinc-700"}`}
          />
          <span className={`text-[11px] font-medium ${customer ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}`}>
            {t("scope.customerApp")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <CheckCircle
            weight={delivery ? "fill" : "regular"}
            className={`size-4.5 ${delivery ? "text-primary" : "text-zinc-300 dark:text-zinc-700"}`}
          />
          <span className={`text-[11px] font-medium ${delivery ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}`}>
            {t("scope.deliveryApp")}
          </span>
        </div>
      </div>
    </div>
  )
}
