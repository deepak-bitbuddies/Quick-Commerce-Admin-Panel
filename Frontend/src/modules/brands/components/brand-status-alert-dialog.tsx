"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CircleNotchIcon } from "@phosphor-icons/react"

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
import type { ApiErrorPayload } from "@/lib/axios"
import { useUpdateBrandStatusMutation } from "../hooks/use-brands"
import type { Brand } from "../types/brand"

interface BrandStatusAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: Brand | null
}

export function BrandStatusAlertDialog({
  open,
  onOpenChange,
  brand,
}: BrandStatusAlertDialogProps) {
  const t = useTranslations("Brands")
  const { mutate, isPending } = useUpdateBrandStatusMutation()

  if (!brand) {
    return null
  }

  const isActivating = brand.status === "inactive"

  const handleConfirm = () => {
    mutate(
      {
        brandId: brand.id,
        input: { status: isActivating ? "active" : "inactive" },
      },
      {
        onSuccess: (updatedBrand) => {
          toast.success(
            isActivating
              ? t("activateSuccessTitle")
              : t("deactivateSuccessTitle"),
            {
              description: isActivating
                ? t("activateSuccessDescription", { name: updatedBrand.name })
                : t("deactivateSuccessDescription", {
                    name: updatedBrand.name,
                  }),
            }
          )
          onOpenChange(false)
        },
        onError: (error: ApiErrorPayload) => {
          toast.error(
            isActivating ? t("activateErrorTitle") : t("deactivateErrorTitle"),
            { description: error.message }
          )
        },
      }
    )
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) {
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActivating
              ? t("activateBrandTitle", { name: brand.name })
              : t("deactivateBrandTitle", { name: brand.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActivating
              ? t("activateBrandDescription")
              : t("deactivateBrandDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleConfirm}>
            {isPending && (
              <CircleNotchIcon className="size-4 animate-spin" />
            )}
            {isPending
              ? t("saving")
              : isActivating
                ? t("activate")
                : t("deactivate")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
