"use client"

import * as React from "react"
import { CircleNotchIcon } from "@phosphor-icons/react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export interface ReasonInputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  placeholder?: string
  confirmLabel?: React.ReactNode
  cancelLabel?: React.ReactNode
  onConfirm: (reason: string) => Promise<void> | void
  isLoading?: boolean
}

export function ReasonInputDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder = "Enter reason...",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isLoading = false,
}: ReasonInputDialogProps) {
  const [reason, setReason] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setReason("")
    }
  }, [open])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    await onConfirm(reason)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleConfirm} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="archive-reason" className="sr-only">Reason</Label>
            <Textarea
              id="archive-reason"
              placeholder={placeholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
              required
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="cursor-pointer"
            >
              {isLoading && (
                <CircleNotchIcon className="size-4 mr-2 animate-spin" />
              )}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
