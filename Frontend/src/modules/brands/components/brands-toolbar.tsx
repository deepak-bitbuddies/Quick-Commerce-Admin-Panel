"use client"

import { useTranslations } from "next-intl"
import { FunnelIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BrandStatus } from "../types/brand"

export type BrandStatusFilter = BrandStatus | "all"

interface BrandsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  status: BrandStatusFilter
  onStatusChange: (status: BrandStatusFilter) => void
}

export function BrandsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: BrandsToolbarProps) {
  const t = useTranslations("Brands")

  const statusLabel =
    status === "all"
      ? t("statusAll")
      : status === "active"
        ? t("statusActive")
        : t("statusInactive")

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative max-w-sm flex-1">
        <Label htmlFor="brands-search" className="sr-only">
          {t("searchLabel")}
        </Label>
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="brands-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              <FunnelIcon />
              {t("statusFilterLabel", { status: statusLabel })}
            </Button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={status}
            onValueChange={(value) =>
              onStatusChange(value as BrandStatusFilter)
            }
          >
            <DropdownMenuRadioItem value="all">
              {t("statusAll")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="active">
              {t("statusActive")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="inactive">
              {t("statusInactive")}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
