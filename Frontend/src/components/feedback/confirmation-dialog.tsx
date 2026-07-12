"use client"

import * as React from "react"
import { CircleNotch } from "@phosphor-icons/react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel: React.ReactNode
  cancelLabel?: React.ReactNode
  onConfirm: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
  isLoading?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  isLoading = false,
  variant = "default",
}: ConfirmationDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isLoading) {
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription render={<div />}>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading && (
              <CircleNotch className="size-4 animate-spin" aria-hidden="true" />
            )}
            <span>{confirmLabel}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
