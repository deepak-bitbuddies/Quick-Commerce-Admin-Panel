"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ReceiptIcon,
  PlusIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDebounce } from "@/hooks/use-debounce"
import {
  DataTable,
  FilterBar,
  Pagination,
  type ColumnDef,
} from "@/components/tables"
import { DEFAULT_PAGE_SIZE } from "@/constants"
import { useTaxRatesQuery, useDeleteTaxRateMutation } from "@/modules/tax-rates/hooks/use-tax-rates"
import type { TaxRate } from "@/modules/tax-rates/types/tax-rate"
import { TaxRateDialog } from "@/modules/tax-rates/components/tax-rate-dialog"
import type { ApiErrorPayload } from "@/lib/axios"

function buildHref(
  pathname: string,
  currentParams: URLSearchParams,
  updates: Record<string, string | null>
): string {
  const next = new URLSearchParams(currentParams.toString())
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
  }
  return `${pathname}?${next.toString()}`
}

export default function TaxRatesDashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Pagination & URL query state
  const page = Number(searchParams.get("page") ?? "1")
  const pageSize = Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE))
  const searchParam = searchParams.get("search") ?? ""

  const [searchInput, setSearchInput] = useState(searchParam)
  const debouncedSearch = useDebounce(searchInput, 300)

  // Dialog and selected item states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null)

  const handleFilterChange = (updates: Record<string, string | null>) => {
    router.push(buildHref(pathname, searchParams, { ...updates, page: null }))
  }

  const queryParams = {
    page,
    pageSize,
    search: searchParam || undefined,
  }

  const { data, isLoading } = useTaxRatesQuery(queryParams)
  const deleteMutation = useDeleteTaxRateMutation()

  const taxRates = data?.nodes ?? []

  const handleCreateClick = () => {
    setSelectedTaxRate(null)
    setDialogOpen(true)
  }

  const handleEditClick = (rate: TaxRate) => {
    setSelectedTaxRate(rate)
    setDialogOpen(true)
  }

  const handleDeleteClick = (rate: TaxRate) => {
    if (confirm(`Are you sure you want to delete the tax rate "${rate.name}"?`)) {
      deleteMutation.mutate(rate.id, {
        onSuccess: () => {
          toast.success("Tax rate deleted successfully")
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to delete tax rate")
        },
      })
    }
  }

  const columns: ColumnDef<TaxRate>[] = [
    {
      header: "Tax Rate Label",
      className: "font-semibold text-foreground",
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <ReceiptIcon className="size-4.5 text-zinc-500" />
          <span>{r.name}</span>
        </div>
      ),
    },
    {
      header: "CGST (%)",
      className: "font-mono",
      accessor: (r) => `${r.cgst}%`,
    },
    {
      header: "SGST (%)",
      className: "font-mono",
      accessor: (r) => `${r.sgst}%`,
    },
    {
      header: "IGST (%)",
      className: "font-mono text-emerald-600 font-semibold",
      accessor: (r) => `${r.igst}%`,
    },
    {
      header: "Cess (%)",
      className: "font-mono text-muted-foreground",
      accessor: (r) => `${r.cess}%`,
    },
    {
      header: "Description / Notes",
      className: "text-muted-foreground max-w-[200px] truncate",
      accessor: (r) => r.description || "-",
    },
    {
      header: "Actions",
      className: "text-center w-20",
      accessor: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <DotsThreeIcon weight="bold" className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditClick(r)} className="cursor-pointer">
              <PencilSimpleIcon className="mr-2 size-4" />
              Edit details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => handleDeleteClick(r)} className="cursor-pointer">
              <TrashIcon className="mr-2 size-4" />
              Delete rate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Rates & Compliance"
        description="Configure CGST, SGST, IGST, and Cess tax rates for product catalog billing."
        primaryAction={{
          label: "Add Tax Rate",
          onClick: handleCreateClick,
          icon: <PlusIcon />,
        }}
      />

      <FilterBar
        search={searchInput}
        onSearchChange={(val) => {
          setSearchInput(val)
          handleFilterChange({ search: val || null })
        }}
        searchPlaceholder="Search tax rates by name..."
        hasActiveFilters={Boolean(searchParam)}
        onClearAll={() => {
          router.push(pathname)
          setSearchInput("")
        }}
        activeFilterChips={[]}
      />

      <Card className="p-0">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={taxRates}
            isLoading={isLoading}
            getRowId={(r) => r.id}
            emptyTitle="No tax rates found"
            emptyDescription="Tax rate classes are missing or do not match selected filters."
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

      <TaxRateDialog open={dialogOpen} onOpenChange={setDialogOpen} taxRate={selectedTaxRate} />
    </div>
  )
}
