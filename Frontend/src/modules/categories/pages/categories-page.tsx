"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  PlusIcon,
  SquaresFourIcon,
  ListIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  PowerIcon,
  TrashIcon,
  CheckCircleIcon,
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
import { CategoryTreeNode } from "../components/category-tree-node"
import { useDebounce } from "@/hooks/use-debounce"
import {
  DataTable,
  FilterBar,
  BulkActionsToolbar,
  Pagination,
  type ColumnDef,
} from "@/components/tables"
import { DEFAULT_PAGE_SIZE } from "@/constants"
import {
  useCategoriesQuery,
  useCategoryTreeQuery,
  useDeleteCategoryMutation,
  useRestoreCategoryMutation,
  useBulkDeleteMutation,
  useBulkStatusMutation,
  useUpdateCategoryMutation,
} from "../hooks/use-categories"
import { CatalogNodeType, CatalogNodeStatus, type CatalogNode } from "../types/category-types"

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

function CategoryAsset({ node }: { node: CatalogNode }) {
  const assetUrl = node.thumbnail || node.icon || node.banner || node.coverImage
  if (assetUrl && assetUrl.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={assetUrl}
        alt=""
        className="size-8 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
      />
    )
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <SquaresFourIcon className="size-4" />
    </span>
  )
}

export function CategoriesPage() {
  const t = useTranslations("Categories")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Routing-based filter states
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.max(5, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
  const statusParam = (searchParams.get("status") ?? "all") as CatalogNodeStatus | "all"
  const typeParam = (searchParams.get("type") ?? "all") as CatalogNodeType | "all"
  const searchParam = searchParams.get("search") ?? ""
  // "Deleted" is a separate view, not a status value (delete/restore is
  // orthogonal to ACTIVE/INACTIVE) — the only way a deleted node becomes
  // visible/restorable. The tree view never returns deleted nodes, so the
  // deleted view always forces the table view.
  const showDeleted = searchParams.get("deleted") === "true"

  // Local view and debounced search inputs
  const [activeView, setActiveView] = useState<"tree" | "table">("tree")
  const [searchInput, setSearchInput] = useState(searchParam)
  const debouncedSearch = useDebounce(searchInput, 300)

  // Deletion confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<CatalogNode | undefined>(undefined)
  const [deleteReason, setDeleteReason] = useState("")

  // Bulk actions selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleteReason, setBulkDeleteReason] = useState("")

  // Bulk status change (Activate/Deactivate) confirmation dialog state
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false)
  const [pendingBulkStatus, setPendingBulkStatus] = useState<CatalogNodeStatus | null>(null)

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

  // Sync date range, status, type filters
  const handleFilterChange = (updates: Record<string, string | null>) => {
    router.push(buildHref(pathname, searchParams, { ...updates, page: null }))
  }

  // Fetch queries
  const treeQuery = useCategoryTreeQuery()
  const listParams = {
    page,
    pageSize,
    search: searchParam || undefined,
    status: statusParam === "all" ? undefined : statusParam,
    type: typeParam === "all" ? undefined : typeParam,
    deleted: showDeleted || undefined,
  }
  const flatQuery = useCategoriesQuery(listParams)

  // Mutations
  const updateMutation = useUpdateCategoryMutation()
  const deleteMutation = useDeleteCategoryMutation()
  const restoreMutation = useRestoreCategoryMutation()
  const bulkDeleteMutation = useBulkDeleteMutation()
  const bulkStatusMutation = useBulkStatusMutation()

  const handleToggleDeletedView = (next: boolean) => {
    setSelectedIds([])
    router.push(buildHref(pathname, searchParams, { deleted: next ? "true" : null, page: null }))
    if (next) setActiveView("table")
  }

  // Flattened active nodes array
  const allFlatNodes = flatQuery.data?.nodes ?? []

  // Button-visibility: derived from the currently-loaded table rows + selection
  const selectedRows = allFlatNodes.filter((n) => selectedIds.includes(n.id))
  const canBulkActivate = selectedRows.some((n) => n.status === CatalogNodeStatus.INACTIVE)
  const canBulkDeactivate = selectedRows.some((n) => n.status === CatalogNodeStatus.ACTIVE)

  const handleEdit = (node: CatalogNode) => {
    router.push(`/categories/edit/${node.id}`)
  }

  const handleCreateNew = () => {
    router.push("/categories/new")
  }

  const handleDeleteTrigger = (node: CatalogNode) => {
    setNodeToDelete(node)
    setDeleteReason("")
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!nodeToDelete) return
    deleteMutation.mutate(
      { id: nodeToDelete.id, reason: deleteReason || undefined },
      {
        onSuccess: () => {
          toast.success("Catalog node deleted successfully")
          setDeleteDialogOpen(false)
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete catalog node")
        },
      }
    )
  }

  const handleRestore = (node: CatalogNode) => {
    restoreMutation.mutate(node.id, {
      onSuccess: () => {
        toast.success("Catalog node restored successfully")
      },
      onError: (err) => {
        toast.error(err.message || "Failed to restore catalog node")
      },
    })
  }

  const handleToggleStatus = (node: CatalogNode) => {
    const nextStatus = node.status === CatalogNodeStatus.ACTIVE
      ? CatalogNodeStatus.INACTIVE
      : CatalogNodeStatus.ACTIVE
    updateMutation.mutate(
      { id: node.id, input: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success(`Catalog node status updated to ${nextStatus}`)
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update status")
        },
      }
    )
  }

  // Checkbox selects helper
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = allFlatNodes.map((n) => n.id)
      setSelectedIds(ids)
    } else {
      setSelectedIds([])
    }
  }

  // Bulk executions
  const handleBulkDeleteConfirm = () => {
    bulkDeleteMutation.mutate(
      { ids: selectedIds, reason: bulkDeleteReason || undefined },
      {
        onSuccess: () => {
          toast.success("Selected nodes deleted successfully")
          setSelectedIds([])
          setBulkDeleteDialogOpen(false)
        },
        onError: (err) => {
          toast.error(err.message || "Failed to bulk delete nodes")
        },
      }
    )
  }

  const handleBulkActivateTrigger = () => {
    setPendingBulkStatus(CatalogNodeStatus.ACTIVE)
    setBulkStatusDialogOpen(true)
  }

  const handleBulkDeactivateTrigger = () => {
    setPendingBulkStatus(CatalogNodeStatus.INACTIVE)
    setBulkStatusDialogOpen(true)
  }

  const handleBulkStatusConfirm = () => {
    if (!pendingBulkStatus) return
    bulkStatusMutation.mutate(
      { ids: selectedIds, status: pendingBulkStatus },
      {
        onSuccess: () => {
          toast.success(
            pendingBulkStatus === CatalogNodeStatus.ACTIVE
              ? "Selected nodes activated successfully"
              : "Selected nodes deactivated successfully"
          )
          setSelectedIds([])
          setBulkStatusDialogOpen(false)
          setPendingBulkStatus(null)
        },
        onError: (err) => {
          toast.error(err.message || "Failed to bulk update status")
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
    ...(typeParam !== "all" ? [{ key: "type", label: `Type: ${typeParam}`, onClear: () => handleFilterChange({ type: null }) }] : []),
  ]

  const hasActiveFilters = activeFilterChips.length > 0

  // Standard DataTable Column Defs
  const columns: ColumnDef<CatalogNode>[] = [
    {
      header: t("columnName"),
      accessor: (n) => (
        <div className="flex items-center gap-3">
          <CategoryAsset node={n} />
          <span className="font-medium text-foreground">{n.name}</span>
        </div>
      ),
    },
    {
      header: t("columnCode"),
      accessor: (n) => (
        <span className="font-mono text-[10px] text-zinc-500 uppercase">{n.code}</span>
      ),
    },
    {
      header: t("columnType"),
      accessor: (n) => (
        <Badge variant="outline" className="text-[10px]">{n.type}</Badge>
      ),
    },
    {
      header: t("columnStatus"),
      accessor: (n) => (
        <Badge variant={n.status === CatalogNodeStatus.ACTIVE ? "default" : "secondary"}>
          {n.status === CatalogNodeStatus.ACTIVE ? t("statusActive") : t("statusInactive")}
        </Badge>
      ),
    },
    {
      header: t("columnSort"),
      className: "text-center",
      headClassName: "text-center",
      accessor: (n) => <span className="font-mono text-xs">{n.sortOrder}</span>,
    },
    {
      header: t("columnProducts"),
      className: "text-center",
      headClassName: "text-center",
      accessor: (n) => <span className="font-mono text-xs">{n.productCount}</span>,
    },
    {
      header: t("columnChildren"),
      className: "text-center",
      headClassName: "text-center",
      accessor: (n) => <span className="font-mono text-xs">{n.childCount}</span>,
    },
    {
      header: t("columnActions"),
      className: "text-center",
      accessor: (n) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <DotsThreeIcon weight="bold" className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {n.isDeleted ? (
              // A deleted row is only ever shown in the "deleted" view —
              // Restore is the only applicable action.
              <DropdownMenuItem onClick={() => handleRestore(n)} className="cursor-pointer">
                <ArrowCounterClockwiseIcon className="mr-2 size-4 text-teal-500" />
                Restore
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => handleEdit(n)} className="cursor-pointer">
                  <PencilSimpleIcon className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {n.status === CatalogNodeStatus.INACTIVE && (
                  <DropdownMenuItem onClick={() => handleToggleStatus(n)} className="cursor-pointer">
                    <CheckCircleIcon className="mr-2 size-4 text-emerald-500" />
                    Activate
                  </DropdownMenuItem>
                )}
                {n.status === CatalogNodeStatus.ACTIVE && (
                  <DropdownMenuItem onClick={() => handleToggleStatus(n)} className="cursor-pointer">
                    <PowerIcon className="mr-2 size-4" />
                    Deactivate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => handleDeleteTrigger(n)} className="cursor-pointer">
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
    ...Object.values(CatalogNodeStatus).map((s) => ({ label: s, value: s })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        primaryAction={{
          label: t("createNode"),
          onClick: handleCreateNew,
          icon: <PlusIcon />,
        }}
      />

      {/* Shared FilterBar Component */}
      <FilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={t("searchPlaceholder")}
        status={statusParam}
        onStatusChange={(val) => handleFilterChange({ status: val === "all" ? null : val })}
        statusOptions={statusOptions}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearAllFilters}
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

        {/* Toggle view tabs inside the search flex bar — the tree view never
            includes deleted nodes, so it's disabled while viewing deleted. */}
        {!showDeleted && (
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl self-start md:self-auto sm:ml-auto">
            <button
              onClick={() => setActiveView("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeView === "tree"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
            >
              <SquaresFourIcon className="size-4" />
              {t("tabTree")}
            </button>
            <button
              onClick={() => setActiveView("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeView === "table"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
            >
              <ListIcon className="size-4" />
              {t("tabTable")}
            </button>
          </div>
        )}
      </FilterBar>

      {/* Main Card View */}
      <Card className="p-0">
        {!showDeleted && activeView === "tree" ? (
          <CardContent className="p-0">
            {treeQuery.isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="h-8 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg w-full" />
                ))}
              </div>
            ) : !treeQuery.data || treeQuery.data.length === 0 ? (
              <div className="text-center py-12">
                <SquaresFourIcon className="size-12 mx-auto text-zinc-300 mb-3" />
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("emptyStateTitle")}</h3>
                <p className="text-xs text-zinc-400 mt-1">{t("emptyStateDescription")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {treeQuery.data.map((node) => (
                  <CategoryTreeNode
                    key={node.id}
                    node={node}
                    onEdit={handleEdit}
                    onDelete={handleDeleteTrigger}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            )}
          </CardContent>
        ) : (
          <>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={allFlatNodes}
                isLoading={flatQuery.isLoading}
                selectedIds={selectedIds}
                onSelectRow={showDeleted ? undefined : handleSelectRow}
                onSelectAll={showDeleted ? undefined : handleSelectAll}
                getRowId={(n) => n.id}
                emptyTitle={showDeleted ? "No Deleted Nodes" : t("noResultsTitle")}
                emptyDescription={
                  showDeleted
                    ? "There are no soft-deleted catalog nodes to restore."
                    : t("noResultsDescription")
                }
              />
            </CardContent>

            {flatQuery.data && flatQuery.data.meta.total > pageSize && (
              <CardFooter className="border-t px-6 py-4">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={flatQuery.data.meta.total}
                  onPageChange={(p) => router.push(buildHref(pathname, searchParams, { page: String(p) }))}
                  onPageSizeChange={(sz) => router.push(buildHref(pathname, searchParams, { pageSize: String(sz), page: "1" }))}
                />
              </CardFooter>
            )}
          </>
        )}
      </Card>

      {/* Shared BulkActionsToolbar — no bulk-restore endpoint exists, so bulk
          actions are only offered in the default (non-deleted) view. */}
      {!showDeleted && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onActivate={canBulkActivate ? handleBulkActivateTrigger : undefined}
          onDeactivate={canBulkDeactivate ? handleBulkDeactivateTrigger : undefined}
          onDelete={() => {
            setBulkDeleteReason("")
            setBulkDeleteDialogOpen(true)
          }}
        />
      )}

      {/* Dialog confirmations */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("deleteConfirmTitle")}
        description={
          <div className="space-y-3">
            <p>{t("deleteConfirmDescription", { name: nodeToDelete?.name || "" })}</p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">{t("deleteReasonLabel")}</label>
              <Input
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Deprecated collection catalog structure"
                className="text-xs h-8"
              />
            </div>
          </div>
        }
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        open={bulkStatusDialogOpen}
        onOpenChange={setBulkStatusDialogOpen}
        title={
          pendingBulkStatus === CatalogNodeStatus.ACTIVE
            ? "Activate Catalog Nodes?"
            : "Deactivate Catalog Nodes?"
        }
        description={
          pendingBulkStatus === CatalogNodeStatus.ACTIVE
            ? `Are you sure you want to activate the ${selectedIds.length} selected ${selectedIds.length === 1 ? "node" : "nodes"}? ${selectedIds.length === 1 ? "It" : "They"} will become visible to customer applications.`
            : `Are you sure you want to deactivate the ${selectedIds.length} selected ${selectedIds.length === 1 ? "node" : "nodes"}? ${selectedIds.length === 1 ? "It" : "They"} will be hidden from customer applications.`
        }
        confirmLabel={pendingBulkStatus === CatalogNodeStatus.ACTIVE ? "Activate" : "Deactivate"}
        variant="default"
        onConfirm={handleBulkStatusConfirm}
        isLoading={bulkStatusMutation.isPending}
      />

      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Bulk Delete Nodes?"
        description={
          <div className="space-y-3">
            <p>Are you sure you want to soft-delete the {selectedIds.length} selected nodes?</p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">{t("deleteReasonLabel")}</label>
              <Input
                value={bulkDeleteReason}
                onChange={(e) => setBulkDeleteReason(e.target.value)}
                placeholder="e.g. Bulk category cleanup"
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
