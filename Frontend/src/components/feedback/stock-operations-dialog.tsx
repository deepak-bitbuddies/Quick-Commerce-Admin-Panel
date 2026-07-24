"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockTransferDirection } from "@/modules/products"

const adjustStockFormSchema = z.object({
  qtyChanged: z.coerce.number().int().positive("Quantity must be a positive integer"),
  type: z.string().min(1, "Transaction type is required"),
  poolAffected: z.enum(["appStock", "localStock"]),
  reason: z.string().optional(),
  reference: z.string().optional(),
})

const transferStockFormSchema = z.object({
  qtyChanged: z.coerce.number().int().positive("Quantity must be a positive integer"),
  transferDirection: z.nativeEnum(StockTransferDirection),
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
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qtyChanged: "",
      type: "PURCHASE",
      poolAffected: "localStock",
      transferDirection: StockTransferDirection.LOCAL_TO_APP,
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
        transferDirection: StockTransferDirection.LOCAL_TO_APP,
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
              <Tabs
                value={actionType}
                onValueChange={(value) => handleActionChange(value as "add" | "deduct")}
              >
                <TabsList className="w-full">
                  <TabsTrigger
                    value="add"
                    className="text-xs font-bold data-active:text-emerald-600 dark:data-active:text-emerald-400"
                    disabled={isLoading}
                  >
                    <PlusIcon className="size-3.5" />
                    Add Stock
                  </TabsTrigger>
                  <TabsTrigger
                    value="deduct"
                    className="text-xs font-bold data-active:text-rose-600 dark:data-active:text-rose-400"
                    disabled={isLoading}
                  >
                    <MinusIcon className="size-3.5" />
                    Remove Stock
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Pool Affected Select */}
              <div className="space-y-1.5">
                <Label htmlFor="poolAffected" className="text-xs font-bold">Target Stock Pool</Label>
                <Controller
                  name="poolAffected"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                      items={[
                        { value: "localStock", label: "Local Stock Pool" },
                        { value: "appStock", label: "App Stock Pool (Online Store)" },
                      ]}
                    >
                      <SelectTrigger id="poolAffected" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="localStock">Local Stock Pool</SelectItem>
                        <SelectItem value="appStock">App Stock Pool (Online Store)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Transaction Type Select */}
              <div className="space-y-1.5">
                <Label htmlFor="tx-type" className="text-xs font-bold">Transaction Type / Reason Code</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                      items={
                        actionType === "add"
                          ? [
                              { value: "PURCHASE", label: "Purchase / Restock" },
                              { value: "RETURN", label: "Customer Return" },
                              { value: "MANUAL_ADJUSTMENT", label: "Manual Adjustment In" },
                            ]
                          : [
                              { value: "DAMAGE", label: "Damaged / Spoiled Goods" },
                              { value: "EXPIRY", label: "Expired Product" },
                              { value: "MANUAL_ADJUSTMENT", label: "Manual Adjustment Out" },
                            ]
                      }
                    >
                      <SelectTrigger id="tx-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionType === "add" ? (
                          <>
                            <SelectItem value="PURCHASE">Purchase / Restock</SelectItem>
                            <SelectItem value="RETURN">Customer Return</SelectItem>
                            <SelectItem value="MANUAL_ADJUSTMENT">Manual Adjustment In</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="DAMAGE">Damaged / Spoiled Goods</SelectItem>
                            <SelectItem value="EXPIRY">Expired Product</SelectItem>
                            <SelectItem value="MANUAL_ADJUSTMENT">Manual Adjustment Out</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </>
          ) : (
            <>
              {/* Transfer direction selection */}
              <div className="space-y-1.5">
                <Label htmlFor="transferDirection" className="text-xs font-bold">Transfer Direction</Label>
                <Controller
                  name="transferDirection"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                      items={[
                        { value: StockTransferDirection.LOCAL_TO_APP, label: "Local Stock → App Stock (Move to Digital Store)" },
                        { value: StockTransferDirection.APP_TO_LOCAL, label: "App Stock → Local Stock (Move to Shelves)" },
                      ]}
                    >
                      <SelectTrigger id="transferDirection" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={StockTransferDirection.LOCAL_TO_APP}>Local Stock &rarr; App Stock (Move to Digital Store)</SelectItem>
                        <SelectItem value={StockTransferDirection.APP_TO_LOCAL}>App Stock &rarr; Local Stock (Move to Shelves)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
