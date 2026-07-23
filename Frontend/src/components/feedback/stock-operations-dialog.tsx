"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CircleNotchIcon, PlusIcon, MinusIcon, ArrowsLeftRightIcon } from "@phosphor-icons/react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const adjustStockFormSchema = z.object({
  qtyChanged: z.coerce.number().int().positive("Quantity must be a positive integer"),
  type: z.string().min(1, "Transaction type is required"),
  poolAffected: z.enum(["appStock", "localStock"]),
  reason: z.string().optional(),
  reference: z.string().optional(),
})

const transferStockFormSchema = z.object({
  qtyChanged: z.coerce.number().int().positive("Quantity must be a positive integer"),
  transferDirection: z.enum(["app_to_local", "local_to_app"]),
  reason: z.string().optional(),
})

export interface StockOperationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "adjust" | "transfer"
  variantName: string
  sku: string
  appStock: number
  localStock: number
  availableStock: number
  reservedStock?: number
  onConfirm: (payload: any) => Promise<void> | void
  isLoading?: boolean
}

export function StockOperationsDialog({
  open,
  onOpenChange,
  mode,
  variantName,
  sku,
  appStock,
  localStock,
  availableStock,
  reservedStock = 0,
  onConfirm,
  isLoading = false,
}: StockOperationsDialogProps) {
  const [actionType, setActionType] = React.useState<"add" | "deduct">("add")

  const formSchema = mode === "adjust" ? adjustStockFormSchema : transferStockFormSchema

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qtyChanged: "",
      type: "PURCHASE",
      poolAffected: "localStock",
      transferDirection: "local_to_app",
      reason: "",
      reference: "",
    },
  })

  // Sync types based on actionType
  const handleActionChange = (action: "add" | "deduct") => {
    setActionType(action)
    setValue("type", action === "add" ? "PURCHASE" : "DAMAGE")
  }

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      reset({
        qtyChanged: "",
        type: actionType === "add" ? "PURCHASE" : "DAMAGE",
        poolAffected: "localStock",
        transferDirection: "local_to_app",
        reason: "",
        reference: "",
      })
    }
  }, [open, mode, actionType, reset])

  const onSubmit = async (data: any) => {
    // For adjust mode, handle quantity sign change
    const multiplier = actionType === "deduct" ? -1 : 1
    const payload =
      mode === "adjust"
        ? {
            qtyChanged: data.qtyChanged * multiplier,
            type: data.type,
            poolAffected: data.poolAffected,
            reason: data.reason,
            reference: data.reference,
          }
        : {
            qtyChanged: data.qtyChanged,
            transferDirection: data.transferDirection,
            reason: data.reason,
          }

    await onConfirm(payload)
  }

  const poolAffectedValue = watch("poolAffected")
  const transferDirectionValue = watch("transferDirection")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "adjust" ? (
              <>
                <ArrowsLeftRightIcon className="size-5 text-amber-500" />
                Adjust Stock Balance
              </>
            ) : (
              <>
                <ArrowsLeftRightIcon className="size-5 text-emerald-500" />
                Transfer Stock Pools
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Updating SKU Variant: <strong className="text-foreground">{variantName}</strong> ({sku})
          </DialogDescription>
        </DialogHeader>

        {/* Current stock status panel */}
        <div className="grid grid-cols-4 gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg text-center text-xs font-semibold mb-2">
          <div className="border-r border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-muted-foreground block mb-0.5">App Stock</span>
            <span className="font-mono text-sm text-foreground">{appStock}</span>
          </div>
          <div className="border-r border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Local Stock</span>
            <span className="font-mono text-sm text-foreground">{localStock}</span>
          </div>
          <div className="border-r border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Reserved</span>
            <span className="font-mono text-sm text-zinc-500">{reservedStock}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Available</span>
            <span className="font-mono text-sm text-amber-600 font-bold">{availableStock}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {mode === "adjust" ? (
            <>
              {/* Action buttons (Add / Deduct) */}
              <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleActionChange("add")}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    actionType === "add"
                      ? "bg-white dark:bg-zinc-800 shadow text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                  disabled={isLoading}
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
                  disabled={isLoading}
                >
                  <MinusIcon className="size-3.5" />
                  Remove Stock
                </button>
              </div>

              {/* Pool Affected Select */}
              <div className="space-y-1.5">
                <Label htmlFor="poolAffected" className="text-xs font-bold">Target Stock Pool</Label>
                <select
                  id="poolAffected"
                  value={poolAffectedValue}
                  onChange={(e) => setValue("poolAffected", e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                >
                  <option value="localStock">Local Stock Pool</option>
                  <option value="appStock">App Stock Pool (Online Store)</option>
                </select>
              </div>

              {/* Transaction Type Select */}
              <div className="space-y-1.5">
                <Label htmlFor="tx-type" className="text-xs font-bold">Transaction Type / Reason Code</Label>
                <select
                  id="tx-type"
                  value={watch("type")}
                  onChange={(e) => setValue("type", e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                >
                  {actionType === "add" ? (
                    <>
                      <option value="PURCHASE">Purchase / Restock</option>
                      <option value="RETURN">Customer Return</option>
                      <option value="MANUAL_ADJUSTMENT">Manual Adjustment In</option>
                    </>
                  ) : (
                    <>
                      <option value="DAMAGE">Damaged / Spoiled Goods</option>
                      <option value="EXPIRY">Expired Product</option>
                      <option value="MANUAL_ADJUSTMENT">Manual Adjustment Out</option>
                    </>
                  )}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Transfer direction selection */}
              <div className="space-y-1.5">
                <Label htmlFor="transferDirection" className="text-xs font-bold">Transfer Direction</Label>
                <select
                  id="transferDirection"
                  value={transferDirectionValue}
                  onChange={(e) => setValue("transferDirection", e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                >
                  <option value="local_to_app">Local Stock &rarr; App Stock (Move to Digital Store)</option>
                  <option value="app_to_local">App Stock &rarr; Local Stock (Move to Shelves)</option>
                </select>
              </div>
            </>
          )}

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <Label htmlFor="qtyChanged" className="text-xs font-bold">Quantity (Units)</Label>
            <Input
              id="qtyChanged"
              type="number"
              min="1"
              step="1"
              {...register("qtyChanged")}
              disabled={isLoading}
            />
            {errors.qtyChanged && (
              <span className="text-[10px] text-rose-500 font-bold block">{errors.qtyChanged.message as string}</span>
            )}
          </div>

          {/* Reference Input */}
          {mode === "adjust" && (
            <div className="space-y-1.5">
              <Label htmlFor="reference" className="text-xs font-bold">Reference Doc # (e.g. Invoice / PO)</Label>
              <Input
                id="reference"
                placeholder="e.g. PO-99882"
                {...register("reference")}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Reason text */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-bold">Notes / Audit Remarks</Label>
            <Textarea
              id="reason"
              rows={2}
              placeholder="Provide context for this stock adjustment audit ledger entry..."
              {...register("reason")}
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={`cursor-pointer ${mode === "adjust" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white font-bold"}`}
            >
              {isLoading && <CircleNotchIcon className="size-3.5 mr-1.5 animate-spin" />}
              {mode === "adjust" ? "Execute Adjustment" : "Transfer Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
