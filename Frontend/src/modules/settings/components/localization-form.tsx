"use client"

import { useForm, Controller, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CircleNotch } from "@phosphor-icons/react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet, FieldDescription } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateSettingsGroupMutation } from "../hooks/use-settings"
import { SettingGroup } from "../enums/settings-group"
import type { LocalizationSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"
import { ScopeCard } from "./scope-card"

// No `.min(1)` on the availability arrays: the previous `rules={{ required: true }}`
// never actually enforced "at least one language" (an empty array is truthy in JS),
// so that was never a real business rule in effect here — not invented now either.
const localizationFormSchema = z.object({
  defaultLanguage: z.string().min(1, "Default language is required"),
  availability: z.object({
    admin: z.array(z.string()),
    customer: z.array(z.string()),
    delivery: z.array(z.string()),
  }),
})

type AvailabilityFieldName = "availability.admin" | "availability.customer" | "availability.delivery"

interface LanguageAvailabilityFieldProps {
  control: Control<LocalizationSettings>
  name: AvailabilityFieldName
  label: string
  description: string
}

function LanguageAvailabilityField({ control, name, label, description }: LanguageAvailabilityFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <div className="flex flex-wrap gap-4 mt-1">
            <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
              <Checkbox
                checked={field.value?.includes("en")}
                onCheckedChange={(checked) => {
                  const nextVal = checked
                    ? [...(field.value || []), "en"]
                    : (field.value || []).filter((l) => l !== "en")
                  field.onChange(nextVal)
                }}
              />
              <span>English (en)</span>
            </label>
            <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
              <Checkbox
                checked={field.value?.includes("hi")}
                onCheckedChange={(checked) => {
                  const nextVal = checked
                    ? [...(field.value || []), "hi"]
                    : (field.value || []).filter((l) => l !== "hi")
                  field.onChange(nextVal)
                }}
              />
              <span>Hindi (hi)</span>
            </label>
          </div>
          <FieldDescription>{description}</FieldDescription>
          {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
        </Field>
      )}
    />
  )
}

interface LocalizationFormProps {
  initialValues: LocalizationSettings
}

export function LocalizationForm({ initialValues }: LocalizationFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit } = useForm<LocalizationSettings>({
    resolver: zodResolver(localizationFormSchema),
    defaultValues: {
      defaultLanguage: initialValues.defaultLanguage || "en",
      availability: {
        admin: initialValues.availability?.admin || [],
        customer: initialValues.availability?.customer || [],
        delivery: initialValues.availability?.delivery || [],
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutate(
      { groupId: SettingGroup.LOCALIZATION, values },
      {
        onSuccess: () => {
          toast.success(t("saveSuccess"))
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(t("saveError"), { description: err.message })
        },
      }
    )
  })

  return (
    <div className="space-y-6">
      <ScopeCard admin customer delivery />

      <Card>
        <CardHeader>
          <CardTitle>{t("localizationTitle")}</CardTitle>
          <CardDescription>{t("localizationDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <FieldSet>
              <FieldGroup>
                <Controller
                  name="defaultLanguage"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t("localization.defaultLanguage")}</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={[
                          { value: "en", label: "English (en)" },
                          { value: "hi", label: "Hindi (hi)" },
                        ]}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English (en)</SelectItem>
                          <SelectItem value="hi">Hindi (hi)</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )}
                />

                <LanguageAvailabilityField
                  control={control}
                  name="availability.admin"
                  label={t("localization.availabilityAdmin")}
                  description={t("localization.availabilityAdminDesc")}
                />

                <LanguageAvailabilityField
                  control={control}
                  name="availability.customer"
                  label={t("localization.availabilityCustomer")}
                  description={t("localization.availabilityCustomerDesc")}
                />

                <LanguageAvailabilityField
                  control={control}
                  name="availability.delivery"
                  label={t("localization.availabilityDelivery")}
                  description={t("localization.availabilityDeliveryDesc")}
                />
              </FieldGroup>
            </FieldSet>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <CircleNotch className="size-4 animate-spin" />}
                {t("saveChanges")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
