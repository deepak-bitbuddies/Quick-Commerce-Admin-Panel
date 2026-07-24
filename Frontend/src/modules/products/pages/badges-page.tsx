"use client"

import { useState } from "react"
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { DataTable, type ColumnDef } from "@/components/tables"
import { DeleteConfirmationDialog } from "@/components/feedback"
import { BadgeDialog } from "../components/badge-dialog"
import {
  useBadgesQuery,
  useDeleteBadgeMutation,
  useSetBadgeStatusMutation,
} from "../hooks/use-products"
import type { ProductBadge } from "../types/product"
import type { ApiErrorPayload } from "@/lib/axios"

export function BadgesPage() {
  // Filters
  const [search, setSearch] = useState("")

  // Queries
  const { data, isLoading } = useBadgesQuery({ search: search || undefined })
  const badges = data?.badges ?? []

  // Mutations (create/update now live inside BadgeDialog itself)
  const deleteMutation = useDeleteBadgeMutation()
  const setStatusMutation = useSetBadgeStatusMutation()

  // Create/Edit dialog state — the page only owns *which* badge (if any) is
  // being edited; the form, its validation, and its mutation calls live
  // entirely inside BadgeDialog.
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<ProductBadge | null>(null)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [badgeToDelete, setBadgeToDelete] = useState<ProductBadge | null>(null)

  const handleOpenCreate = () => {
    setEditingBadge(null)
    setFormDialogOpen(true)
  }

  const handleOpenEdit = (badge: ProductBadge) => {
    setEditingBadge(badge)
    setFormDialogOpen(true)
  }

  const handleDeleteTrigger = (badge: ProductBadge) => {
    setBadgeToDelete(badge)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!badgeToDelete) return
    deleteMutation.mutate(badgeToDelete.id, {
      onSuccess: () => {
        toast.success("Badge deleted successfully")
        setDeleteDialogOpen(false)
      },
      onError: (err: ApiErrorPayload) => {
        toast.error(err.message || "Failed to delete badge")
      },
    })
  }

  const handleToggleBadgeStatus = (badge: ProductBadge) => {
    const nextStatus = badge.status === "active" ? "inactive" : "active"
    setStatusMutation.mutate(
      {
        badgeId: badge.id,
        status: nextStatus,
      },
      {
        onSuccess: () => {
          toast.success(`Badge "${badge.name}" status updated to ${nextStatus}`)
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to update badge status")
        },
      }
    )
  }

  const columns: ColumnDef<ProductBadge>[] = [
    {
      header: "Visual Preview",
      accessor: (b) => (
        <span
          className="inline-flex items-center px-2.5 py-1 rounded text-xs font-extrabold tracking-wide uppercase transition-all duration-200 ease-in-out shadow-sm"
          style={{
            backgroundColor: b.color,
            color: b.textColor,
          }}
        >
          {b.name}
        </span>
      ),
    },
    {
      header: "Badge Name",
      accessor: (b) => <span className="font-semibold text-foreground text-sm">{b.name}</span>,
    },
    {
      header: "Hex Configurations",
      accessor: (b) => (
        <div className="flex gap-4 font-mono text-[10px] text-muted-foreground">
          <span>BG: {b.color.toUpperCase()}</span>
          <span>TXT: {b.textColor.toUpperCase()}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (b) => {
        const isActive = b.status === "active"
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={() => handleToggleBadgeStatus(b)}
              disabled={setStatusMutation.isPending}
              aria-label={`Toggle status for badge ${b.name}`}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        )
      },
    },
    {
      header: "Actions",
      className: "text-center w-[120px]",
      accessor: (b) => (
        <div className="flex justify-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => handleOpenEdit(b)} className="cursor-pointer">
            <PencilSimpleIcon className="size-4" />
            <span className="sr-only">Edit badge</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDeleteTrigger(b)}
            className="text-destructive hover:bg-destructive/5 hover:text-destructive cursor-pointer"
          >
            <TrashIcon className="size-4" />
            <span className="sr-only">Delete badge</span>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Badges Management"
        description="Configure dynamic tag badges that can be pinned to products to indicate trending statuses, promotions, or features."
        primaryAction={{
          label: "Add Badge",
          onClick: handleOpenCreate,
          icon: <PlusIcon />,
        }}
      />

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search custom badges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm"
          />
        </div>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950 p-0">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={badges}
            isLoading={isLoading}
            emptyTitle="No badges found"
            emptyDescription={
              search
                ? `No badges matched "${search}"`
                : "No product badges configured yet. Click 'Add Badge' to get started."
            }
          />
        </CardContent>
      </Card>

      {/* Create/Edit dialog — form, validation, and mutations live inside BadgeDialog */}
      <BadgeDialog open={formDialogOpen} onOpenChange={setFormDialogOpen} badge={editingBadge} />

      {/* Delete confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Badge?"
        description={`Are you sure you want to delete the badge "${badgeToDelete?.name ?? ""}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
