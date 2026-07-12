"use client"

import { FunnelIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface FilterOption {
  label: string
  value: string
}

export interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  
  status: string
  onStatusChange: (value: string) => void
  statusOptions: FilterOption[]
  statusLabel?: string

  // Clear handlers
  hasActiveFilters: boolean
  onClearAll: () => void
  activeFilterChips: Array<{ key: string; label: string; onClear: () => void }>
  
  children?: React.ReactNode
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  status,
  onStatusChange,
  statusOptions,
  statusLabel = "Status",
  hasActiveFilters,
  onClearAll,
  activeFilterChips,
  children,
}: FilterBarProps) {
  const selectedStatusLabel = statusOptions.find(o => o.value === status)?.label || "All"

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 min-w-0 items-stretch sm:items-center">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 size-4 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 rounded-xl border-zinc-200 dark:border-zinc-800"
            />
          </div>

          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="rounded-xl h-9 text-xs gap-1.5 cursor-pointer">
                  <FunnelIcon className="size-4 text-zinc-500" />
                  {statusLabel}: {selectedStatusLabel}
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={status} onValueChange={onStatusChange}>
                {statusOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {children}
        </div>
      </div>

      {/* Filter Chips row */}
      {hasActiveFilters && activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mr-1">
            Active Filters
          </span>
          {activeFilterChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="text-[11px] font-medium py-1 pl-2.5 pr-1.5 gap-1.5 rounded-full"
            >
              {chip.label}
              <button
                onClick={chip.onClear}
                className="hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            onClick={onClearAll}
            className="text-[11px] font-semibold h-7 px-3 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
