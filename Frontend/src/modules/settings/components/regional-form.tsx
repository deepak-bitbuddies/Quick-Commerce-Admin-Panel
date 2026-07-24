"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CircleNotch } from "@phosphor-icons/react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateSettingsGroupMutation } from "../hooks/use-settings"
import { SettingGroup } from "../enums/settings-group"
import type { RegionalSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"
import { ScopeCard } from "./scope-card"

const regionalFormSchema = z.object({
  currency: z.string().min(1, "Currency is required"),
  currencySymbol: z.string().min(1, "Currency symbol is required"),
  decimalPlaces: z.number().int().min(0, "Decimal places is required"),
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  timeFormat: z.enum(["12h", "24h"]),
})

interface RegionalFormProps {
  initialValues: RegionalSettings
}

export function RegionalForm({ initialValues }: RegionalFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit } = useForm<RegionalSettings>({
    resolver: zodResolver(regionalFormSchema),
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
          <form onSubmit={onSubmit} noValidate className="space-y-6">
            <FieldSet>
              <h3 className="text-sm font-semibold text-foreground border-b pb-1.5 mb-3">
                {t("regional.currencySection")}
              </h3>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Controller
                    name="currency"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.currency")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. INR" />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="currencySymbol"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.currencySymbol")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. ₹" />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="decimalPlaces"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.decimalPlaces")}</FieldLabel>
                        <Select
                          value={String(field.value)}
                          onValueChange={(value) => field.onChange(value === null ? field.value : Number(value))}
                          items={[
                            { value: "0", label: "0" },
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                            { value: "3", label: "3" },
                            { value: "4", label: "4" },
                          ]}
                        >
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
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
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.timezone")}</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          items={[
                            { value: "Asia/Kolkata", label: "India (GMT+5:30)" },
                            { value: "UTC", label: "Coordinated Universal Time (UTC)" },
                            { value: "America/New_York", label: "New York (EST/EDT)" },
                            { value: "Europe/London", label: "London (GMT/BST)" },
                          ]}
                        >
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Kolkata">India (GMT+5:30)</SelectItem>
                            <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                            <SelectItem value="America/New_York">New York (EST/EDT)</SelectItem>
                            <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="dateFormat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.dateFormat")}</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          items={[
                            { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                            { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                            { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                          ]}
                        >
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="timeFormat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("regional.timeFormat")}</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          items={[
                            { value: "12h", label: "12-hour (1:00 PM)" },
                            { value: "24h", label: "24-hour (13:00)" },
                          ]}
                        >
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12h">12-hour (1:00 PM)</SelectItem>
                            <SelectItem value="24h">24-hour (13:00)</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
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
