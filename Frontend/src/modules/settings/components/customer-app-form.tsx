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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateSettingsGroupMutation } from "../hooks/use-settings"
import { SettingGroup } from "../enums/settings-group"
import type { CustomerAppSettings } from "../types/settings-types"
import type { ApiErrorPayload } from "@/lib/axios"
import { ScopeCard } from "./scope-card"

// Maintenance/announcement message content is only required to be non-empty when
// enabled; the fields themselves stay required strings (matching CustomerAppSettings)
// since they always hold a value, just conditionally validated via refine below
// instead of forcing hidden fields to be required.
const customerAppFormSchema = z
  .object({
    maintenance: z.object({
      enabled: z.boolean(),
      message: z.string(),
      image: z.string(),
    }),
    features: z.object({
      wallet: z.boolean(),
      referral: z.boolean(),
      ratings: z.boolean(),
      reviews: z.boolean(),
      guestCheckout: z.boolean(),
      coupons: z.boolean(),
      offers: z.boolean(),
    }),
    orders: z.object({
      minOrderAmount: z.number().min(0, "Must be 0 or more"),
      freeDeliveryThreshold: z.number().min(0, "Must be 0 or more"),
      orderCancellationWindow: z.number().min(0, "Must be 0 or more"),
      returnWindow: z.number().min(0, "Must be 0 or more"),
      estimatedDeliveryBuffer: z.number().min(0, "Must be 0 or more"),
    }),
    announcements: z.object({
      enabled: z.boolean(),
      message: z.string(),
      style: z.enum(["info", "warning", "emergency"]),
    }),
  })
  .refine(
    (data) => !data.maintenance.enabled || Boolean(data.maintenance.message?.trim()),
    {
      message: "Maintenance message is required",
      path: ["maintenance", "message"],
    }
  )
  .refine(
    (data) => !data.announcements.enabled || Boolean(data.announcements.message?.trim()),
    {
      message: "Announcement message is required",
      path: ["announcements", "message"],
    }
  )

interface CustomerAppFormProps {
  initialValues: CustomerAppSettings
}

export function CustomerAppForm({ initialValues }: CustomerAppFormProps) {
  const t = useTranslations("Settings")
  const { mutate, isPending } = useUpdateSettingsGroupMutation()

  const { control, handleSubmit, watch } = useForm<CustomerAppSettings>({
    resolver: zodResolver(customerAppFormSchema),
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
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>{t("customerApp.maintenanceMessage")}</FieldLabel>
                          <Input {...field} id={field.name} />
                          {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
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
                          {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
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
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.minOrderAmount")}</FieldLabel>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          id={field.name}
                          type="number"
                        />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="orders.freeDeliveryThreshold"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.freeDeliveryThreshold")}</FieldLabel>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          id={field.name}
                          type="number"
                        />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Controller
                    name="orders.orderCancellationWindow"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.orderCancellationWindow")}</FieldLabel>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          id={field.name}
                          type="number"
                        />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="orders.returnWindow"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.returnWindow")}</FieldLabel>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          id={field.name}
                          type="number"
                        />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="orders.estimatedDeliveryBuffer"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>{t("customerApp.estimatedDeliveryBuffer")}</FieldLabel>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          id={field.name}
                          type="number"
                        />
                        {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
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
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>{t("customerApp.announcementMessage")}</FieldLabel>
                            <Input {...field} id={field.name} />
                            {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                          </Field>
                        )}
                      />
                    </div>

                    <Controller
                      name="announcements.style"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>{t("customerApp.announcementStyle")}</FieldLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            items={[
                              { value: "info", label: "Info" },
                              { value: "warning", label: "Warning" },
                              { value: "emergency", label: "Emergency" },
                            ]}
                          >
                            <SelectTrigger id={field.name} className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
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
