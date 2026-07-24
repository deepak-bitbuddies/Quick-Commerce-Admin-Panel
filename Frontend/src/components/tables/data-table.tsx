"use client"

import { ReactNode, useState, Fragment } from "react"
import { ListIcon, CaretRightIcon } from "@phosphor-icons/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ColumnDef<T> {
  header: ReactNode
  accessor: (row: T, index: number) => ReactNode
  className?: string
  headClassName?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading: boolean
  
  // Selection
  selectedIds?: string[]
  onSelectRow?: (id: string, checked: boolean) => void
  onSelectAll?: (checked: boolean) => void
  getRowId?: (row: T) => string
  
  // Collapsible detail subrow
  renderSubRow?: (row: T) => ReactNode
  
  // Custom Empty/Loading
  emptyTitle?: string
  emptyDescription?: string
  loadingRowCount?: number
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  getRowId,
  renderSubRow,
  emptyTitle = "No Results Found",
  emptyDescription = "There are no records matching your active filters.",
  loadingRowCount = 5,
}: DataTableProps<T>) {
  const showCheckbox = Boolean(onSelectRow && onSelectAll && getRowId)
  const totalCols = columns.length + (showCheckbox ? 1 : 0) + (renderSubRow ? 1 : 0)

  // Track expanded rows by ID
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))
  }

  const handleSelectAllChange = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {renderSubRow && <TableHead className="w-10" />}
          {showCheckbox && (
            <TableHead className="w-10">
              <Checkbox
                checked={data.length > 0 && selectedIds.length === data.length}
                onCheckedChange={(checked) => handleSelectAllChange(checked === true)}
                aria-label="Select all rows"
              />
            </TableHead>
          )}
          {columns.map((col, idx) => (
            <TableHead key={idx} className={col.headClassName || col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: loadingRowCount }).map((_, idx) => (
            <TableRow key={idx}>
              {Array.from({ length: totalCols }).map((_, cIdx) => (
                <TableCell key={cIdx}>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={totalCols} className="text-center py-12">
              <ListIcon className="size-12 mx-auto text-zinc-300 mb-3" />
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{emptyTitle}</h3>
              <p className="text-xs text-zinc-400 mt-1">{emptyDescription}</p>
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, rIdx) => {
            const rowId = getRowId ? getRowId(row) : String(rIdx)
            const isSelected = selectedIds.includes(rowId)
            const isExpanded = expandedRows[rowId] ?? false

            return (
              <Fragment key={rowId}>
                <TableRow
                  className={isSelected ? "bg-zinc-50/50 dark:bg-zinc-900/50" : ""}
                >
                  {renderSubRow && (
                    <TableCell className="w-10">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRow(rowId)}
                        className="size-6"
                        aria-expanded={isExpanded}
                      >
                        <CaretRightIcon
                          className={cn(
                            "size-3.5 text-zinc-500 transition-transform duration-200 ease-in-out",
                            isExpanded && "rotate-90"
                          )}
                        />
                        <span className="sr-only">
                          {isExpanded ? "Collapse row" : "Expand row"}
                        </span>
                      </Button>
                    </TableCell>
                  )}
                  {showCheckbox && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          onSelectRow && onSelectRow(rowId, checked === true)
                        }
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx} className={col.className}>
                      {col.accessor(row, rIdx)}
                    </TableCell>
                  ))}
                </TableRow>
                {renderSubRow && isExpanded && (
                  <TableRow className="bg-zinc-50/30 dark:bg-zinc-950/20 hover:bg-zinc-50/30 dark:hover:bg-zinc-950/20 border-t-0">
                    <TableCell colSpan={totalCols} className="p-0">
                      <div className="px-6 py-4 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                        {renderSubRow(row)}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
