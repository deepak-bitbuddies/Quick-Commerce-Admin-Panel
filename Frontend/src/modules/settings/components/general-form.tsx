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
import type { GeneralSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"
import { ScopeCard } from "./scope-card"

interface GeneralFormProps {
  initialValues: GeneralSettings
}

export function GeneralForm({ initialValues }: GeneralFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit } = useForm<GeneralSettings>({
    defaultValues: initialValues,
  })

  const onSubmit = handleSubmit((values) => {
    mutate(
      { groupId: SettingGroup.GENERAL, values },
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
          <CardTitle>{t("generalTitle")}</CardTitle>
          <CardDescription>{t("generalDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <FieldSet>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="businessName"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.businessName")}</FieldLabel>
                        <Input {...field} id={field.name} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="legalCompanyName"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.legalCompanyName")}</FieldLabel>
                        <Input {...field} id={field.name} />
                      </Field>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Controller
                    name="supportEmail"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.supportEmail")}</FieldLabel>
                        <Input {...field} type="email" id={field.name} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="supportPhone"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.supportPhone")}</FieldLabel>
                        <Input {...field} id={field.name} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="supportWhatsapp"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.supportWhatsapp")}</FieldLabel>
                        <Input {...field} id={field.name} />
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="website"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t("general.website")}</FieldLabel>
                      <Input {...field} type="url" id={field.name} />
                    </Field>
                  )}
                />

                <Controller
                  name="businessAddress"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t("general.businessAddress")}</FieldLabel>
                      <Input {...field} id={field.name} />
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
