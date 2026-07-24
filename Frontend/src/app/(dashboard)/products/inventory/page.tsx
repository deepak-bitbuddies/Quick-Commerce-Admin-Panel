"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  DotsThreeIcon,
  TagIcon,
  SquaresFourIcon,
  WarningOctagonIcon,
  ClockIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import {
  DataTable,
  FilterBar,
  Pagination,
  type ColumnDef,
} from "@/components/tables"
import { DEFAULT_PAGE_SIZE } from "@/constants"
import { useProductsQuery } from "@/modules/products/hooks/use-products"
import { useBrandsQuery } from "@/modules/brands/hooks/use-brands"
import { useCategoriesQuery } from "@/modules/categories/hooks/use-categories"
import type { Product, ProductVariant } from "@/modules/products/types/product"

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

export default function InventoryDashboardPage() {
  const t = useTranslations("Products")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.max(5, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
  const categoryParam = searchParams.get("categoryId") ?? "all"
  const brandParam = searchParams.get("brandId") ?? "all"
  const searchParam = searchParams.get("search") ?? ""

  const [searchInput, setSearchInput] = useState(searchParam)
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    if (debouncedSearch === searchParam) return
    router.push(
      buildHref(pathname, searchParams, {
        search: debouncedSearch || null,
        page: null,
      })
    )
  }, [debouncedSearch, searchParam, pathname, router, searchParams])

  const handleFilterChange = (updates: Record<string, string | null>) => {
    router.push(buildHref(pathname, searchParams, { ...updates, page: null }))
  }

  const queryParams = {
    page,
    pageSize,
    search: searchParam || undefined,
    categoryId: categoryParam === "all" ? undefined : categoryParam,
    brandId: brandParam === "all" ? undefined : brandParam,
  }

  const { data, isLoading } = useProductsQuery(queryParams)
  const { data: categoriesData } = useCategoriesQuery({ page: 1, pageSize: 100 })
  const { data: brandsData } = useBrandsQuery({ page: 1, pageSize: 100 })

  const products = data?.products ?? []

  const handleClearAllFilters = () => {
    setSearchInput("")
    router.push(pathname)
  }

  const activeFilterChips = [
    ...(searchParam ? [{ key: "search", label: `Search: ${searchParam}`, onClear: () => handleFilterChange({ search: null }) }] : []),
    ...(categoryParam !== "all" ? [{ key: "category", label: "Category Filter Active", onClear: () => handleFilterChange({ categoryId: null }) }] : []),
    ...(brandParam !== "all" ? [{ key: "brand", label: "Brand Filter Active", onClear: () => handleFilterChange({ brandId: null }) }] : []),
  ]

  const hasActiveFilters = activeFilterChips.length > 0

  const columns: ColumnDef<Product>[] = [
    {
      header: "Product Detail",
      className: "w-[60%]",
      accessor: (p) => {
        const imgUrl = p.primaryImage || (p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages[0] : null)
        return (
          <div className="flex items-center gap-3">
            {imgUrl && imgUrl.startsWith("http") ? (
              <img
                src={imgUrl}
                alt={p.name}
                className="size-10 rounded-lg object-cover border"
              />
            ) : (
              <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border flex items-center justify-center">
                <SquaresFourIcon className="size-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-foreground">{p.name}</span>
              <span className="text-[10px] text-muted-foreground line-clamp-1">{p.description || "No description"}</span>
            </div>
          </div>
        )
      },
    },
    {
      header: "SKUs Balance",
      className: "w-[40%]",
      accessor: (p) => {
        const variants = p.variants || []
        const totalStock = variants.reduce((sum, v) => sum + (v.inventory?.availableStock || 0), 0)
        if (variants.length === 0) {
          return (
            <span className="text-xs text-amber-500 font-semibold italic">
              No SKU variants registered
            </span>
          )
        }
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-foreground">{variants.length} Size{variants.length !== 1 ? "s" : ""}</span>
            <span className="text-[10px] text-muted-foreground font-mono">Tot: {totalStock} Units available</span>
          </div>
        )
      },
    },
  ]

  const renderSubRow = (p: Product) => {
    const variants = p.variants || []
    if (variants.length === 0) {
      return (
        <div className="text-xs text-muted-foreground p-3">
          No variant size SKUs configured for this product master yet.
        </div>
      )
    }

    return (
      <div className="bg-zinc-50/50 dark:bg-zinc-900/30 p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-2">
        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">SKUs Inventory Breakdown</div>
        <Table className="text-left text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="py-2 pr-4">Variant Name / SKU</TableHead>
              <TableHead className="py-2 pr-4 text-center">App Stock</TableHead>
              <TableHead className="py-2 pr-4 text-center">Local Stock</TableHead>
              <TableHead className="py-2 pr-4 text-center">Total Stock Balance</TableHead>
              <TableHead className="py-2 pr-4 text-center">Reorder Threshold</TableHead>
              <TableHead className="py-2 text-center">Configure Stock / Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v) => {
              const isLowStock = (v.inventory?.availableStock ?? 0) <= (v.inventory?.minStock ?? 0)
              return (
                <TableRow key={v.id}>
                  <TableCell className="py-2.5 pr-4 font-semibold text-foreground">
                    <div>{v.name}</div>
                    <code className="text-[10px] text-muted-foreground font-mono font-normal">{v.sku}</code>
                  </TableCell>
                  <TableCell className="py-2.5 pr-4 text-center font-mono">{v.inventory?.appStock ?? 0}</TableCell>
                  <TableCell className="py-2.5 pr-4 text-center font-mono">{v.inventory?.localStock ?? 0}</TableCell>
                  <TableCell className="py-2.5 pr-4 text-center">
                    <Badge variant={isLowStock ? "destructive" : "secondary"} className="font-mono text-[10px] font-bold h-5 px-2 py-0">
                      {v.inventory?.availableStock ?? 0} Units
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 pr-4 text-center font-mono text-muted-foreground">{v.inventory?.minStock ?? 0}</TableCell>
                  <TableCell className="py-2.5 text-center">
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                              <DotsThreeIcon weight="bold" className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/products/inventory/${v.id}`)} className="cursor-pointer">
                            <ClockIcon className="mr-2 size-4" />
                            Manage Stock
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  const categoryOptions = [
    { label: "All Categories", value: "all" },
    ...(categoriesData?.nodes.map((c) => ({ label: c.name, value: c.id })) || []),
  ]

  const brandOptions = [
    { label: "All Brands", value: "all" },
    ...(brandsData?.brands.map((b) => ({ label: b.name, value: b.id })) || []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock & Inventory Control"
        description="Monitor physical local shelves, mobile app reservation pools, and handle manually adjusted transactions."
      />

      <FilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search products or SKUs..."
        status=""
        onStatusChange={() => {}}
        statusOptions={[]}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearAllFilters}
        activeFilterChips={activeFilterChips}
      >
        <div className="flex gap-2">
          <Select
            value={categoryParam}
            onValueChange={(val) => handleFilterChange({ categoryId: val === "all" || val === null ? null : val })}
            items={categoryOptions}
          >
            <SelectTrigger className="h-9 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={brandParam}
            onValueChange={(val) => handleFilterChange({ brandId: val === "all" || val === null ? null : val })}
            items={brandOptions}
          >
            <SelectTrigger className="h-9 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {brandOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <Card className="p-0">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            getRowId={(p) => p.id}
            renderSubRow={renderSubRow}
            emptyTitle="No inventory metrics available"
            emptyDescription="Configure variants to track local shop shelves and app pools."
          />
        </CardContent>

        {data && data.meta.total > pageSize && (
          <CardFooter className="border-t px-6 py-4">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data.meta.total}
              onPageChange={(p) => router.push(buildHref(pathname, searchParams, { page: String(p) }))}
              onPageSizeChange={(sz) => router.push(buildHref(pathname, searchParams, { pageSize: String(sz), page: "1" }))}
            />
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
