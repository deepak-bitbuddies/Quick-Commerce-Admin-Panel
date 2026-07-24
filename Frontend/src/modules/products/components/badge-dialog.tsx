"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CircleNotchIcon } from "@phosphor-icons/react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateBadgeMutation, useUpdateBadgeMutation } from "../hooks/use-products"
import type { ProductBadge } from "../types/product"
import type { ApiErrorPayload } from "@/lib/axios"

const badgeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name cannot exceed 50 characters"),
  color: z.string().min(3, "Color is required").regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a valid hex color code"),
  textColor: z.string().min(3, "Text color is required").regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a valid hex color code"),
  status: z.enum(["active", "inactive"]).optional(),
})

type BadgeFormValues = z.infer<typeof badgeFormSchema>

interface BadgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  badge?: ProductBadge | null
}

const colorPresets = [
  { name: "Blue / Info", bg: "#DBEAFE", text: "#1E40AF" },
  { name: "Emerald / New", bg: "#D1FAE5", text: "#065F46" },
  { name: "Amber / Warning", bg: "#FEF3C7", text: "#92400E" },
  { name: "Red / Alert", bg: "#FEE2E2", text: "#991B1B" },
  { name: "Indigo / Promo", bg: "#E0E7FF", text: "#3730A3" },
  { name: "Charcoal / Dark", bg: "#1F2937", text: "#F9FAFB" },
]

export function BadgeDialog({ open, onOpenChange, badge }: BadgeDialogProps) {
  const createMutation = useCreateBadgeMutation()
  const updateMutation = useUpdateBadgeMutation()
  const isEdit = Boolean(badge)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeFormSchema) as any,
    defaultValues: {
      name: "",
      color: "#DBEAFE",
      textColor: "#1E40AF",
      status: "active",
    },
  })

  // Watch values for live preview rendering
  const nameValue = watch("name")
  const colorValue = watch("color")
  const textColorValue = watch("textColor")

  // Sync data when editing
  useEffect(() => {
    if (open) {
      if (badge) {
        reset({
          name: badge.name,
          color: badge.color,
          textColor: badge.textColor,
          status: badge.status === "deleted" ? "inactive" : badge.status,
        })
      } else {
        reset({
          name: "",
          color: "#DBEAFE",
          textColor: "#1E40AF",
          status: "active",
        })
      }
    }
  }, [open, badge, reset])

  const handlePresetSelect = (preset: { bg: string; text: string }) => {
    setValue("color", preset.bg)
    setValue("textColor", preset.text)
  }

  const onSubmit = handleSubmit((values) => {
    if (isEdit && badge) {
      updateMutation.mutate(
        {
          badgeId: badge.id,
          input: values,
        },
        {
          onSuccess: () => {
            toast.success("Badge updated successfully!")
            onOpenChange(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to update badge")
          },
        }
      )
    } else {
      createMutation.mutate(
        values,
        {
          onSuccess: () => {
            toast.success("Badge created successfully!")
            onOpenChange(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to create badge")
          },
        }
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {isEdit ? "Edit Product Badge" : "Create Product Badge"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Badge Name / Label</FieldLabel>
            <FieldGroup>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g. Bestseller, 20% OFF, New" />
                )}
              />
            </FieldGroup>
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>

          {/* Live Preview block */}
          <div className="p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Live Preview</span>
            <div
              style={{
                backgroundColor: colorValue,
                color: textColorValue,
              }}
              className="px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all border border-black/5"
            >
              {nameValue || "Badge Preview"}
            </div>
          </div>

          {/* Presets selector */}
          <div className="space-y-2">
            <FieldLabel>Color Presets</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {colorPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  style={{ backgroundColor: preset.bg, color: preset.text }}
                  className="px-2 py-1.5 rounded-lg text-[10px] font-bold border border-black/5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Background Color (Hex)</FieldLabel>
              <FieldGroup>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2 items-center w-full">
                      <input
                        type="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="size-8 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer p-0 bg-transparent shrink-0"
                      />
                      <Input {...field} placeholder="#HEXCODE" className="font-mono text-xs uppercase" />
                    </div>
                  )}
                />
              </FieldGroup>
              {errors.color && <FieldError>{errors.color.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Text Color (Hex)</FieldLabel>
              <FieldGroup>
                <Controller
                  name="textColor"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2 items-center w-full">
                      <input
                        type="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="size-8 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer p-0 bg-transparent shrink-0"
                      />
                      <Input {...field} placeholder="#HEXCODE" className="font-mono text-xs uppercase" />
                    </div>
                  )}
                />
              </FieldGroup>
              {errors.textColor && <FieldError>{errors.textColor.message}</FieldError>}
            </Field>
          </div>

          {isEdit && (
            <Field>
              <FieldLabel>Status</FieldLabel>
              <FieldGroup>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                      ]}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldGroup>
              {errors.status && <FieldError>{errors.status.message}</FieldError>}
            </Field>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <CircleNotchIcon className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Badge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
