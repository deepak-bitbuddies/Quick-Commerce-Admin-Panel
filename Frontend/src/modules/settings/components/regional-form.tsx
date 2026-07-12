"use client"

import { useForm, Controller } from "react-hook-form"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CircleNotch } from "@phosphor-icons/react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { useUpdateSettingsGroupMutation } from "../hooks/use-settings"
import { SettingGroup } from "../enums/settings-group"
import type { RegionalSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"
import { ScopeCard } from "./scope-card"

interface RegionalFormProps {
  initialValues: RegionalSettings
}

const selectClass = "flex h-8 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function RegionalForm({ initialValues }: RegionalFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit } = useForm<RegionalSettings>({
    defaultValues: initialValues,
  })

  const onSubmit = handleSubmit((values) => {
    mutate(
      { groupId: SettingGroup.REGIONAL, values },
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
          <CardTitle>{t("regionalTitle")}</CardTitle>
          <CardDescription>{t("regionalDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <FieldSet>
              <h3 className="text-sm font-semibold text-foreground border-b pb-1.5 mb-3">
                {t("regional.currencySection")}
              </h3>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Controller
                    name="currency"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.currency")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. INR" />
                      </Field>
                    )}
                  />

                  <Controller
                    name="currencySymbol"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.currencySymbol")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. ₹" />
                      </Field>
                    )}
                  />

                  <Controller
                    name="decimalPlaces"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.decimalPlaces")}</FieldLabel>
                        <select
                          {...field}
                          id={field.name}
                          className={selectClass}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        >
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <h3 className="text-sm font-semibold text-foreground border-b pb-1.5 mb-3">
                {t("regional.datetimeSection")}
              </h3>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Controller
                    name="timezone"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.timezone")}</FieldLabel>
                        <select {...field} id={field.name} className={selectClass}>
                          <option value="Asia/Kolkata">India (GMT+5:30)</option>
                          <option value="UTC">Coordinated Universal Time (UTC)</option>
                          <option value="America/New_York">New York (EST/EDT)</option>
                          <option value="Europe/London">London (GMT/BST)</option>
                        </select>
                      </Field>
                    )}
                  />

                  <Controller
                    name="dateFormat"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.dateFormat")}</FieldLabel>
                        <select {...field} id={field.name} className={selectClass}>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        </select>
                      </Field>
                    )}
                  />

                  <Controller
                    name="timeFormat"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.timeFormat")}</FieldLabel>
                        <select {...field} id={field.name} className={selectClass}>
                          <option value="12h">12-hour (1:00 PM)</option>
                          <option value="24h">24-hour (13:00)</option>
                        </select>
                      </Field>
                    )}
                  />
                </div>
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
