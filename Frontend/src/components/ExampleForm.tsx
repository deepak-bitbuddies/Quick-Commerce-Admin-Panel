"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { z } from "zod"
import {
  CircleNotchIcon,
  CurrencyInrIcon,
  PackageIcon,
  TagIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { createProduct } from "@/services/products"
import type { ApiErrorPayload } from "@/lib/axios"

const productFormSchema = z.object({
  name: z.string().min(2, "nameRequired"),
  price: z
    .string()
    .min(1, "priceInvalid")
    .refine((value) => Number(value) > 0, "priceInvalid")
    .transform((value) => Number(value)),
  category: z.string().min(1, "categoryRequired"),
})

type ProductFormInput = z.input<typeof productFormSchema>
type ProductFormOutput = z.output<typeof productFormSchema>

export function ExampleForm() {
  const t = useTranslations("ProductForm")
  const queryClient = useQueryClient()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormOutput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: "", price: "", category: "" },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      toast.success(t("successTitle"), {
        description: t("successDescription", { name: product.name }),
      })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      reset()
    },
    onError: (error: ApiErrorPayload) => {
      toast.error(t("errorTitle"), { description: error.message })
    },
  })

  const onSubmit = handleSubmit((values) => mutate(values))

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldSet>
        <FieldGroup>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  <PackageIcon className="size-4" />
                  {t("name")}
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
            name="price"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  <CurrencyInrIcon className="size-4" />
                  {t("price")}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  step="0.01"
                  placeholder={t("pricePlaceholder")}
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
            name="category"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  <TagIcon className="size-4" />
                  {t("category")}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder={t("categoryPlaceholder")}
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

          <Field orientation="horizontal">
            <Button type="submit" disabled={isSubmitting || isPending}>
              {isPending && (
                <CircleNotchIcon className="size-4 animate-spin" />
              )}
              {isPending ? t("submitting") : t("submit")}
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  )
}
