"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  CircleNotchIcon,
  PlusIcon,
  MinusIcon,
  CalendarBlankIcon,
  UserIcon,
  NoteIcon,
  ArrowsLeftRightIcon,
} from "@phosphor-icons/react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import {
  useAdjustStockMutation,
  useStockHistoryQuery,
  useTransferStockMutation,
} from "../hooks/use-products"
import type { Product, ProductVariant } from "../types/product"
import type { ApiErrorPayload } from "@/lib/axios"

const adjustStockSchema = z.object({
  qtyChanged: z.coerce
    .number()
    .int("Quantity must be an integer")
    .refine((val) => val > 0, "Stock change quantity must be positive"),
  type: z.enum([
    "INITIAL_STOCK",
    "PURCHASE",
    "RETURN",
    "DAMAGE",
    "EXPIRY",
    "TRANSFER",
    "MANUAL_ADJUSTMENT",
    "APP_SALE",
    "LOCAL_SALE",
    "ORDER_CANCELLATION",
  ]),
  poolAffected: z.enum(["appStock", "localStock"]),
  reason: z.string().max(500).optional(),
})

type AdjustStockValues = z.infer<typeof adjustStockSchema>

interface StockAdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  variant: ProductVariant | null
}

export function StockAdjustDialog({
  open,
  onOpenChange,
  product,
  variant,
}: StockAdjustDialogProps) {
  const adjustMutation = useAdjustStockMutation()
  const [actionType, setActionType] = useState<"add" | "deduct">("add")

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<AdjustStockValues>({
    resolver: zodResolver(adjustStockSchema) as any,
    defaultValues: {
      qtyChanged: 1,
      type: "PURCHASE",
      poolAffected: "localStock",
      reason: "",
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        qtyChanged: 1,
        type: actionType === "add" ? "PURCHASE" : "DAMAGE",
        poolAffected: "localStock",
        reason: "",
      })
    }
  }, [open, actionType, reset])

  if (!product || !variant) return null

  const handleActionChange = (type: "add" | "deduct") => {
    setActionType(type)
    setValue("type", type === "add" ? "PURCHASE" : "DAMAGE")
  }

  const onSubmit = handleSubmit((values) => {
    // Quantities to subtract from stock must be sent as negative numbers
    const quantity = actionType === "deduct" ? -Math.abs(values.qtyChanged) : Math.abs(values.qtyChanged)

    adjustMutation.mutate(
      {
        variantId: variant.id,
        qtyChanged: quantity,
        type: values.type,
        poolAffected: values.poolAffected,
        reason: values.reason || undefined,
        reference: "MANUAL_ADJUSTMENT",
      },
      {
        onSuccess: () => {
          toast.success("Stock count adjusted successfully!")
          reset()
          onOpenChange(false)
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to adjust stock level")
        },
      }
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Adjust Variant Stock Balance</DialogTitle>
          <div className="text-xs text-muted-foreground">
            {product.name} ({variant.name}) • SKU: <code className="font-mono text-foreground font-semibold">{variant.sku}</code>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {/* Action selection */}
          <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <button
              type="button"
              onClick={() => handleActionChange("add")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                actionType === "add"
                  ? "bg-white dark:bg-zinc-800 shadow text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <PlusIcon className="size-3.5" />
              Add Stock
            </button>
            <button
              type="button"
              onClick={() => handleActionChange("deduct")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                actionType === "deduct"
                  ? "bg-white dark:bg-zinc-800 shadow text-rose-600 dark:text-rose-400"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <MinusIcon className="size-3.5" />
              Remove Stock
            </button>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Current Available Stock</span>
            <div className="text-2xl font-mono font-bold text-foreground">{variant.inventory?.availableStock ?? 0} Units</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              App Stock: {variant.inventory?.appStock ?? 0} | Local Stock: {variant.inventory?.localStock ?? 0}
            </div>
          </div>

          <FieldGroup className="space-y-3">
            {/* Quantity */}
            <Controller
              name="qtyChanged"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Quantity to {actionType === "add" ? "Add" : "Deduct"}</FieldLabel>
                  <Input {...field} type="number" min="1" placeholder="e.g. 50" />
                  {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                </Field>
              )}
            />

            {/* Target Pool selector */}
            <Controller
              name="poolAffected"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Target Stock Pool *</FieldLabel>
                  <select
                    {...field}
                    className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground"
                  >
                    <option value="localStock">Local Store Stock (localStock)</option>
                    <option value="appStock">App Store Stock (appStock)</option>
                  </select>
                  {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                </Field>
              )}
            />

            {/* Type */}
            <Controller
              name="type"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Adjustment Reason Type</FieldLabel>
                  <select
                    {...field}
                    className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground"
                  >
                    {actionType === "add" ? (
                      <>
                        <option value="PURCHASE">Supplier Restock / Purchase (PURCHASE)</option>
                        <option value="RETURN">Customer Return (RETURN)</option>
                        <option value="ORDER_CANCELLATION">Order Cancellation (ORDER_CANCELLATION)</option>
                        <option value="MANUAL_ADJUSTMENT">Manual adjustment / Restock (MANUAL_ADJUSTMENT)</option>
                      </>
                    ) : (
                      <>
                        <option value="DAMAGE">Broken / Damaged Stock (DAMAGE)</option>
                        <option value="EXPIRY">Expired Product (EXPIRY)</option>
                        <option value="MANUAL_ADJUSTMENT">Manual Shrinkage Correct (MANUAL_ADJUSTMENT)</option>
                      </>
                    )}
                  </select>
                  {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                </Field>
              )}
            />

            {/* Reason text */}
            <Controller
              name="reason"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Remarks / Audit Notes</FieldLabel>
                  <Input {...field} placeholder="e.g. Received batch #202, Expired box" />
                  {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || adjustMutation.isPending} className="cursor-pointer">
              {(isSubmitting || adjustMutation.isPending) && (
                <CircleNotchIcon className="size-4 animate-spin mr-1" />
              )}
              Confirm Adjust
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface StockHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  variant: ProductVariant | null
}

export function StockHistoryDialog({
  open,
  onOpenChange,
  product,
  variant,
}: StockHistoryDialogProps) {
  const { data: history, isLoading } = useStockHistoryQuery(variant?.id || "")

  if (!product || !variant) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">SKU Stock Ledger Audit Trail</DialogTitle>
          <div className="text-xs text-muted-foreground">
            {product.name} ({variant.name}) • SKU: <code className="font-mono text-foreground font-semibold">{variant.sku}</code>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-xs gap-2">
              <CircleNotchIcon className="size-6 animate-spin text-amber-500" />
              Loading audit transactions...
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground text-xs">
              No stock movements recorded yet for this SKU variant.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900 font-semibold text-muted-foreground sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 text-left">Timestamp</th>
                  <th className="px-4 py-2.5 text-left">Activity</th>
                  <th className="px-4 py-2.5 text-center">Change</th>
                  <th className="px-4 py-2.5 text-center">Balance</th>
                  <th className="px-4 py-2.5 text-left">Author / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {history.map((tx) => {
                  const dateStr = new Date(tx.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })

                  let badgeColor: "default" | "secondary" | "destructive" | "outline" = "secondary"
                  let customBadgeClass = "text-[9px] uppercase font-bold tracking-wider"

                  if (["RESTOCK", "PURCHASE", "INITIAL_STOCK"].includes(tx.type)) {
                    badgeColor = "default"
                  } else if (["DAMAGE", "EXPIRY"].includes(tx.type)) {
                    badgeColor = "destructive"
                  } else if (tx.type === "APP_SALE") {
                    badgeColor = "outline"
                    customBadgeClass += " bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                  } else if (tx.type === "LOCAL_SALE") {
                    badgeColor = "outline"
                    customBadgeClass += " bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <CalendarBlankIcon className="size-3.5" />
                          {dateStr}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <Badge variant={badgeColor} className={customBadgeClass}>
                          {tx.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-center font-mono font-bold ${tx.qtyChanged > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.qtyChanged > 0 ? `+${tx.qtyChanged}` : tx.qtyChanged}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-zinc-500">
                        {tx.newStock}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-medium text-[10px] text-zinc-700 dark:text-zinc-300">
                            <UserIcon className="size-3" />
                            {tx.createdBy === "seeder" ? "System Seeder" : tx.createdBy}
                          </div>
                          {tx.reason && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground italic">
                              <NoteIcon className="size-3.5" />
                              {tx.reason}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const transferStockSchema = z.object({
  qty: z.coerce.number().int().positive("Transfer quantity must be positive"),
  direction: z.enum(["APP_TO_LOCAL", "LOCAL_TO_APP"]),
  reason: z.string().max(200).optional(),
})

type TransferStockValues = z.infer<typeof transferStockSchema>

interface StockTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  variant: ProductVariant | null
}

export function StockTransferDialog({
  open,
  onOpenChange,
  product,
  variant,
}: StockTransferDialogProps) {
  const transferMutation = useTransferStockMutation()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TransferStockValues>({
    resolver: zodResolver(transferStockSchema) as any,
    defaultValues: {
      qty: 1,
      direction: "APP_TO_LOCAL",
      reason: "",
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        qty: 1,
        direction: "APP_TO_LOCAL",
        reason: "",
      })
    }
  }, [open, reset])

  if (!product || !variant) return null

  const onSubmit = handleSubmit((values) => {
    transferMutation.mutate(
      {
        variantId: variant.id,
        qty: values.qty,
        direction: values.direction,
        reason: values.reason || undefined,
        reference: "MANUAL_TRANSFER",
      },
      {
        onSuccess: () => {
          toast.success("Stock transferred successfully!")
          reset()
          onOpenChange(false)
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to transfer stock")
        },
      }
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Transfer Stock Pools</DialogTitle>
          <div className="text-xs text-muted-foreground">
            {product.name} ({variant.name}) • SKU: <code className="font-mono text-foreground font-semibold">{variant.sku}</code>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 flex justify-around text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">App Stock</span>
              <div className="text-lg font-mono font-bold text-emerald-600">{variant.inventory?.appStock ?? 0}</div>
            </div>
            <div className="flex items-center text-zinc-300">
              <ArrowsLeftRightIcon className="size-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Local Stock</span>
              <div className="text-lg font-mono font-bold text-amber-600">{variant.inventory?.localStock ?? 0}</div>
            </div>
          </div>

          <FieldGroup className="space-y-3">
            {/* Quantity */}
            <Controller
              name="qty"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Transfer Quantity</FieldLabel>
                  <Input {...field} type="number" min="1" placeholder="e.g. 10" />
                  {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                </Field>
              )}
            />

            {/* Direction */}
            <Controller
              name="direction"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Transfer Direction</FieldLabel>
                  <select
                    {...field}
                    className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground"
                  >
                    <option value="APP_TO_LOCAL">Move App Stock ➔ Local Store Stock</option>
                    <option value="LOCAL_TO_APP">Move Local Store Stock ➔ App Stock</option>
                  </select>
                  {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                </Field>
              )}
            />

            {/* Remarks */}
            <Controller
              name="reason"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Transfer Remarks</FieldLabel>
                  <Input {...field} placeholder="e.g. Moving for local weekend sale demand" />
                  {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || transferMutation.isPending} className="cursor-pointer">
              {(isSubmitting || transferMutation.isPending) && (
                <CircleNotchIcon className="size-4 animate-spin mr-1" />
              )}
              Transfer Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
