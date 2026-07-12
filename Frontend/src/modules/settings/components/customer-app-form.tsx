"use client"

import { useForm, Controller } from "react-hook-form"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CircleNotch } from "@phosphor-icons/react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldSet, FieldDescription } from "@/components/ui/field"
import { useUpdateSettingsGroupMutation } from "../hooks/use-settings"
import { SettingGroup } from "../enums/settings-group"
import type { CustomerAppSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"
import { ScopeCard } from "./scope-card"

interface CustomerAppFormProps {
  initialValues: CustomerAppSettings
}

const selectClass = "flex h-8 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function CustomerAppForm({ initialValues }: CustomerAppFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit, watch } = useForm<CustomerAppSettings>({
    defaultValues: {
      maintenance: {
        enabled: initialValues.maintenance?.enabled ?? false,
        message: initialValues.maintenance?.message || "",
        image: initialValues.maintenance?.image || "",
      },
      features: {
        wallet: initialValues.features?.wallet ?? true,
        referral: initialValues.features?.referral ?? true,
        ratings: initialValues.features?.ratings ?? true,
        reviews: initialValues.features?.reviews ?? true,
        guestCheckout: initialValues.features?.guestCheckout ?? true,
        coupons: initialValues.features?.coupons ?? true,
        offers: initialValues.features?.offers ?? true,
      },
      orders: {
        minOrderAmount: initialValues.orders?.minOrderAmount ?? 0,
        freeDeliveryThreshold: initialValues.orders?.freeDeliveryThreshold ?? 0,
        orderCancellationWindow: initialValues.orders?.orderCancellationWindow ?? 5,
        returnWindow: initialValues.orders?.returnWindow ?? 7,
        estimatedDeliveryBuffer: initialValues.orders?.estimatedDeliveryBuffer ?? 10,
      },
      announcements: {
        enabled: initialValues.announcements?.enabled ?? false,
        message: initialValues.announcements?.message || "",
        style: initialValues.announcements?.style || "info",
      },
    },
  })

  const maintenanceEnabled = watch("maintenance.enabled")
  const announcementEnabled = watch("announcements.enabled")

  const onSubmit = handleSubmit((values) => {
    mutate(
      { groupId: SettingGroup.CUSTOMER_APP, values },
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
      <ScopeCard customer />

      <Card>
        <CardHeader>
          <CardTitle>{t("customerAppTitle")}</CardTitle>
          <CardDescription>{t("customerAppDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-8">
            {/* Maintenance Settings */}
            <FieldSet>
              <h3 className="text-sm font-semibold text-foreground border-b pb-1.5 mb-4">
                {t("customerApp.maintenanceSection")}
              </h3>
              <FieldGroup>
                <Controller
                  name="maintenance.enabled"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.maintenanceEnabled")}</FieldLabel>
                        <FieldDescription>{t("customerApp.maintenanceEnabledDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />

                {maintenanceEnabled && (
                  <div className="grid grid-cols-1 gap-4 mt-2">
                    <Controller
                      name="maintenance.message"
                      control={control}
                      rules={{ required: true }}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>{t("customerApp.maintenanceMessage")}</FieldLabel>
                          <Input {...field} id={field.name} />
                        </Field>
                      )}
                    />

                    <Controller
                      name="maintenance.image"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>{t("customerApp.maintenanceImage")}</FieldLabel>
                          <Input {...field} id={field.name} type="url" placeholder="https://..." />
                        </Field>
                      )}
                    />
                  </div>
                )}
              </FieldGroup>
            </FieldSet>

            {/* Feature Flags */}
            <FieldSet>
              <h3 className="text-sm font-semibold text-foreground border-b pb-1.5 mb-4">
                {t("customerApp.featuresSection")}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Controller
                  name="features.wallet"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.wallet")}</FieldLabel>
                        <FieldDescription>{t("customerApp.walletDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />

                <Controller
                  name="features.referral"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.referral")}</FieldLabel>
                        <FieldDescription>{t("customerApp.referralDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />

                <Controller
                  name="features.ratings"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.ratings")}</FieldLabel>
                        <FieldDescription>{t("customerApp.ratingsDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />

                <Controller
                  name="features.reviews"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.reviews")}</FieldLabel>
                        <FieldDescription>{t("customerApp.reviewsDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />

                <Controller
                  name="features.guestCheckout"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.guestCheckout")}</FieldLabel>
                        <FieldDescription>{t("customerApp.guestCheckoutDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />

                <Controller
                  name="features.coupons"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.coupons")}</FieldLabel>
                        <FieldDescription>{t("customerApp.couponsDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />

                <Controller
                  name="features.offers"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.offers")}</FieldLabel>
                        <FieldDescription>{t("customerApp.offersDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />
              </div>
            </FieldSet>

            {/* Orders Rules */}
            <FieldSet>
              <h3 className="text-sm font-semibold text-foreground border-b pb-1.5 mb-4">
                {t("customerApp.ordersSection")}
              </h3>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="orders.minOrderAmount"
                    control={control}
                    rules={{ required: true, min: 0 }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.minOrderAmount")}</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="orders.freeDeliveryThreshold"
                    control={control}
                    rules={{ required: true, min: 0 }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.freeDeliveryThreshold")}</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </Field>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Controller
                    name="orders.orderCancellationWindow"
                    control={control}
                    rules={{ required: true, min: 0 }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.orderCancellationWindow")}</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="orders.returnWindow"
                    control={control}
                    rules={{ required: true, min: 0 }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.returnWindow")}</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="orders.estimatedDeliveryBuffer"
                    control={control}
                    rules={{ required: true, min: 0 }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.estimatedDeliveryBuffer")}</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </FieldSet>

            {/* Announcements */}
            <FieldSet>
              <h3 className="text-sm font-semibold text-foreground border-b pb-1.5 mb-4">
                {t("customerApp.announcementsSection")}
              </h3>
              <FieldGroup>
                <Controller
                  name="announcements.enabled"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.announcementEnabled")}</FieldLabel>
                        <FieldDescription>{t("customerApp.announcementEnabledDesc")}</FieldDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} id={field.name} />
                    </div>
                  )}
                />

                {announcementEnabled && (
                  <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <Controller
                        name="announcements.message"
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>{t("customerApp.announcementMessage")}</FieldLabel>
                            <Input {...field} id={field.name} />
                          </Field>
                        )}
                      />
                    </div>

                    <Controller
                      name="announcements.style"
                      control={control}
                      rules={{ required: true }}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>{t("customerApp.announcementStyle")}</FieldLabel>
                          <select {...field} id={field.name} className={selectClass}>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </Field>
                      )}
                    />
                  </div>
                )}
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

function Switch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      id={id}
      className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-4.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4.5" : "translate-x-0"
        }`}
      />
    </button>
  )
}
