"use client"

import {
  Pagination as UIPagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const fromRecord = total === 0 ? 0 : (page - 1) * pageSize + 1
  const toRecord = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      {/* Left side range description */}
      <div className="text-xs text-zinc-500 font-medium order-2 sm:order-1">
        Showing <span className="text-zinc-800 dark:text-zinc-200">{fromRecord}</span>–
        <span className="text-zinc-800 dark:text-zinc-200">{toRecord}</span> of{" "}
        <span className="text-zinc-800 dark:text-zinc-200">{total}</span> records
      </div>

      <div className="flex items-center gap-4 order-1 sm:order-2">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Per Page:
          </label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer font-medium"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* UIPagination Controls */}
        <UIPagination className="w-auto m-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault()
                  if (page > 1) onPageChange(page - 1)
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                aria-disabled={page <= 1}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-xs text-zinc-500 font-medium px-2">
                Page {page} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault()
                  if (page < totalPages) onPageChange(page + 1)
                }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                aria-disabled={page >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </UIPagination>
      </div>
    </div>
  )
}
