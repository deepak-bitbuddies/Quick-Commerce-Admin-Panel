"use client"

import { useForm, Controller } from "react-hook-form"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CircleNotch } from "@phosphor-icons/react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldSet, FieldDescription } from "@/components/ui/field"
import { useUpdateSettingsGroupMutation } from "../hooks/use-settings"
import { SettingGroup } from "../enums/settings-group"
import type { LocalizationSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"
import { ScopeCard } from "./scope-card"

interface LocalizationFormProps {
  initialValues: LocalizationSettings
}

const selectClass = "flex h-8 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function LocalizationForm({ initialValues }: LocalizationFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit } = useForm<LocalizationSettings>({
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
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t("localization.defaultLanguage")}</FieldLabel>
                      <select {...field} id={field.name} className={selectClass}>
                        <option value="en">English (en)</option>
                        <option value="hi">Hindi (hi)</option>
                      </select>
                    </Field>
                  )}
                />

                <Controller
                  name="availability.admin"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("localization.availabilityAdmin")}</FieldLabel>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value?.includes("en")}
                            className="size-4 shrink-0 rounded border-border"
                            onChange={(e) => {
                              const nextVal = e.target.checked
                                ? [...(field.value || []), "en"]
                                : (field.value || []).filter((l) => l !== "en")
                              field.onChange(nextVal)
                            }}
                          />
                          <span>English (en)</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value?.includes("hi")}
                            className="size-4 shrink-0 rounded border-border"
                            onChange={(e) => {
                              const nextVal = e.target.checked
                                ? [...(field.value || []), "hi"]
                                : (field.value || []).filter((l) => l !== "hi")
                              field.onChange(nextVal)
                            }}
                          />
                          <span>Hindi (hi)</span>
                        </label>
                      </div>
                      <FieldDescription>{t("localization.availabilityAdminDesc")}</FieldDescription>
                    </Field>
                  )}
                />

                <Controller
                  name="availability.customer"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("localization.availabilityCustomer")}</FieldLabel>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value?.includes("en")}
                            className="size-4 shrink-0 rounded border-border"
                            onChange={(e) => {
                              const nextVal = e.target.checked
                                ? [...(field.value || []), "en"]
                                : (field.value || []).filter((l) => l !== "en")
                              field.onChange(nextVal)
                            }}
                          />
                          <span>English (en)</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value?.includes("hi")}
                            className="size-4 shrink-0 rounded border-border"
                            onChange={(e) => {
                              const nextVal = e.target.checked
                                ? [...(field.value || []), "hi"]
                                : (field.value || []).filter((l) => l !== "hi")
                              field.onChange(nextVal)
                            }}
                          />
                          <span>Hindi (hi)</span>
                        </label>
                      </div>
                      <FieldDescription>{t("localization.availabilityCustomerDesc")}</FieldDescription>
                    </Field>
                  )}
                />

                <Controller
                  name="availability.delivery"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("localization.availabilityDelivery")}</FieldLabel>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value?.includes("en")}
                            className="size-4 shrink-0 rounded border-border"
                            onChange={(e) => {
                              const nextVal = e.target.checked
                                ? [...(field.value || []), "en"]
                                : (field.value || []).filter((l) => l !== "en")
                              field.onChange(nextVal)
                            }}
                          />
                          <span>English (en)</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value?.includes("hi")}
                            className="size-4 shrink-0 rounded border-border"
                            onChange={(e) => {
                              const nextVal = e.target.checked
                                ? [...(field.value || []), "hi"]
                                : (field.value || []).filter((l) => l !== "hi")
                              field.onChange(nextVal)
                            }}
                          />
                          <span>Hindi (hi)</span>
                        </label>
                      </div>
                      <FieldDescription>{t("localization.availabilityDeliveryDesc")}</FieldDescription>
                    </Field>
                  )}
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
