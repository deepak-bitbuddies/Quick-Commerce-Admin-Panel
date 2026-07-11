"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { PlusIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useDebounce } from "@/hooks/use-debounce"
import { BrandFormDialog } from "../components/brand-form"
import { BrandStatusAlertDialog } from "../components/brand-status-alert-dialog"
import { BrandsCardList, BrandsTable } from "../components/brands-table"
import {
  BrandsToolbar,
  type BrandStatusFilter,
} from "../components/brands-toolbar"
import {
  BRAND_SEARCH_DEBOUNCE_MS,
  DEFAULT_BRAND_PAGE_SIZE,
} from "../constants/brands"
import { useBrandsQuery } from "../hooks/use-brands"
import type { Brand } from "../types/brand"

function buildHref(
  pathname: string,
  currentParams: URLSearchParams,
  updates: Record<string, string | null>
): string {
  const next = new URLSearchParams(currentParams.toString())
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") {
      next.delete(key)
    } else {
      next.set(key, value)
    }
  }
  const queryString = next.toString()
  return queryString ? `${pathname}?${queryString}` : pathname
}

export function BrandsListPage() {
  const t = useTranslations("Brands")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const statusParam = (searchParams.get("status") ??
    "all") as BrandStatusFilter
  const searchParam = searchParams.get("search") ?? ""

  const [searchInput, setSearchInput] = useState(searchParam)
  const debouncedSearch = useDebounce(searchInput, BRAND_SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    if (debouncedSearch === searchParam) {
      return
    }
    router.push(
      buildHref(pathname, searchParams, {
        search: debouncedSearch || null,
        page: null,
      })
    )
    // Only re-run when the debounced value actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const queryParams = {
    page,
    pageSize: DEFAULT_BRAND_PAGE_SIZE,
    search: searchParam || undefined,
    status: statusParam === "all" ? undefined : statusParam,
  }

  const { data, isLoading, isFetching, isError, error, refetch } =
    useBrandsQuery(queryParams)

  const brands = data?.brands ?? []
  const meta = data?.meta
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1
  const hasActiveFilters = Boolean(searchParam) || statusParam !== "all"

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | undefined>(
    undefined
  )
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusTargetBrand, setStatusTargetBrand] = useState<Brand | null>(
    null
  )

  const handleCreateClick = () => {
    setEditingBrand(undefined)
    setFormDialogOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand)
    setFormDialogOpen(true)
  }

  const handleToggleStatus = (brand: Brand) => {
    setStatusTargetBrand(brand)
    setStatusDialogOpen(true)
  }

  const handleClearFilters = () => {
    setSearchInput("")
    router.push(
      buildHref(pathname, searchParams, {
        search: null,
        status: null,
        page: null,
      })
    )
  }

  const handleStatusFilterChange = (status: BrandStatusFilter) => {
    router.push(
      buildHref(pathname, searchParams, {
        status: status === "all" ? null : status,
        page: null,
      })
    )
  }

  const goToPage = (nextPage: number) => {
    router.push(
      buildHref(pathname, searchParams, {
        page: nextPage > 1 ? String(nextPage) : null,
      })
    )
  }

  const tableProps = {
    brands,
    isLoading,
    isFetching,
    isError,
    error,
    onRetry: () => refetch(),
    pageSize: DEFAULT_BRAND_PAGE_SIZE,
    hasActiveFilters,
    onClearFilters: handleClearFilters,
    onCreateClick: handleCreateClick,
    onEditBrand: handleEditBrand,
    onToggleStatus: handleToggleStatus,
  }

  const showPaginationFooter =
    !isLoading && !isError && brands.length > 0 && Boolean(meta)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-muted-foreground">{t("pageDescription")}</p>
        </div>
        <Button onClick={handleCreateClick}>
          <PlusIcon />
          {t("createBrand")}
        </Button>
      </div>

      <BrandsToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        status={statusParam}
        onStatusChange={handleStatusFilterChange}
      />

      <Card className="p-0">
        <BrandsTable {...tableProps} />
        <BrandsCardList {...tableProps} />

        {showPaginationFooter && meta && (
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("resultsSummary", {
                from: (meta.page - 1) * meta.pageSize + 1,
                to: Math.min(meta.page * meta.pageSize, meta.total),
                total: meta.total,
              })}
            </p>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildHref(pathname, searchParams, {
                        page: meta.page - 1 > 1 ? String(meta.page - 1) : null,
                      })}
                      onClick={(event) => {
                        event.preventDefault()
                        if (meta.page > 1) {
                          goToPage(meta.page - 1)
                        }
                      }}
                      className={
                        meta.page <= 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                      aria-disabled={meta.page <= 1}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-2 text-sm text-muted-foreground">
                      {t("pageOf", { page: meta.page, totalPages })}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href={buildHref(pathname, searchParams, {
                        page: String(meta.page + 1),
                      })}
                      onClick={(event) => {
                        event.preventDefault()
                        if (meta.page < totalPages) {
                          goToPage(meta.page + 1)
                        }
                      }}
                      className={
                        meta.page >= totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                      aria-disabled={meta.page >= totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardFooter>
        )}
      </Card>

      <BrandFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        brand={editingBrand}
      />
      <BrandStatusAlertDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        brand={statusTargetBrand}
      />
    </div>
  )
}
