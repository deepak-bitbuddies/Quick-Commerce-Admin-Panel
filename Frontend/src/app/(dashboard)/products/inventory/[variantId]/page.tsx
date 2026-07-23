"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  ArrowLeftIcon,
  CircleNotchIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon,
  UserIcon,
  NoteIcon,
  SquaresFourIcon,
  ArrowsLeftRightIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  useVariantDetailQuery,
  useAdjustStockMutation,
  useTransferStockMutation,
  useStockHistoryQuery,
} from "@/modules/products/hooks/use-products"
import type { ApiErrorPayload } from "@/lib/axios"

// Zod schemas for the forms
const transferStockSchema = z.object({
  qty: z.coerce.number().int().positive("Transfer quantity must be positive"),
  direction: z.enum(["APP_TO_LOCAL", "LOCAL_TO_APP"]),
  reason: z.string().max(200).optional(),
})

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
  reason: z.string().max(200).optional(),
})

type TransferStockValues = z.infer<typeof transferStockSchema>
type AdjustStockValues = z.infer<typeof adjustStockSchema>

export default function VariantStockManagePage() {
  const router = useRouter()
  const { variantId } = useParams() as { variantId: string }

  // Queries & Mutations
  const { data: detailData, isLoading: isDetailLoading } = useVariantDetailQuery(variantId)
  const { data: history = [], isLoading: isHistoryLoading } = useStockHistoryQuery(variantId)

  const transferMutation = useTransferStockMutation()
  const adjustMutation = useAdjustStockMutation()

  // State for relative adjust mode
  const [adjustAction, setAdjustAction] = useState<"add" | "deduct">("add")

  // Forms setup
  const transferForm = useForm<TransferStockValues>({
    resolver: zodResolver(transferStockSchema) as any,
    defaultValues: {
      qty: 1,
      direction: "APP_TO_LOCAL",
      reason: "",
    }
  })

  const adjustForm = useForm<AdjustStockValues>({
    resolver: zodResolver(adjustStockSchema) as any,
    defaultValues: {
      qtyChanged: 1,
      type: "PURCHASE",
      poolAffected: "localStock",
      reason: "",
    }
  })

  // Set default type when action toggles
  useEffect(() => {
    adjustForm.setValue("type", adjustAction === "add" ? "PURCHASE" : "DAMAGE")
  }, [adjustAction, adjustForm])

  if (isDetailLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <CircleNotchIcon className="size-8 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading stock allocation details...</span>
      </div>
    )
  }

  if (!detailData) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/products/inventory")} className="cursor-pointer">
          <ArrowLeftIcon className="size-4 mr-1.5" /> Back to Inventory
        </Button>
        <div className="p-8 text-center border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
          <span className="text-sm font-semibold text-red-500">Variant SKU details not found or deleted.</span>
        </div>
      </div>
    )
  }

  const { variant, product } = detailData

  const handleAdjustActionChange = (action: "add" | "deduct") => {
    setAdjustAction(action)
  }

  const onTransferSubmit = transferForm.handleSubmit((values) => {
    transferMutation.mutate(
      {
        variantId,
        qty: values.qty,
        direction: values.direction,
        reason: values.reason || undefined,
        reference: "MANUAL_TRANSFER",
      },
      {
        onSuccess: () => {
          toast.success("Stock transferred successfully!")
          transferForm.reset({
            qty: 1,
            direction: values.direction,
            reason: "",
          })
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to transfer stock")
        },
      }
    )
  })

  const onAdjustSubmit = adjustForm.handleSubmit((values) => {
    const quantity = adjustAction === "deduct" ? -Math.abs(values.qtyChanged) : Math.abs(values.qtyChanged)
    adjustMutation.mutate(
      {
        variantId,
        qtyChanged: quantity,
        type: values.type,
        poolAffected: values.poolAffected,
        reason: values.reason || undefined,
        reference: "MANUAL_ADJUSTMENT",
      },
      {
        onSuccess: () => {
          toast.success("Relative stock adjustment ledger updated!")
          adjustForm.reset({
            qtyChanged: 1,
            type: adjustAction === "add" ? "PURCHASE" : "DAMAGE",
            poolAffected: values.poolAffected,
            reason: "",
          })
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to adjust stock level")
        },
      }
    )
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div className="space-y-0.5">
          <button
            onClick={() => router.push("/products/inventory")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer mb-2"
          >
            <ArrowLeftIcon className="size-3.5" /> Back to Inventory Control
          </button>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Manage SKU Stock Levels
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure mobile app reservation pools versus local physical retail shelves for variant <code className="font-mono text-foreground font-bold">{variant.sku}</code>.
          </p>
        </div>
      </div>

      {/* Info Overview Banner */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-xl bg-zinc-50 border dark:bg-zinc-900 flex items-center justify-center shrink-0">
                {product.primaryImage ? (
                  <img
                    src={product.primaryImage}
                    alt={product.name}
                    className="size-full rounded-xl object-cover"
                  />
                ) : (
                  <SquaresFourIcon className="size-8 text-zinc-400" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{product.name}</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                  Size: <span className="text-foreground">{variant.name}</span>
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border font-mono">
                    SKU: {variant.sku}
                  </span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/50 font-mono font-bold">
                    MRP: ₹{(variant.mrp / 100).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/50 font-mono font-bold">
                    Selling Price: ₹{(variant.sellingPrice / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 border-t md:border-t-0 pt-4 md:pt-0">
              <div className="px-4 py-2 border rounded-xl text-center bg-zinc-50/50 dark:bg-zinc-900/20">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">App Pool Stock</span>
                <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {variant.inventory?.appStock ?? 0}
                </div>
              </div>
              <div className="px-4 py-2 border rounded-xl text-center bg-zinc-50/50 dark:bg-zinc-900/20">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Local Shop Stock</span>
                <div className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                  {variant.inventory?.localStock ?? 0}
                </div>
              </div>
              <div className="px-4 py-2 border rounded-xl text-center bg-zinc-50/50 dark:bg-zinc-900/20">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Total Available</span>
                <div className="text-xl font-mono font-extrabold text-foreground mt-0.5">
                  {variant.inventory?.availableStock ?? 0}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Panel 1: Relative Adjust Stock (Add/Remove) */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Quick Adjust Stock (Add/Remove)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onAdjustSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleAdjustActionChange("add")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    adjustAction === "add"
                      ? "bg-white dark:bg-zinc-800 shadow text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <PlusIcon className="size-4" />
                  Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustActionChange("deduct")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    adjustAction === "deduct"
                      ? "bg-white dark:bg-zinc-800 shadow text-rose-600 dark:text-rose-400"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <MinusIcon className="size-4" />
                  Remove Stock
                </button>
              </div>

              <FieldGroup className="space-y-3">
                <Controller
                  name="qtyChanged"
                  control={adjustForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Quantity to {adjustAction === "add" ? "Add" : "Remove"} *</FieldLabel>
                      <Input {...field} type="number" min="1" placeholder="e.g. 10" />
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="poolAffected"
                  control={adjustForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Target Stock Pool *</FieldLabel>
                      <select
                        {...field}
                        className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                      >
                        <option value="localStock">Local Shelf Stock (localStock)</option>
                        <option value="appStock">Mobile App Stock (appStock)</option>
                      </select>
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="type"
                  control={adjustForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Audit Activity Code *</FieldLabel>
                      <select
                        {...field}
                        className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                      >
                        {adjustAction === "add" ? (
                          <>
                            <option value="PURCHASE">Supplier Purchase / Restock (PURCHASE)</option>
                            <option value="RETURN">Customer Return (RETURN)</option>
                            <option value="ORDER_CANCELLATION">Order Cancellation (ORDER_CANCELLATION)</option>
                            <option value="MANUAL_ADJUSTMENT">Manual Override Adjust (MANUAL_ADJUSTMENT)</option>
                          </>
                        ) : (
                          <>
                            <option value="DAMAGE">Damaged / Broken Product (DAMAGE)</option>
                            <option value="EXPIRY">Expired Product (EXPIRY)</option>
                            <option value="MANUAL_ADJUSTMENT">Manual Stock Correction (MANUAL_ADJUSTMENT)</option>
                          </>
                        )}
                      </select>
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="reason"
                  control={adjustForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Remarks / Audit Reason</FieldLabel>
                      <Input {...field} placeholder="Describe the reason for adjustment..." />
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )}
                />
              </FieldGroup>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={adjustForm.formState.isSubmitting || adjustMutation.isPending} className="cursor-pointer">
                  {(adjustForm.formState.isSubmitting || adjustMutation.isPending) && (
                    <CircleNotchIcon className="size-4 animate-spin mr-1.5" />
                  )}
                  Save Adjustment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Form Panel 2: Transfer Stock App ↔ Local */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Transfer App ↔ Local</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onTransferSubmit} className="space-y-4">
              <FieldGroup className="space-y-3">
                <Controller
                  name="qty"
                  control={transferForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Transfer Quantity *</FieldLabel>
                      <Input {...field} type="number" min="1" placeholder="e.g. 5" />
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="direction"
                  control={transferForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Transfer Direction *</FieldLabel>
                      <select
                        {...field}
                        className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                      >
                        <option value="APP_TO_LOCAL">Move App Stock ➔ Local Store Stock</option>
                        <option value="LOCAL_TO_APP">Move Local Store Stock ➔ App Stock</option>
                      </select>
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="reason"
                  control={transferForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Transfer Remarks</FieldLabel>
                      <Input {...field} placeholder="Reason for transfer (e.g. Counter demand)..." />
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )}
                />
              </FieldGroup>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={transferForm.formState.isSubmitting || transferMutation.isPending} className="cursor-pointer">
                  {(transferForm.formState.isSubmitting || transferMutation.isPending) && (
                    <CircleNotchIcon className="size-4 animate-spin mr-1.5" />
                  )}
                  Transfer Stock
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Stock History Audit Ledger Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <ClockIcon className="size-4" /> Stock Movement History Ledger
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Historical records of stock flows and manual override actions.</p>
          </div>
        </CardHeader>
        <CardContent>
          {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-xs gap-2">
              <CircleNotchIcon className="size-6 animate-spin text-amber-500" />
              Loading audit transactions...
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No transactions logged for this SKU yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                <thead>
                  <tr className="text-muted-foreground font-semibold text-left">
                    <th className="py-2 pr-4">Timestamp</th>
                    <th className="py-2 pr-4">Ledger Activity</th>
                    <th className="py-2 pr-4 text-center">Qty Changed</th>
                    <th className="py-2 pr-4 text-center">Prev Stock</th>
                    <th className="py-2 pr-4 text-center">New Stock</th>
                    <th className="py-2 text-left">Metadata Details & Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                  {history.map((tx) => {
                    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary"
                    let badgeClass = "capitalize py-0.5 text-[9px] font-bold tracking-wider"

                    if (["RESTOCK", "PURCHASE", "INITIAL_STOCK"].includes(tx.type)) {
                      badgeVariant = "default"
                    } else if (tx.type === "APP_SALE") {
                      badgeVariant = "outline"
                      badgeClass += " bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                    } else if (tx.type === "LOCAL_SALE") {
                      badgeVariant = "outline"
                      badgeClass += " bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                    } else if (["DAMAGE", "EXPIRY"].includes(tx.type)) {
                      badgeVariant = "destructive"
                    }

                    return (
                      <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                        <td className="py-3 pr-4 text-zinc-500 font-mono text-[10px] whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 font-semibold">
                          <Badge variant={badgeVariant} className={badgeClass}>
                            {tx.type.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className={`py-3 pr-4 text-center font-mono font-bold ${tx.qtyChanged > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {tx.qtyChanged > 0 ? `+${tx.qtyChanged}` : tx.qtyChanged}
                        </td>
                        <td className="py-3 pr-4 text-center font-mono text-muted-foreground">{tx.previousStock}</td>
                        <td className="py-3 pr-4 text-center font-mono font-semibold text-foreground">{tx.newStock}</td>
                        <td className="py-3">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
