"use client"

import {
  CheckCircleIcon,
  ArchiveIcon,
  TrashIcon,
  PowerIcon,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

interface BulkActionsToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onActivate?: () => void
  onDeactivate?: () => void
  onArchive?: () => void
  onRestore?: () => void
  onDelete?: () => void
  isPending?: boolean
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onActivate,
  onDeactivate,
  onArchive,
  onRestore,
  onDelete,
  isPending = false,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xl px-5 py-3 rounded-full flex items-center gap-4 border dark:border-zinc-200 animate-in fade-in slide-in-from-bottom-3 duration-250 z-50">
      <span className="text-xs font-semibold whitespace-nowrap">
        {selectedCount} item(s) selected
      </span>
      <button
        onClick={onClearSelection}
        className="text-[10px] uppercase font-bold text-zinc-400 hover:text-zinc-200 dark:hover:text-zinc-700 cursor-pointer"
        disabled={isPending}
      >
        Clear
      </button>
      <div className="h-4 w-px bg-zinc-800 dark:bg-zinc-200" />
      <div className="flex gap-1.5 items-center">
        {onActivate && (
          <Button
            variant="ghost"
            onClick={onActivate}
            disabled={isPending}
            className="text-xs hover:bg-zinc-900 dark:hover:bg-zinc-100 rounded-full h-8 px-3 font-semibold cursor-pointer text-emerald-500 hover:text-emerald-400"
          >
            <CheckCircleIcon className="size-4 mr-1" />
            Activate
          </Button>
        )}
        {onDeactivate && (
          <Button
            variant="ghost"
            onClick={onDeactivate}
            disabled={isPending}
            className="text-xs hover:bg-zinc-900 dark:hover:bg-zinc-100 rounded-full h-8 px-3 font-semibold cursor-pointer text-zinc-400 hover:text-zinc-300"
          >
            <PowerIcon className="size-4 mr-1" />
            Deactivate
          </Button>
        )}
        {onArchive && (
          <Button
            variant="ghost"
            onClick={onArchive}
            disabled={isPending}
            className="text-xs hover:bg-zinc-900 dark:hover:bg-zinc-100 rounded-full h-8 px-3 font-semibold cursor-pointer text-amber-500 hover:text-amber-400"
          >
            <ArchiveIcon className="size-4 mr-1" />
            Archive
          </Button>
        )}
        {onRestore && (
          <Button
            variant="ghost"
            onClick={onRestore}
            disabled={isPending}
            className="text-xs hover:bg-zinc-900 dark:hover:bg-zinc-100 rounded-full h-8 px-3 font-semibold cursor-pointer text-teal-500 hover:text-teal-400"
          >
            <CheckCircleIcon className="size-4 mr-1" />
            Restore
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            onClick={onDelete}
            disabled={isPending}
            className="text-xs hover:bg-zinc-900 dark:hover:bg-zinc-100 text-rose-500 hover:text-rose-400 rounded-full h-8 px-3 font-semibold cursor-pointer"
          >
            <TrashIcon className="size-4 mr-1" />
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
