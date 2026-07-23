"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  PlusIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
  TagIcon,
  SparkleIcon,
  WarningOctagonIcon,
  ClockIcon,
  CopyIcon,
  EyeIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { ReasonInputDialog } from "@/components/feedback"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useDebounce } from "@/hooks/use-debounce"
import {
  DataTable,
  FilterBar,
  Pagination,
  type ColumnDef,
} from "@/components/tables"
import { DEFAULT_PAGE_SIZE } from "@/constants"
import {
  useProductsQuery,
  useDeleteProductMutation,
  useDuplicateProductMutation,
  useDuplicateVariantMutation,
  useDeleteVariantMutation,
  useBadgesQuery,
  useProductStatsQuery,
} from "../hooks/use-products"
import { useBrandsQuery } from "@/modules/brands/hooks/use-brands"
import { useCategoriesQuery } from "@/modules/categories/hooks/use-categories"
import type { Product, ProductVariant, ProductStatus } from "../types/product"
import type { ApiErrorPayload } from "@/lib/axios"

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

function ProductThumbnail({ product }: { product: Product }) {
  const imgUrl = product.primaryImage || (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null)
  if (imgUrl && imgUrl.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgUrl}
        alt=""
        className="size-10 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
      />
    )
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <TagIcon className="size-5" />
    </span>
  )
}

export function ProductsListPage() {
  const t = useTranslations("Products")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Routing-based filter states
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.max(5, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
  const statusParam = (searchParams.get("status") ?? "all") as ProductStatus | "all"
  const categoryParam = searchParams.get("categoryId") ?? "all"
  const brandParam = searchParams.get("brandId") ?? "all"
  const searchParam = searchParams.get("search") ?? ""

  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(searchParam)
  const debouncedSearch = useDebounce(searchInput, 300)

  // Confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleteReason, setDeleteReason] = useState("")

  // Search input debouncer trigger
  useEffect(() => {
    if (debouncedSearch === searchParam) return
    router.push(
      buildHref(pathname, searchParams, {
        search: debouncedSearch || null,
        page: null,
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Sync filters to search query
  const handleFilterChange = (updates: Record<string, string | null>) => {
    router.push(buildHref(pathname, searchParams, { ...updates, page: null }))
  }

  // Fetch queries
  const queryParams = {
    page,
    pageSize,
    search: searchParam || undefined,
    status: statusParam === "all" ? undefined : statusParam,
    categoryId: categoryParam === "all" ? undefined : categoryParam,
    brandId: brandParam === "all" ? undefined : brandParam,
  }
  const { data, isLoading } = useProductsQuery(queryParams)
  
  // Auxiliary filters lists
  const { data: categoriesData } = useCategoriesQuery({ page: 1, pageSize: 100 })
  const { data: brandsData } = useBrandsQuery({ page: 1, pageSize: 100 })
  const { data: badgesData } = useBadgesQuery({ page: 1, pageSize: 100 })

  const deleteMutation = useDeleteProductMutation()
  const duplicateProductMutation = useDuplicateProductMutation()
  const duplicateVariantMutation = useDuplicateVariantMutation()
  const deleteVariantMutation = useDeleteVariantMutation()

  const products = data?.products ?? []
  const { data: stats } = useProductStatsQuery()

  const handleCreateClick = () => {
    router.push("/products/new")
  }

  const handleEditProduct = (product: Product) => {
    router.push(`/products/${product.id}`)
  }

  // Archive action trigger
  const handleDeleteTrigger = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDuplicateProduct = (product: Product) => {
    duplicateProductMutation.mutate(product.id, {
      onSuccess: () => {
        toast.success("Product duplicated successfully (Created as DRAFT)")
      },
      onError: (error: ApiErrorPayload) => {
        toast.error(error.message || "Failed to duplicate product")
      },
    })
  }

  const handleDuplicateVariant = (variant: ProductVariant) => {
    duplicateVariantMutation.mutate(
      { variantId: variant.id, productId: variant.productId },
      {
        onSuccess: () => {
          toast.success("Variant duplicated successfully")
        },
        onError: (error: ApiErrorPayload) => {
          toast.error(error.message || "Failed to duplicate variant")
        },
      }
    )
  }

  const handleDeleteVariant = (variant: ProductVariant) => {
    deleteVariantMutation.mutate(
      { variantId: variant.id, productId: variant.productId },
      {
        onSuccess: () => {
          toast.success("Variant archived successfully")
        },
        onError: (error: ApiErrorPayload) => {
          toast.error(error.message || "Failed to archive variant")
        },
      }
    )
  }

  const handleClearAllFilters = () => {
    setSearchInput("")
    router.push(pathname)
  }

  const activeFilterChips = [
    ...(searchParam ? [{ key: "search", label: `Search: ${searchParam}`, onClear: () => handleFilterChange({ search: null }) }] : []),
    ...(statusParam !== "all" ? [{ key: "status", label: `Status: ${statusParam}`, onClear: () => handleFilterChange({ status: null }) }] : []),
    ...(categoryParam !== "all" ? [{ key: "category", label: "Category Filter Active", onClear: () => handleFilterChange({ categoryId: null }) }] : []),
    ...(brandParam !== "all" ? [{ key: "brand", label: "Brand Filter Active", onClear: () => handleFilterChange({ brandId: null }) }] : []),
  ]

  const hasActiveFilters = activeFilterChips.length > 0

  const categoryMap = new Map(categoriesData?.nodes.map((c) => [c.id, c.name]) || [])
  const brandMap = new Map(brandsData?.brands.map((b) => [b.id, b.name]) || [])

  // DataTable Column Definitions
  const columns: ColumnDef<Product>[] = [
    {
      header: "Product",
      accessor: (p) => {
        const activeBadges = badgesData?.badges || []
        const productBadges = p.badgeIds ? activeBadges.filter((b) => p.badgeIds.includes(b.id)) : []
        return (
          <div className="flex items-center gap-3">
            <ProductThumbnail product={p} />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => router.push(`/products/${p.id}`)}
                  className="font-medium text-foreground hover:text-amber-600 transition text-left cursor-pointer hover:underline"
                >
                  {p.name}
                </button>
                {productBadges.map((badge) => (
                  <span
                    key={badge.id}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shadow-sm"
                    style={{
                      backgroundColor: badge.color,
                      color: badge.textColor,
                    }}
                  >
                    {badge.name}
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[250px] mb-0.5">
                {p.description || "No description provided"}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      header: "Category & Brand",
      accessor: (p) => {
        const catName = categoryMap.get(p.categoryId) || "General"
        const brandName = brandMap.get(p.brandId) || "Unknown"
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-foreground">{catName}</span>
            <span className="text-[10px] text-muted-foreground">{brandName}</span>
          </div>
        )
      },
    },
    {
      header: "Variants Count",
      className: "text-center",
      accessor: (p) => {
        const count = p.variants?.length ?? 0
        return (
          <Badge variant="outline" className="font-mono text-xs">
            {count} Size{count !== 1 ? "s" : ""}
          </Badge>
        )
      },
    },
    {
      header: "Available Stock",
      className: "text-center",
      accessor: (p) => {
        const variants = p.variants || []
        const totalStock = variants.reduce((sum, v) => sum + (v.inventory?.availableStock || 0), 0)
        
        if (variants.length === 0) {
          return (
            <div className="flex items-center justify-center gap-1 text-xs text-amber-500 font-semibold">
              <WarningOctagonIcon className="size-4" />
              No Variants
            </div>
          )
        }
        
        const isOutOfStock = totalStock === 0
        return (
          <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="font-mono font-bold text-xs">
            {totalStock} Units
          </Badge>
        )
      },
    },
    {
      header: "Status",
      accessor: (p) => {
        let variant: "default" | "secondary" | "destructive" = "secondary"
        if (p.status === "active") variant = "default"
        if (p.status === "inactive" || p.status === "archived") variant = "destructive"
        return (
          <Badge variant={variant} className="capitalize">
            {p.status}
          </Badge>
        )
      },
    },
    {
      header: "Actions",
      className: "text-center",
      accessor: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <DotsThreeIcon weight="bold" className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/products/${p.id}`)} className="cursor-pointer">
              <EyeIcon className="mr-2 size-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/products/${p.id}?edit=true`)} className="cursor-pointer">
              <PencilSimpleIcon className="mr-2 size-4" />
              Edit product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicateProduct(p)} className="cursor-pointer">
              <CopyIcon className="mr-2 size-4" />
              Duplicate product
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDeleteTrigger(p)} className="text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer">
              <TrashIcon className="mr-2 size-4" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Draft", value: "draft" },
  ]

  const categoryOptions = [
    { label: "All Categories", value: "all" },
    ...(categoriesData?.nodes.map((c) => ({ label: c.name, value: c.id })) || []),
  ]

  const brandOptions = [
    { label: "All Brands", value: "all" },
    ...(brandsData?.brands.map((b) => ({ label: b.name, value: b.id })) || []),
  ]

  const renderSubRow = (p: Product) => {
    const variants = p.variants || []
    if (variants.length === 0) {
      return (
        <div className="text-xs text-muted-foreground p-2">
          No variant SKUs created for this product master yet.
        </div>
      )
    }

    return (
      <div className="space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Variant Sizes & Stock Pools</h4>
          <span className="text-[10px] text-muted-foreground font-semibold">
            Product: <span className="text-foreground">{p.name}</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            <thead>
              <tr className="text-muted-foreground font-semibold text-left">
                <th className="py-2 pr-4">Size (SKU)</th>
                <th className="py-2 pr-4 text-right">MRP</th>
                <th className="py-2 pr-4 text-right">App Price</th>
                <th className="py-2 pr-4 text-center">App Stock</th>
                <th className="py-2 pr-4 text-center">Local Stock</th>
                <th className="py-2 pr-4 text-center">Available Stock</th>
                <th className="py-2 pr-4 text-center font-normal">Min Stock</th>
                <th className="py-2 pr-4 text-center font-normal">Reorder Lvl</th>
                <th className="py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {variants.map((v) => {
                const availableStock = v.inventory?.availableStock ?? 0
                const isLowStock = availableStock <= (v.inventory?.minStock ?? 0)
                return (
                  <tr key={v.id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30">
                    <td className="py-2.5 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{v.name}</span>
                        {v.isDefault && (
                          <span className="text-[9px] uppercase font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1 py-0.2 rounded border border-amber-100 dark:border-amber-900/50">
                            Default
                          </span>
                        )}
                      </div>
                      <code className="text-[10px] text-muted-foreground font-mono font-normal">{v.sku}</code>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-zinc-600 dark:text-zinc-400">₹{(v.mrp / 100).toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-emerald-600 font-semibold">₹{(v.sellingPrice / 100).toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-center font-mono">{v.inventory?.appStock ?? 0}</td>
                    <td className="py-2.5 pr-4 text-center font-mono">{v.inventory?.localStock ?? 0}</td>
                    <td className="py-2.5 pr-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Badge variant={isLowStock ? "destructive" : "secondary"} className="font-mono text-[10px] font-bold h-5 px-2 py-0">
                          {availableStock}
                        </Badge>
                        {isLowStock && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-500">
                            <WarningOctagonIcon className="size-3" />
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-center font-mono text-muted-foreground">{v.inventory?.minStock ?? 0}</td>
                    <td className="py-2.5 pr-4 text-center font-mono text-muted-foreground">{v.inventory?.reorderLevel ?? 0}</td>
                    <td className="py-2.5 text-center">
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
                          <DropdownMenuItem onClick={() => handleDuplicateVariant(v)} className="cursor-pointer">
                            <CopyIcon className="mr-2 size-4" />
                            Duplicate Variant
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteVariant(v)} className="text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer">
                            <TrashIcon className="mr-2 size-4" />
                            Archive Variant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Inventory"
        description="Manage your grocery catalog, variant sizes, SKUs, pricing points, and visual stock meters."
        primaryAction={{
          label: "Create SKU",
          onClick: handleCreateClick,
          icon: <PlusIcon />,
        }}
      />

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: "Total Products", value: stats?.totalProducts ?? 0, color: "text-zinc-900 dark:text-zinc-50" },
          { title: "Active Products", value: stats?.activeProducts ?? 0, color: "text-emerald-600 dark:text-emerald-400" },
          { title: "Inactive Products", value: stats?.inactiveProducts ?? 0, color: "text-amber-600 dark:text-amber-400" },
          { title: "Draft Products", value: stats?.draftProducts ?? 0, color: "text-blue-600 dark:text-blue-400" },
          { title: "Out of Stock", value: stats?.outOfStock ?? 0, color: "text-rose-600 dark:text-rose-400" },
          { title: "Low Stock", value: stats?.lowStock ?? 0, color: "text-red-500 font-bold" },
        ].map((c) => (
          <Card key={c.title} className="p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{c.title}</span>
            <span className={`text-2xl font-mono font-bold mt-2 ${c.color}`}>{c.value}</span>
          </Card>
        ))}
      </div>

      <FilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name, SKU, or tags..."
        status={statusParam}
        onStatusChange={(val) => handleFilterChange({ status: val === "all" ? null : val })}
        statusOptions={statusOptions}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearAllFilters}
        activeFilterChips={activeFilterChips}
      >
        <div className="flex gap-2">
          {/* Categories select */}
          <select
            value={categoryParam}
            onChange={(e) => handleFilterChange({ categoryId: e.target.value === "all" ? null : e.target.value })}
            className="h-9 px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Brands select */}
          <select
            value={brandParam}
            onChange={(e) => handleFilterChange({ brandId: e.target.value === "all" ? null : e.target.value })}
            className="h-9 px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            {brandOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
            emptyTitle="No products found"
            emptyDescription="Create products manually using the product creation wizard to display them here."
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

      <ReasonInputDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Archive Product"
        description={`Are you sure you want to soft-delete and archive "${productToDelete?.name}"? All associated variants will be hidden from customer applications. Please enter a reason below.`}
        placeholder="Enter archiving reason..."
        confirmLabel="Archive Product"
        onConfirm={(reason) => {
          if (!productToDelete) return
          deleteMutation.mutate(
            { productId: productToDelete.id, reason },
            {
              onSuccess: () => {
                toast.success("Product archived successfully")
                setDeleteDialogOpen(false)
              },
              onError: (error: ApiErrorPayload) => {
                toast.error(error.message || "Failed to archive product")
              },
            }
          )
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
