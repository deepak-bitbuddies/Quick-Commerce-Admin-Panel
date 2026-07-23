"use client"

import { useState } from "react"
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  TagIcon,
  MagnifyingGlassIcon,
  SparkleIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/tables"
import {
  useBadgesQuery,
  useCreateBadgeMutation,
  useUpdateBadgeMutation,
  useDeleteBadgeMutation,
  useSetBadgeStatusMutation,
} from "../hooks/use-products"
import type { ProductBadge } from "../types/product"
import type { ApiErrorPayload } from "@/lib/axios"

// Color presets for quick selection
const COLOR_PRESETS = [
  { name: "Green", color: "#DEF7EC", textColor: "#03543F", description: "Positive, success, active" },
  { name: "Amber", color: "#FDF2E2", textColor: "#92400E", description: "Warning, attention, new" },
  { name: "Red", color: "#FDE8E8", textColor: "#9B1C1C", description: "Alert, hot sale, exclusive" },
  { name: "Blue", color: "#E1EFFE", textColor: "#1E429F", description: "Informative, trust, features" },
  { name: "Violet", color: "#EDEBFE", textColor: "#5521B5", description: "Premium, trending, featured" },
  { name: "Zinc", color: "#F4F4F5", textColor: "#18181B", description: "Neutral, default status" },
]

export function BadgesPage() {
  // Filters
  const [search, setSearch] = useState("")

  // Queries
  const { data, isLoading } = useBadgesQuery({ search: search || undefined })
  const badges = data?.badges ?? []

  // Mutations
  const createMutation = useCreateBadgeMutation()
  const updateMutation = useUpdateBadgeMutation()
  const deleteMutation = useDeleteBadgeMutation()
  const setStatusMutation = useSetBadgeStatusMutation()

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<ProductBadge | null>(null)
  
  // Form State
  const [badgeName, setBadgeName] = useState("")
  const [badgeColor, setBadgeColor] = useState("#E4E4E7")
  const [badgeTextColor, setBadgeTextColor] = useState("#18181B")
  const [badgeStatus, setBadgeStatus] = useState<"active" | "inactive">("active")

  const handleOpenModal = (badge?: ProductBadge) => {
    if (badge) {
      setEditingBadge(badge)
      setBadgeName(badge.name)
      setBadgeColor(badge.color)
      setBadgeTextColor(badge.textColor)
      setBadgeStatus(badge.status === "deleted" ? "inactive" : badge.status)
    } else {
      setEditingBadge(null)
      setBadgeName("")
      setBadgeColor("#DEF7EC")
      setBadgeTextColor("#03543F")
      setBadgeStatus("active")
    }
    setModalOpen(true)
  }

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setBadgeColor(preset.color)
    setBadgeTextColor(preset.textColor)
  }

  const handleSaveBadge = () => {
    if (!badgeName.trim()) {
      toast.error("Badge name is required")
      return
    }

    const payload = {
      name: badgeName.trim(),
      color: badgeColor,
      textColor: badgeTextColor,
      status: badgeStatus,
    }

    if (editingBadge) {
      updateMutation.mutate(
        {
          badgeId: editingBadge.id,
          input: payload,
        },
        {
          onSuccess: () => {
            toast.success("Badge updated successfully")
            setModalOpen(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to update badge")
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Badge created successfully")
          setModalOpen(false)
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to create badge")
        },
      })
    }
  }

  const handleDeleteBadge = (badge: ProductBadge) => {
    if (confirm(`Are you sure you want to delete the badge "${badge.name}"?`)) {
      deleteMutation.mutate(badge.id, {
        onSuccess: () => {
          toast.success("Badge deleted successfully")
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to delete badge")
        },
      })
    }
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
          className="inline-flex items-center px-2.5 py-1 rounded text-xs font-extrabold tracking-wide uppercase transition-all duration-300 shadow-sm"
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
          <button
            onClick={() => handleToggleBadgeStatus(b)}
            disabled={setStatusMutation.isPending}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
              isActive
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
                : "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`}></span>
            {isActive ? "Active" : "Inactive"}
          </button>
        )
      },
    },
    {
      header: "Actions",
      className: "text-center w-[120px]",
      accessor: (b) => (
        <div className="flex justify-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => handleOpenModal(b)} className="cursor-pointer">
            <PencilSimpleIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDeleteBadge(b)}
            className="text-destructive hover:bg-destructive/5 hover:text-destructive cursor-pointer"
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Badges Management"
        description="Configure dynamic tag badges that can be pinned to products to indicate trending statuses, promotions, or features."
        primaryAction={{
          label: "Add Badge",
          onClick: () => handleOpenModal(),
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

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !isSaving && setModalOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparkleIcon className="size-5 text-amber-500" />
              {editingBadge ? "Edit Custom Badge" : "Create New Badge"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Live Badge Preview Area */}
            <div className="p-4 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col items-center justify-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Live Preview</span>
              <div className="min-h-8 flex items-center justify-center">
                <span
                  className="inline-flex items-center px-3 py-1 rounded text-xs font-extrabold tracking-wide uppercase transition-all duration-300 shadow-sm"
                  style={{
                    backgroundColor: badgeColor || "#DEF7EC",
                    color: badgeTextColor || "#03543F",
                  }}
                >
                  {badgeName.trim() || "PREVIEW PILL"}
                </span>
              </div>
            </div>

            {/* Quick Presets Selectors */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Preset Palette</Label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="flex flex-col items-center p-2 rounded-lg border text-left cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                  >
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase mb-1"
                      style={{
                        backgroundColor: preset.color,
                        color: preset.textColor,
                      }}
                    >
                      {preset.name}
                    </span>
                    <span className="text-[8px] text-muted-foreground leading-none text-center">
                      Preset colors
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Name Input */}
            <div className="space-y-1.5">
              <Label htmlFor="badge-name">Badge Name</Label>
              <Input
                id="badge-name"
                value={badgeName}
                onChange={(e) => setBadgeName(e.target.value)}
                placeholder="e.g. Best Seller, Trending, 20% OFF"
                maxLength={40}
              />
            </div>

            {/* Color Pickers & Hex Configs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="badge-color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="badge-color-picker"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-12 h-9 p-0.5 border cursor-pointer rounded-md shrink-0"
                  />
                  <Input
                    id="badge-color"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    placeholder="#DEF7EC"
                    maxLength={7}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="badge-text-color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="badge-text-color-picker"
                    value={badgeTextColor}
                    onChange={(e) => setBadgeTextColor(e.target.value)}
                    className="w-12 h-9 p-0.5 border cursor-pointer rounded-md shrink-0"
                  />
                  <Input
                    id="badge-text-color"
                    value={badgeTextColor}
                    onChange={(e) => setBadgeTextColor(e.target.value)}
                    placeholder="#03543F"
                    maxLength={7}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <Label htmlFor="badge-status">Status</Label>
              <select
                id="badge-status"
                value={badgeStatus}
                onChange={(e) => setBadgeStatus(e.target.value as any)}
                className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground"
              >
                <option value="active">Active (Available for products)</option>
                <option value="inactive">Inactive (Disabled)</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveBadge} disabled={isSaving} className="cursor-pointer">
              {isSaving && <CircleNotchIcon className="size-4 mr-2 animate-spin" />}
              {editingBadge ? "Save Changes" : "Create Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
