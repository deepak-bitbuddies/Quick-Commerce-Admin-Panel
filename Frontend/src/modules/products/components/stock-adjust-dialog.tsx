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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useAdjustStockMutation,
  useStockHistoryQuery,
  useTransferStockMutation,
} from "../hooks/use-products"
import type { Product, ProductVariant } from "../types/product"
import type { ApiErrorPayload } from "@/lib/axios"
import { StockTransferDirection } from "../enums/stock-transfer-direction"

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
          <Tabs
            value={actionType}
            onValueChange={(value) => handleActionChange(value as "add" | "deduct")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="add" className="text-xs font-bold data-active:text-emerald-600 dark:data-active:text-emerald-400">
                <PlusIcon className="size-3.5" />
                Add Stock
              </TabsTrigger>
              <TabsTrigger value="deduct" className="text-xs font-bold data-active:text-rose-600 dark:data-active:text-rose-400">
                <MinusIcon className="size-3.5" />
                Remove Stock
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={[
                      { value: "localStock", label: "Local Store Stock (localStock)" },
                      { value: "appStock", label: "App Store Stock (appStock)" },
                    ]}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="localStock">Local Store Stock (localStock)</SelectItem>
                      <SelectItem value="appStock">App Store Stock (appStock)</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={
                      actionType === "add"
                        ? [
                            { value: "PURCHASE", label: "Supplier Restock / Purchase (PURCHASE)" },
                            { value: "RETURN", label: "Customer Return (RETURN)" },
                            { value: "ORDER_CANCELLATION", label: "Order Cancellation (ORDER_CANCELLATION)" },
                            { value: "MANUAL_ADJUSTMENT", label: "Manual adjustment / Restock (MANUAL_ADJUSTMENT)" },
                          ]
                        : [
                            { value: "DAMAGE", label: "Broken / Damaged Stock (DAMAGE)" },
                            { value: "EXPIRY", label: "Expired Product (EXPIRY)" },
                            { value: "MANUAL_ADJUSTMENT", label: "Manual Shrinkage Correct (MANUAL_ADJUSTMENT)" },
                          ]
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionType === "add" ? (
                        <>
                          <SelectItem value="PURCHASE">Supplier Restock / Purchase (PURCHASE)</SelectItem>
                          <SelectItem value="RETURN">Customer Return (RETURN)</SelectItem>
                          <SelectItem value="ORDER_CANCELLATION">Order Cancellation (ORDER_CANCELLATION)</SelectItem>
                          <SelectItem value="MANUAL_ADJUSTMENT">Manual adjustment / Restock (MANUAL_ADJUSTMENT)</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="DAMAGE">Broken / Damaged Stock (DAMAGE)</SelectItem>
                          <SelectItem value="EXPIRY">Expired Product (EXPIRY)</SelectItem>
                          <SelectItem value="MANUAL_ADJUSTMENT">Manual Shrinkage Correct (MANUAL_ADJUSTMENT)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
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
            <Table className="text-xs">
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900 sticky top-0">
                <TableRow>
                  <TableHead className="text-muted-foreground font-semibold">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Activity</TableHead>
                  <TableHead className="text-center text-muted-foreground font-semibold">Change</TableHead>
                  <TableHead className="text-center text-muted-foreground font-semibold">Balance</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Author / Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <CalendarBlankIcon className="size-3.5" />
                          {dateStr}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        <Badge variant={badgeColor} className={customBadgeClass}>
                          {tx.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-center font-mono font-bold ${tx.qtyChanged > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.qtyChanged > 0 ? `+${tx.qtyChanged}` : tx.qtyChanged}
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold text-zinc-500">
                        {tx.newStock}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400">
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
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const transferStockSchema = z.object({
  qty: z.coerce.number().int().positive("Transfer quantity must be positive"),
  direction: z.nativeEnum(StockTransferDirection),
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
      direction: StockTransferDirection.APP_TO_LOCAL,
      reason: "",
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        qty: 1,
        direction: StockTransferDirection.APP_TO_LOCAL,
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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={[
                      { value: StockTransferDirection.APP_TO_LOCAL, label: "Move App Stock ➔ Local Store Stock" },
                      { value: StockTransferDirection.LOCAL_TO_APP, label: "Move Local Store Stock ➔ App Stock" },
                    ]}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={StockTransferDirection.APP_TO_LOCAL}>Move App Stock ➔ Local Store Stock</SelectItem>
                      <SelectItem value={StockTransferDirection.LOCAL_TO_APP}>Move Local Store Stock ➔ App Stock</SelectItem>
                    </SelectContent>
                  </Select>
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
