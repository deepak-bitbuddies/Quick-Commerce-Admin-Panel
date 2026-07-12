"use client"

import { ReactNode } from "react"
import { ListIcon } from "@phosphor-icons/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  emptyTitle = "No Results Found",
  emptyDescription = "There are no records matching your active filters.",
  loadingRowCount = 5,
}: DataTableProps<T>) {
  const showCheckbox = Boolean(onSelectRow && onSelectAll && getRowId)
  const totalCols = columns.length + (showCheckbox ? 1 : 0)

  const handleSelectAllChange = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showCheckbox && (
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={data.length > 0 && selectedIds.length === data.length}
                onChange={(e) => handleSelectAllChange(e.target.checked)}
                className="size-3.5 accent-primary cursor-pointer rounded"
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
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded w-20" />
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

            return (
              <TableRow
                key={rowId}
                className={isSelected ? "bg-zinc-50/50 dark:bg-zinc-900/50" : ""}
              >
                {showCheckbox && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectRow && onSelectRow(rowId, e.target.checked)}
                      className="size-3.5 accent-primary cursor-pointer rounded"
                    />
                  </TableCell>
                )}
                {columns.map((col, cIdx) => (
                  <TableCell key={cIdx} className={col.className}>
                    {col.accessor(row, rIdx)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
