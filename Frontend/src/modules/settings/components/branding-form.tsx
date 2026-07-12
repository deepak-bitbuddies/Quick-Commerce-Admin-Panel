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
import type { BrandingSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"

interface BrandingFormProps {
  initialValues: BrandingSettings
}

export function BrandingForm({ initialValues }: BrandingFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit } = useForm<BrandingSettings>({
    defaultValues: {
      platformDisplayName: initialValues.platformDisplayName || "",
      admin: {
        lightLogo: initialValues.admin?.lightLogo || "",
        darkLogo: initialValues.admin?.darkLogo || "",
      },
      customer: {
        lightLogo: initialValues.customer?.lightLogo || "",
        darkLogo: initialValues.customer?.darkLogo || "",
      },
      delivery: {
        lightLogo: initialValues.delivery?.lightLogo || "",
        darkLogo: initialValues.delivery?.darkLogo || "",
      },
      browser: {
        title: initialValues.browser?.title || "",
        favicon: initialValues.browser?.favicon || "",
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutate(
      { groupId: SettingGroup.BRANDING, values },
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
      <Card>
        <CardHeader>
          <CardTitle>{t("brandingTitle")}</CardTitle>
          <CardDescription>{t("brandingDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-8">
            <FieldSet>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <FieldLegend>{t("branding.globalSection")}</FieldLegend>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
                  {t("scope.appliesToAll")}
                </span>
              </div>
              <FieldGroup>
                <Controller
                  name="platformDisplayName"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t("branding.platformDisplayName")}</FieldLabel>
                      <Input {...field} id={field.name} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <FieldLegend>{t("branding.adminSection")}</FieldLegend>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
                  {t("scope.adminPanelOnly")}
                </span>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="admin.lightLogo"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("branding.lightLogo")}</FieldLabel>
                        <Input {...field} type="url" id={field.name} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="admin.darkLogo"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("branding.darkLogo")}</FieldLabel>
                        <Input {...field} type="url" id={field.name} />
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <FieldLegend>{t("branding.customerSection")}</FieldLegend>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
                  {t("scope.customerAppOnly")}
                </span>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="customer.lightLogo"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("branding.lightLogo")}</FieldLabel>
                        <Input {...field} type="url" id={field.name} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="customer.darkLogo"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("branding.darkLogo")}</FieldLabel>
                        <Input {...field} type="url" id={field.name} />
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <FieldLegend>{t("branding.deliverySection")}</FieldLegend>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
                  {t("scope.deliveryAppOnly")}
                </span>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="delivery.lightLogo"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("branding.lightLogo")}</FieldLabel>
                        <Input {...field} type="url" id={field.name} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="delivery.darkLogo"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("branding.darkLogo")}</FieldLabel>
                        <Input {...field} type="url" id={field.name} />
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <FieldLegend>{t("branding.browserSection")}</FieldLegend>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
                  {t("scope.adminPanelOnly")}
                </span>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="browser.title"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("branding.browserTitle")}</FieldLabel>
                        <Input {...field} id={field.name} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="browser.favicon"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("branding.favicon")}</FieldLabel>
                        <Input {...field} type="url" id={field.name} />
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

function FieldLegend({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-foreground">
      {children}
    </h3>
  )
}
