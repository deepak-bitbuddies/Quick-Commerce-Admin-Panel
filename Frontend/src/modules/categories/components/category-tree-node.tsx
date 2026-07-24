"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  CaretRightIcon,
  FolderIcon,
  FolderOpenIcon,
  SparkleIcon,
  CalendarIcon,
  TicketIcon,
  PencilSimpleIcon,
  TrashIcon,
  CheckCircleIcon,
  PowerIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CatalogNodeType,
  CatalogNodeStatus,
  type CatalogNodeTreeNode,
} from "../types/category-types"

interface CategoryTreeNodeProps {
  node: CatalogNodeTreeNode
  onEdit: (node: CatalogNodeTreeNode) => void
  onDelete: (node: CatalogNodeTreeNode) => void
  onToggleStatus: (node: CatalogNodeTreeNode) => void
}

export function CategoryTreeNode({
  node,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategoryTreeNodeProps) {
  const t = useTranslations("Categories")
  const [expanded, setExpanded] = useState(false)
  const hasChildren = node.children && node.children.length > 0

  const getNodeIcon = () => {
    switch (node.type) {
      case CatalogNodeType.COLLECTION:
        return <SparkleIcon className="size-4 text-purple-500" />
      case CatalogNodeType.SEASONAL:
        return <CalendarIcon className="size-4 text-emerald-500" />
      case CatalogNodeType.PROMOTIONAL:
        return <TicketIcon className="size-4 text-rose-500" />
      default:
        return expanded ? (
          <FolderOpenIcon className="size-4 text-amber-500" />
        ) : (
          <FolderIcon className="size-4 text-amber-500" />
        )
    }
  }

  const getStatusBadge = () => {
    switch (node.status) {
      case CatalogNodeStatus.INACTIVE:
        return (
          <Badge variant="outline" className="bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
            Inactive
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-400">
            Active
          </Badge>
        )
    }
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded} className="space-y-1.5">
      {/* Node Row container */}
      <div
        className={cn(
          "flex items-center justify-between group/row p-2 rounded-xl transition-all border border-transparent",
          "hover:bg-zinc-50 hover:border-zinc-200/50 dark:hover:bg-zinc-900 dark:hover:border-zinc-800/50"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Collapse/Expand toggle arrow */}
          <CollapsibleTrigger
            render={
              <button
                type="button"
                disabled={!hasChildren}
                className={cn(
                  "p-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer",
                  !hasChildren && "opacity-0 pointer-events-none"
                )}
              />
            }
          >
            <CaretRightIcon
              className={cn(
                "size-3.5 transition-transform duration-200 ease-in-out text-zinc-500",
                expanded && "rotate-90"
              )}
            />
            <span className="sr-only">
              {expanded ? "Collapse node" : "Expand node"}
            </span>
          </CollapsibleTrigger>

          {/* Node Category Icon */}
          <span className="shrink-0">{getNodeIcon()}</span>

          {/* Category Details */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5 min-w-0">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">
              {node.name}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 truncate uppercase">
              {node.code}
            </span>
          </div>

          {/* Featured tag */}
          {node.isFeatured && (
            <Badge variant="outline" className="bg-yellow-50/50 border-yellow-200 text-yellow-600 text-[9px] px-1 py-0 rounded dark:bg-yellow-950/20 dark:border-yellow-900/50 dark:text-yellow-500">
              Featured
            </Badge>
          )}
        </div>

        {/* Indicators and Actions */}
        <div className="flex items-center gap-3 shrink-0 pl-4">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
              Order: {node.sortOrder}
            </span>
            <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
              Products: {node.productCount}
            </span>
            {hasChildren && (
              <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                Sub: {node.children.length}
              </span>
            )}
          </div>

          <div>{getStatusBadge()}</div>

          {/* Row actions */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                  <DotsThreeIcon weight="bold" className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(node)} className="cursor-pointer">
                <PencilSimpleIcon className="mr-2 size-4" />
                {t("editNode")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {node.status === CatalogNodeStatus.INACTIVE && (
                <DropdownMenuItem onClick={() => onToggleStatus(node)} className="cursor-pointer">
                  <CheckCircleIcon className="mr-2 size-4 text-emerald-500" />
                  Activate
                </DropdownMenuItem>
              )}
              {node.status === CatalogNodeStatus.ACTIVE && (
                <DropdownMenuItem onClick={() => onToggleStatus(node)} className="cursor-pointer">
                  <PowerIcon className="mr-2 size-4" />
                  Deactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(node)} className="cursor-pointer">
                <TrashIcon className="mr-2 size-4" />
                {t("deleteNode")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Recursive children drawer */}
      {hasChildren && (
        <CollapsibleContent>
          <div className="pl-6 border-l-2 border-zinc-100 dark:border-zinc-800 ml-3 space-y-1.5 pt-0.5">
            {node.children.map((child) => (
              <CategoryTreeNode
                key={child.id}
                node={child}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
