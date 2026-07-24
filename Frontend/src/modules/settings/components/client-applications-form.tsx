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
import { Switch } from "@/components/ui/switch"
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet, FieldDescription } from "@/components/ui/field"
import { useUpdateSettingsGroupMutation } from "../hooks/use-settings"
import { SettingGroup } from "../enums/settings-group"
import type { ClientApplicationsSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"

const appVersionConfigSchema = z.object({
  minVersion: z.string().min(1, "Minimum version is required"),
  latestVersion: z.string().min(1, "Latest version is required"),
  forceUpdate: z.boolean(),
})

const clientApplicationsFormSchema = z.object({
  customer: appVersionConfigSchema,
  delivery: appVersionConfigSchema,
  admin: appVersionConfigSchema,
})

interface ClientApplicationsFormProps {
  initialValues: ClientApplicationsSettings
}

export function ClientApplicationsForm({ initialValues }: ClientApplicationsFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit } = useForm<ClientApplicationsSettings>({
    resolver: zodResolver(clientApplicationsFormSchema),
    defaultValues: {
      customer: {
        minVersion: initialValues.customer?.minVersion || "1.0.0",
        latestVersion: initialValues.customer?.latestVersion || "1.0.0",
        forceUpdate: initialValues.customer?.forceUpdate ?? false,
      },
      delivery: {
        minVersion: initialValues.delivery?.minVersion || "1.0.0",
        latestVersion: initialValues.delivery?.latestVersion || "1.0.0",
        forceUpdate: initialValues.delivery?.forceUpdate ?? false,
      },
      admin: {
        minVersion: initialValues.admin?.minVersion || "1.0.0",
        latestVersion: initialValues.admin?.latestVersion || "1.0.0",
        forceUpdate: initialValues.admin?.forceUpdate ?? false,
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutate(
      { groupId: SettingGroup.CLIENT_APPLICATIONS, values },
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
          <CardTitle>{t("clientAppsTitle")}</CardTitle>
          <CardDescription>{t("clientAppsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-8">
            {/* Customer App Versioning */}
            <FieldSet>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <FieldLegend>{t("clientApps.customerSection")}</FieldLegend>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
                  {t("scope.customerAppOnly")}
                </span>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="customer.minVersion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("clientApps.minVersion")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. 1.0.0" />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="customer.latestVersion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("clientApps.latestVersion")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. 1.0.0" />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="customer.forceUpdate"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("clientApps.forceUpdate")}</FieldLabel>
                        <FieldDescription>{t("clientApps.forceUpdateDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            {/* Delivery App Versioning */}
            <FieldSet>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <FieldLegend>{t("clientApps.deliverySection")}</FieldLegend>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
                  {t("scope.deliveryAppOnly")}
                </span>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="delivery.minVersion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("clientApps.minVersion")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. 1.0.0" />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="delivery.latestVersion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("clientApps.latestVersion")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. 1.0.0" />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="delivery.forceUpdate"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("clientApps.forceUpdate")}</FieldLabel>
                        <FieldDescription>{t("clientApps.forceUpdateDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            {/* Admin Panel Versioning */}
            <FieldSet>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <FieldLegend>{t("clientApps.adminSection")}</FieldLegend>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
                  {t("scope.adminPanelOnly")}
                </span>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="admin.minVersion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("clientApps.minVersion")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. 1.0.0" />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="admin.latestVersion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("clientApps.latestVersion")}</FieldLabel>
                        <Input {...field} id={field.name} placeholder="e.g. 1.0.0" />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="admin.forceUpdate"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("clientApps.forceUpdate")}</FieldLabel>
                        <FieldDescription>{t("clientApps.forceUpdateDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
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

function FieldLegend({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-foreground">
      {children}
    </h3>
  )
}
