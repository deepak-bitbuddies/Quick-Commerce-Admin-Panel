"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  PlusIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  PowerIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import {
  DeleteConfirmationDialog,
  ConfirmationDialog,
} from "@/components/feedback"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDebounce } from "@/hooks/use-debounce"
import { BrandFormDialog } from "../components/brand-form"
import {
  DataTable,
  FilterBar,
  BulkActionsToolbar,
  Pagination,
  type ColumnDef,
} from "@/components/tables"
import { DEFAULT_PAGE_SIZE } from "@/constants"
import {
  useBrandsQuery,
  useUpdateBrandStatusMutation,
  useDeleteBrandMutation,
  useRestoreBrandMutation,
  useBulkDeleteBrandsMutation,
  useBulkStatusBrandsMutation,
} from "../hooks/use-brands"
import type { Brand, BrandStatus } from "../types/brand"
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

function BrandLogo({ brand }: { brand: Brand }) {
  if (brand.logo && brand.logo.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logo}
        alt=""
        className="size-8 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
      />
    )
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <TagIcon className="size-4" />
    </span>
  )
}

export function BrandsListPage() {
  const t = useTranslations("Brands")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Routing-based filter states
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.max(5, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
  const statusParam = (searchParams.get("status") ?? "all") as BrandStatus | "all"
  const searchParam = searchParams.get("search") ?? ""
  // "Deleted" is a separate view, not a status value (delete/restore is
  // orthogonal to ACTIVE/INACTIVE) — the only way a deleted brand becomes
  // visible/restorable.
  const showDeleted = searchParams.get("deleted") === "true"

  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(searchParam)
  const debouncedSearch = useDebounce(searchInput, 300)

  // Creation/Edition modal states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | undefined>(undefined)

  // View Details Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingBrand, setViewingBrand] = useState<Brand | null>(null)

  // Confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
  const [deleteReason, setDeleteReason] = useState("")

  // Bulk action selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleteReason, setBulkDeleteReason] = useState("")
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false)
  const [pendingBulkStatus, setPendingBulkStatus] = useState<BrandStatus | null>(null)

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

  // Sync date range, status filters
  const handleFilterChange = (updates: Record<string, string | null>) => {
    router.push(buildHref(pathname, searchParams, { ...updates, page: null }))
  }

  // Fetch query
  const queryParams = {
    page,
    pageSize,
    search: searchParam || undefined,
    status: statusParam === "all" ? undefined : statusParam,
    deleted: showDeleted || undefined,
  }
  const { data, isLoading } = useBrandsQuery(queryParams)

  // Mutations
  const deleteMutation = useDeleteBrandMutation()
  const restoreMutation = useRestoreBrandMutation()
  const updateStatusMutation = useUpdateBrandStatusMutation()
  const bulkDeleteMutation = useBulkDeleteBrandsMutation()
  const bulkStatusMutation = useBulkStatusBrandsMutation()

  const brands = data?.brands ?? []

  // Bulk toolbar visibility: derive the selected rows' statuses by
  // cross-referencing `selectedIds` against the currently-fetched page of
  // brands (selection state only stores IDs).
  const selectedBrands = brands.filter((b) => selectedIds.includes(b.id))
  const canBulkActivate = selectedBrands.some((b) => b.status === "INACTIVE")
  const canBulkDeactivate = selectedBrands.some((b) => b.status === "ACTIVE")

  const handleCreateClick = () => {
    setEditingBrand(undefined)
    setFormDialogOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand)
    setFormDialogOpen(true)
  }

  const handleViewBrand = (brand: Brand) => {
    setViewingBrand(brand)
    setViewDialogOpen(true)
  }

  const handleToggleStatus = (brand: Brand) => {
    const nextStatus: BrandStatus = brand.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    updateStatusMutation.mutate(
      { brandId: brand.id, input: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success("Brand status updated successfully")
        },
        onError: (error: ApiErrorPayload) => {
          toast.error(error.message || "Failed to update status")
        },
      }
    )
  }

  const handleDeleteTrigger = (brand: Brand) => {
    setBrandToDelete(brand)
    setDeleteReason("")
    setDeleteDialogOpen(true)
  }

  const handleRestore = (brand: Brand) => {
    restoreMutation.mutate(brand.id, {
      onSuccess: () => {
        toast.success(`"${brand.name}" restored successfully`)
      },
      onError: (error: ApiErrorPayload) => {
        toast.error(error.message || "Failed to restore brand")
      },
    })
  }

  const handleToggleDeletedView = (next: boolean) => {
    setSelectedIds([])
    router.push(buildHref(pathname, searchParams, { deleted: next ? "true" : null, page: null }))
  }

  const handleConfirmDelete = () => {
    if (!brandToDelete) return
    deleteMutation.mutate(
      { brandId: brandToDelete.id, reason: deleteReason || undefined },
      {
        onSuccess: () => {
          toast.success("Brand soft-deleted successfully")
          setDeleteDialogOpen(false)
        },
        onError: (error: ApiErrorPayload) => {
          toast.error(error.message || "Failed to delete brand")
        },
      }
    )
  }

  // Row selection checkboxes helpers
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = brands.map((b) => b.id)
      setSelectedIds(ids)
    } else {
      setSelectedIds([])
    }
  }

  // Bulk mutations executions
  const handleBulkDeleteConfirm = () => {
    bulkDeleteMutation.mutate(
      { ids: selectedIds, reason: bulkDeleteReason || undefined },
      {
        onSuccess: () => {
          toast.success("Selected brands deleted successfully")
          setSelectedIds([])
          setBulkDeleteDialogOpen(false)
        },
        onError: (error: ApiErrorPayload) => {
          toast.error(error.message || "Failed to bulk delete brands")
        },
      }
    )
  }

  const handleBulkStatusTrigger = (status: BrandStatus) => {
    setPendingBulkStatus(status)
    setBulkStatusDialogOpen(true)
  }

  const handleBulkStatusConfirm = () => {
    if (!pendingBulkStatus) return
    bulkStatusMutation.mutate(
      { ids: selectedIds, status: pendingBulkStatus },
      {
        onSuccess: () => {
          toast.success("Status updated for selected brands")
          setSelectedIds([])
          setBulkStatusDialogOpen(false)
        },
        onError: (error: ApiErrorPayload) => {
          toast.error(error.message || "Failed to bulk update status")
        },
      }
    )
  }

  const handleClearFilters = () => {
    setSearchInput("")
    router.push(pathname)
  }

  const activeFilterChips = [
    ...(searchParam ? [{ key: "search", label: `Search: ${searchParam}`, onClear: () => handleFilterChange({ search: null }) }] : []),
    ...(statusParam !== "all" ? [{ key: "status", label: `Status: ${statusParam}`, onClear: () => handleFilterChange({ status: null }) }] : []),
  ]

  const hasActiveFilters = activeFilterChips.length > 0

  // DataTable column specs
  const columns: ColumnDef<Brand>[] = [
    {
      header: t("columnLogo") || "Logo",
      accessor: (b) => <BrandLogo brand={b} />,
    },
    {
      header: t("columnName"),
      accessor: (b) => <span className="font-semibold text-foreground">{b.name}</span>,
    },
    {
      header: t("columnDescription") || "Description",
      accessor: (b) => (
        <span className="text-zinc-500 line-clamp-1 max-w-[300px]">
          {b.description || "No Description"}
        </span>
      ),
    },
    {
      header: t("columnStatus") || "Status",
      accessor: (b) => (
        <Badge variant={b.status === "ACTIVE" ? "default" : "secondary"}>
          {b.status === "ACTIVE"
            ? t("statusActive") || "Active"
            : t("statusInactive") || "Inactive"}
        </Badge>
      ),
    },
    {
      header: t("columnCreatedAt") || "Created At",
      accessor: (b) => (
        <span className="text-zinc-500 font-mono text-[11px]">
          {new Date(b.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: t("columnActions"),
      className: "text-center",
      accessor: (b) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <DotsThreeIcon weight="bold" className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {b.isDeleted ? (
              // A deleted row is only ever shown in the "deleted" view —
              // Restore is the only applicable action; Edit/Activate/
              // Deactivate/Delete don't make sense on a soft-deleted record.
              <DropdownMenuItem onClick={() => handleRestore(b)} className="cursor-pointer">
                <ArrowCounterClockwiseIcon className="mr-2 size-4" />
                Restore
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => handleViewBrand(b)} className="cursor-pointer">
                  <EyeIcon className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditBrand(b)} className="cursor-pointer">
                  <PencilSimpleIcon className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Activate/Deactivate are mutually exclusive given BrandStatus
                    is exactly ACTIVE | INACTIVE — each item is only visible for
                    the status it applies to. */}
                {b.status === "INACTIVE" && (
                  <DropdownMenuItem onClick={() => handleToggleStatus(b)} className="cursor-pointer">
                    <PowerIcon className="mr-2 size-4" />
                    Activate
                  </DropdownMenuItem>
                )}
                {b.status === "ACTIVE" && (
                  <DropdownMenuItem onClick={() => handleToggleStatus(b)} className="cursor-pointer">
                    <PowerIcon className="mr-2 size-4" />
                    Deactivate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => handleDeleteTrigger(b)} className="cursor-pointer">
                  <TrashIcon className="mr-2 size-4" />
                  Soft Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        primaryAction={{
          label: t("createBrand"),
          onClick: handleCreateClick,
          icon: <PlusIcon />,
        }}
      />

      {/* Shared FilterBar Component */}
      <FilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={t("searchPlaceholder") || "Search brands..."}
        status={statusParam}
        onStatusChange={(val) => handleFilterChange({ status: val === "all" ? null : val })}
        statusOptions={statusOptions}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
        activeFilterChips={activeFilterChips}
      >
        <Button
          type="button"
          variant={showDeleted ? "default" : "outline"}
          size="sm"
          onClick={() => handleToggleDeletedView(!showDeleted)}
          className="cursor-pointer"
        >
          <TrashIcon className="mr-2 size-4" />
          {showDeleted ? "Viewing Deleted" : "Show Deleted"}
        </Button>
      </FilterBar>

      {/* Main Brands Card Table Grid */}
      <Card className="p-0">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={brands}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onSelectRow={showDeleted ? undefined : handleSelectRow}
            onSelectAll={showDeleted ? undefined : handleSelectAll}
            getRowId={(b) => b.id}
            emptyTitle={showDeleted ? "No Deleted Brands" : "No Brands Found"}
            emptyDescription={
              showDeleted
                ? "There are no soft-deleted brands to restore."
                : "There are no brands available matching your filters."
            }
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

      {/* Shared BulkActionsToolbar — no bulk-restore endpoint exists, so bulk
          actions are only offered in the default (non-deleted) view. */}
      {!showDeleted && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onActivate={canBulkActivate ? () => handleBulkStatusTrigger("ACTIVE") : undefined}
          onDeactivate={canBulkDeactivate ? () => handleBulkStatusTrigger("INACTIVE") : undefined}
          onDelete={() => {
            setBulkDeleteReason("")
            setBulkDeleteDialogOpen(true)
          }}
        />
      )}

      {/* Brand Creation/Edition Modal Form */}
      <BrandFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        brand={editingBrand}
      />

      {/* Brand Details View Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Brand Details</DialogTitle>
          </DialogHeader>
          {viewingBrand && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <BrandLogo brand={viewingBrand} />
                <div>
                  <h4 className="font-semibold text-base">{viewingBrand.name}</h4>
                  <Badge variant={viewingBrand.status === "ACTIVE" ? "default" : "secondary"} className="mt-1">
                    {viewingBrand.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  {viewingBrand.description || "No description provided."}
                </p>
              </div>
              <div className="text-[11px] text-zinc-400">
                Created: {new Date(viewingBrand.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Safety Confirmations */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("deleteBrandTitle", { name: brandToDelete?.name || "" })}
        description={
          <div className="space-y-3">
            <p>{t("deleteBrandDescription")}</p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">Reason for soft delete</label>
              <Input
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Brand no longer supplied by distributor"
                className="text-xs h-8"
              />
            </div>
          </div>
        }
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        open={bulkStatusDialogOpen}
        onOpenChange={setBulkStatusDialogOpen}
        title={
          pendingBulkStatus === "ACTIVE"
            ? `Activate ${selectedIds.length} brand${selectedIds.length === 1 ? "" : "s"}?`
            : `Deactivate ${selectedIds.length} brand${selectedIds.length === 1 ? "" : "s"}?`
        }
        description={
          pendingBulkStatus === "ACTIVE"
            ? "The selected brands will become active and available across the catalog."
            : "The selected brands will become inactive and unavailable for new use across the catalog."
        }
        confirmLabel={pendingBulkStatus === "ACTIVE" ? "Activate" : "Deactivate"}
        onConfirm={handleBulkStatusConfirm}
        isLoading={bulkStatusMutation.isPending}
      />

      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Bulk Delete Brands?"
        description={
          <div className="space-y-3">
            <p>Are you sure you want to soft-delete the {selectedIds.length} selected brands?</p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">Reason for soft delete</label>
              <Input
                value={bulkDeleteReason}
                onChange={(e) => setBulkDeleteReason(e.target.value)}
                placeholder="e.g. Bulk brand portfolio cleanup"
                className="text-xs h-8"
              />
            </div>
          </div>
        }
        confirmLabel="Soft Delete All"
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
        isLoading={bulkDeleteMutation.isPending}
      />
    </div>
  )
}
