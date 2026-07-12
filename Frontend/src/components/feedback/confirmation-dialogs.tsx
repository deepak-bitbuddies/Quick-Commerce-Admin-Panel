"use client"

import { ConfirmationDialog, ConfirmationDialogProps } from "./confirmation-dialog"

export interface DeleteConfirmationDialogProps
  extends Omit<ConfirmationDialogProps, "variant" | "title" | "confirmLabel"> {
  title?: React.ReactNode
  confirmLabel?: React.ReactNode
}

export function DeleteConfirmationDialog({
  title = "Delete Record?",
  description,
  confirmLabel = "Delete",
  ...props
}: DeleteConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      variant="destructive"
      {...props}
    />
  )
}

export interface ArchiveConfirmationDialogProps
  extends Omit<ConfirmationDialogProps, "variant" | "title" | "confirmLabel"> {
  title?: React.ReactNode
  confirmLabel?: React.ReactNode
}

export function ArchiveConfirmationDialog({
  title = "Archive Record?",
  description,
  confirmLabel = "Archive",
  ...props
}: ArchiveConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      variant="default"
      {...props}
    />
  )
}
