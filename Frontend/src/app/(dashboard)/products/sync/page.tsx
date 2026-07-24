"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  UploadSimpleIcon,
  ArrowLeftIcon,
  CircleNotchIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  FileCsvIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { useSyncStockMutation } from "@/modules/products/hooks/use-products"
import type { StockSyncResult } from "@/modules/products/types/product"
import type { ApiErrorPayload } from "@/lib/axios"

export default function StockSyncPage() {
  const router = useRouter()
  const syncMutation = useSyncStockMutation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [syncReport, setSyncReport] = useState<StockSyncResult | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith(".csv")) {
        setSelectedFile(file)
        setSyncReport(null)
      } else {
        toast.error("Please upload a valid CSV file (.csv)")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.endsWith(".csv")) {
        setSelectedFile(file)
        setSyncReport(null)
      } else {
        toast.error("Please upload a valid CSV file (.csv)")
      }
    }
  }

  const handleSyncSubmit = () => {
    if (!selectedFile) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const csvText = event.target?.result as string
      if (!csvText) {
        toast.error("CSV file is empty")
        return
      }

      syncMutation.mutate(csvText, {
        onSuccess: (data) => {
          toast.success("Stock synchronization complete!")
          setSyncReport(data)
          setSelectedFile(null)
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to parse and synchronize CSV file")
        },
      })
    }
    reader.readAsText(selectedFile)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => router.push("/products")}
          className="cursor-pointer"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Sync Stock (Marg ERP)</h1>
          <p className="text-xs text-muted-foreground">
            Synchronize stock quantity levels and selling prices directly between your physical shop and client apps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Upload Marg ERP Stock CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
              }`}
            >
              <input
                type="file"
                id="csv-file-input"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileCsvIcon className="size-12 text-muted-foreground mb-3" />
              
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Drag and drop your ERP stock report here, or{" "}
                    <label
                      htmlFor="csv-file-input"
                      className="text-blue-500 hover:underline cursor-pointer"
                    >
                      browse local files
                    </label>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Marg ERP Export format (.csv) only
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <span className="text-xs text-muted-foreground">
              Required headers: <code className="font-mono bg-muted p-1 rounded">SKU</code>, <code className="font-mono bg-muted p-1 rounded">Stock</code>
            </span>
            <Button
              onClick={handleSyncSubmit}
              disabled={!selectedFile || syncMutation.isPending}
              className="cursor-pointer"
            >
              {syncMutation.isPending && <CircleNotchIcon className="size-4 animate-spin mr-1" />}
              Sync Stock Levels
            </Button>
          </CardFooter>
        </Card>

        {/* Documentation details */}
        <Card className="p-4 bg-zinc-50 dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sync Instructions</h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-disc pl-4">
              <li>Export inventory balances report from Marg ERP to CSV format.</li>
              <li>Ensure columns like <code>SKU_Code</code> (or <code>Item_Code</code>) and <code>Stock_Qty</code> (or <code>Stock</code>) are present.</li>
              <li>You can also include <code>MRP</code> and <code>Rate_A</code> columns to overwrite catalog pricing.</li>
              <li>Decimal values will be multiplied by 100 on upload.</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Sync report results logger */}
      {syncReport && (
        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="flex flex-row items-center gap-3">
            <CheckCircleIcon className="size-8 text-emerald-500" />
            <div>
              <CardTitle className="text-sm font-semibold">Synchronization Report</CardTitle>
              <p className="text-xs text-muted-foreground">CSV sync completed successfully</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg flex-1">
                <p className="text-xs text-emerald-600 font-semibold mb-1">Matched & Synced</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">
                  {syncReport.matchedCount}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg flex-1">
                <p className="text-xs text-amber-600 font-semibold mb-1">Unmatched / Warnings</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-500">
                  {syncReport.unmatchedCount}
                </p>
              </div>
            </div>

            {syncReport.unmatchedList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  <WarningCircleIcon className="size-4" />
                  Unmatched Lines Log
                </h3>
                <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                      <TableRow>
                        <TableHead className="px-4 py-2 text-left text-xs font-bold text-muted-foreground">Line</TableHead>
                        <TableHead className="px-4 py-2 text-left text-xs font-bold text-muted-foreground">Identifier</TableHead>
                        <TableHead className="px-4 py-2 text-left text-xs font-bold text-muted-foreground">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {syncReport.unmatchedList.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="px-4 py-2 font-mono text-muted-foreground">{err.line}</TableCell>
                          <TableCell className="px-4 py-2 font-mono">
                            {err.sku ? `SKU: ${err.sku}` : "N/A"}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-amber-600">{err.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
