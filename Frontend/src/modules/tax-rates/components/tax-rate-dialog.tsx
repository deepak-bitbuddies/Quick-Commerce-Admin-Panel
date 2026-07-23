"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CircleNotchIcon } from "@phosphor-icons/react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useCreateTaxRateMutation, useUpdateTaxRateMutation } from "../hooks/use-tax-rates"
import type { TaxRate } from "../types/tax-rate"
import type { ApiErrorPayload } from "@/lib/axios"

const taxRateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sgst: z.coerce.number().nonnegative("SGST must be 0 or positive").max(100, "SGST cannot exceed 100"),
  cgst: z.coerce.number().nonnegative("CGST must be 0 or positive").max(100, "CGST cannot exceed 100"),
  igst: z.coerce.number().nonnegative("IGST must be 0 or positive").max(100, "IGST cannot exceed 100"),
  cess: z.coerce.number().nonnegative("Cess must be 0 or positive").max(100, "Cess cannot exceed 100").default(0),
  description: z.string().optional(),
})

type TaxRateFormValues = z.infer<typeof taxRateFormSchema>

interface TaxRateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxRate?: TaxRate | null
}

export function TaxRateDialog({ open, onOpenChange, taxRate }: TaxRateDialogProps) {
  const createMutation = useCreateTaxRateMutation()
  const updateMutation = useUpdateTaxRateMutation()
  const isEdit = Boolean(taxRate)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<TaxRateFormValues>({
    resolver: zodResolver(taxRateFormSchema) as any,
    defaultValues: {
      name: "",
      sgst: 0,
      cgst: 0,
      igst: 0,
      cess: 0,
      description: "",
    },
  })

  // Sync data when editing
  useEffect(() => {
    if (open) {
      if (taxRate) {
        reset({
          name: taxRate.name,
          sgst: taxRate.sgst,
          cgst: taxRate.cgst,
          igst: taxRate.igst,
          cess: taxRate.cess,
          description: taxRate.description || "",
        })
      } else {
        reset({
          name: "",
          sgst: 0,
          cgst: 0,
          igst: 0,
          cess: 0,
          description: "",
        })
      }
    }
  }, [open, taxRate, reset])

  const onSubmit = handleSubmit((values) => {
    if (isEdit && taxRate) {
      updateMutation.mutate(
        {
          taxRateId: taxRate.id,
          input: {
            ...values,
            description: values.description || null,
          },
        },
        {
          onSuccess: () => {
            toast.success("Tax rate updated successfully!")
            onOpenChange(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to update tax rate")
          },
        }
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Tax rate created successfully!")
          onOpenChange(false)
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to create tax rate")
        },
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {isEdit ? "Edit Tax Rate" : "Add Tax Rate"}
          </DialogTitle>
          <div className="text-xs text-muted-foreground">
            Configure GST percentages for Catalog compliance mapping.
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2" noValidate>
          <FieldGroup className="space-y-3">
            {/* Tax Rate Name */}
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tax Rate Label / Name *</FieldLabel>
                  <Input {...field} placeholder="e.g. GST 18%, Exempted" />
                  {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                </Field>
              )}
            />

            {/* CGST & SGST */}
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="cgst"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Central GST (CGST %) *</FieldLabel>
                    <Input {...field} type="number" placeholder="0" className="font-mono" />
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />

              <Controller
                name="sgst"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>State GST (SGST %) *</FieldLabel>
                    <Input {...field} type="number" placeholder="0" className="font-mono" />
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />
            </div>

            {/* IGST & Cess */}
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="igst"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Integrated GST (IGST %) *</FieldLabel>
                    <Input {...field} type="number" placeholder="0" className="font-mono" />
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />

              <Controller
                name="cess"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Cess %</FieldLabel>
                    <Input {...field} type="number" placeholder="0" className="font-mono" />
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />
            </div>

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Description / Audit Note</FieldLabel>
                  <Input {...field} placeholder="e.g. Standard tax rate for groceries" />
                  {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending} className="cursor-pointer">
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                <CircleNotchIcon className="size-4 animate-spin mr-1" />
              )}
              {isEdit ? "Save Changes" : "Create Tax Rate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
