"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  CircleNotchIcon,
  ImageIcon,
  NotePencilIcon,
  StorefrontIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import type { ApiErrorPayload } from "@/lib/axios"
import {
  useCreateBrandMutation,
  useUpdateBrandMutation,
} from "../hooks/use-brands"
import {
  brandFormSchema,
  type BrandFormInput,
  type BrandFormOutput,
} from "../schema/brand-schema"
import type { Brand } from "../types/brand"

const BRAND_FORM_ID = "brand-form"

interface BrandFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present -> edit mode, pre-filled from the row's already-fetched data. Absent -> create mode. */
  brand?: Brand
}

function defaultValuesFor(brand?: Brand): BrandFormInput {
  return {
    name: brand?.name ?? "",
    logo: brand?.logo ?? "",
    description: brand?.description ?? "",
  }
}

export function BrandFormDialog({
  open,
  onOpenChange,
  brand,
}: BrandFormDialogProps) {
  const t = useTranslations("Brands")
  const isEditMode = Boolean(brand)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<BrandFormInput, unknown, BrandFormOutput>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: defaultValuesFor(brand),
  })

  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(brand))
    }
    // Only re-sync when the dialog opens (or the target brand changes while open).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, brand?.id])

  const createMutation = useCreateBrandMutation()
  const updateMutation = useUpdateBrandMutation()
  const { isPending } = isEditMode ? updateMutation : createMutation

  const onSubmit = handleSubmit((values) => {
    if (isEditMode && brand) {
      // Edit mode must be able to explicitly clear an already-set logo/
      // description, which the backend distinguishes from "leave alone" by
      // `null` vs. an omitted key (see Backend's brands/repository.ts). The
      // form's own schema transforms an emptied field to `undefined` (the
      // right default for create), so here — and only here — an emptied
      // field is re-mapped to `null` before the update request goes out.
      const input = {
        name: values.name,
        logo: values.logo ?? null,
        description: values.description ?? null,
      }
      updateMutation.mutate(
        { brandId: brand.id, input },
        {
          onSuccess: (updatedBrand) => {
            toast.success(t("updateSuccessTitle"), {
              description: t("updateSuccessDescription", {
                name: updatedBrand.name,
              }),
            })
            onOpenChange(false)
          },
          onError: (error: ApiErrorPayload) => {
            toast.error(t("updateErrorTitle"), { description: error.message })
          },
        }
      )
      return
    }

    createMutation.mutate(values, {
      onSuccess: (createdBrand) => {
        toast.success(t("createSuccessTitle"), {
          description: t("createSuccessDescription", {
            name: createdBrand.name,
          }),
        })
        onOpenChange(false)
      },
      onError: (error: ApiErrorPayload) => {
        toast.error(t("createErrorTitle"), { description: error.message })
      },
    })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting || isPending) {
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editBrandTitle") : t("createBrandTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t("editBrandDescription")
              : t("createBrandDescription")}
          </DialogDescription>
        </DialogHeader>

        <form id={BRAND_FORM_ID} onSubmit={onSubmit} noValidate>
          <FieldSet>
            <FieldGroup>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      <StorefrontIcon className="size-4" />
                      {t("nameLabel")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder={t("namePlaceholder")}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={[
                          {
                            message: fieldState.error?.message
                              ? t(`validation.${fieldState.error.message}`)
                              : undefined,
                          },
                        ]}
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="logo"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      <ImageIcon className="size-4" />
                      {t("logoLabel")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="url"
                      placeholder={t("logoPlaceholder")}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={[
                          {
                            message: fieldState.error?.message
                              ? t(`validation.${fieldState.error.message}`)
                              : undefined,
                          },
                        ]}
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      <NotePencilIcon className="size-4" />
                      {t("descriptionLabel")}
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      placeholder={t("descriptionPlaceholder")}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={[
                          {
                            message: fieldState.error?.message
                              ? t(`validation.${fieldState.error.message}`)
                              : undefined,
                          },
                        ]}
                      />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" form={BRAND_FORM_ID} disabled={isSubmitting || isPending}>
            {isPending && <CircleNotchIcon className="size-4 animate-spin" />}
            {isPending
              ? t("saving")
              : isEditMode
                ? t("saveChanges")
                : t("createBrand")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
