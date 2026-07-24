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
import { useUpdateSettingsGroupMutation } from "../hooks/use-settings"
import { SettingGroup } from "../enums/settings-group"
import type { GeneralSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"
import { ScopeCard } from "./scope-card"

const generalFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  legalCompanyName: z.string().min(1, "Legal company name is required"),
  supportEmail: z.string().min(1, "Support email is required").email("Enter a valid email address"),
  supportPhone: z.string().min(1, "Support phone is required"),
  supportWhatsapp: z.string().min(1, "Support WhatsApp number is required"),
  website: z.string().min(1, "Website is required").url("Enter a valid URL"),
  businessAddress: z.string().min(1, "Business address is required"),
})

interface GeneralFormProps {
  initialValues: GeneralSettings
}

export function GeneralForm({ initialValues }: GeneralFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit } = useForm<GeneralSettings>({
    resolver: zodResolver(generalFormSchema),
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
          <form onSubmit={onSubmit} noValidate className="space-y-6">
            <FieldSet>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="businessName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.businessName")}</FieldLabel>
                        <Input {...field} id={field.name} />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="legalCompanyName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.legalCompanyName")}</FieldLabel>
                        <Input {...field} id={field.name} />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Controller
                    name="supportEmail"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.supportEmail")}</FieldLabel>
                        <Input {...field} type="email" id={field.name} />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="supportPhone"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.supportPhone")}</FieldLabel>
                        <Input {...field} id={field.name} />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="supportWhatsapp"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("general.supportWhatsapp")}</FieldLabel>
                        <Input {...field} id={field.name} />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="website"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t("general.website")}</FieldLabel>
                      <Input {...field} type="url" id={field.name} />
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="businessAddress"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t("general.businessAddress")}</FieldLabel>
                      <Input {...field} id={field.name} />
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
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
