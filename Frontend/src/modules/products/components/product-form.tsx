"use client"

import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { z } from "zod"
import {
  CircleNotchIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateProductMutation, useBadgesQuery } from "../hooks/use-products"
import { useCategoriesQuery } from "@/modules/categories/hooks/use-categories"
import { useBrandsQuery } from "@/modules/brands/hooks/use-brands"
import { useTaxRatesQuery } from "@/modules/tax-rates/hooks/use-tax-rates"
import type { ApiErrorPayload } from "@/lib/axios"

const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  size: z.string().min(1, "Size is required"),
  unit: z.string().min(1, "Unit is required").default("PCS"),
  weightInGrams: z.coerce.number().int().nonnegative().default(0),
  convBox: z.coerce.number().int().positive().default(1),
  stock: z.coerce.number().int().nonnegative().default(0),
  mrp: z.coerce.number().positive("MRP must be positive"), // decimal rupees input
  rateA: z.coerce.number().nonnegative().default(0),      // decimal rupees input
  rateB: z.coerce.number().nonnegative().default(0),      // decimal rupees input
  rateC: z.coerce.number().nonnegative().default(0),      // decimal rupees input
  cost: z.coerce.number().nonnegative().default(0),       // decimal rupees input
  minQty: z.coerce.number().int().nonnegative().default(0),
  maxQty: z.coerce.number().int().nonnegative().default(0),
  reorderQty: z.coerce.number().int().nonnegative().default(0),
})

const productFormSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  categoryId: z.string().uuid("Please select a category"),
  brandId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a brand"), // brand is required
  images: z.array(z.string().url()).optional(),
  status: z.enum(["draft", "active", "inactive"]),
  
  // Tax compliance inputs
  hsnCode: z.string().min(1, "HSN Code is required"),
  taxRateId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a tax rate"),
  badgeId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a badge").nullable().optional().or(z.literal("")),
  narcotic: z.boolean().default(false),
  
  variants: z.array(variantSchema).min(1, "Provide at least one size/variant SKU"),
})

interface ProductFormValues {
  name: string
  description?: string
  categoryId: string
  brandId: string
  images?: string[]
  status: "draft" | "active" | "inactive"
  hsnCode: string
  taxRateId: string
  badgeId?: string | null
  narcotic: boolean
  variants: {
    sku: string
    size: string
    unit: string
    weightInGrams: number
    convBox: number
    stock: number
    mrp: number
    rateA: number
    rateB: number
    rateC: number
    cost: number
    minQty: number
    maxQty: number
    reorderQty: number
  }[]
}

export function ProductForm({ redirectPath = "/products" }: { redirectPath?: string }) {
  const router = useRouter()
  const createMutation = useCreateProductMutation()

  // Fetch Category, Brand, and Tax Rate lists for dropdown selections
  const { data: categoriesData } = useCategoriesQuery({ page: 1, pageSize: 100 })
  const { data: brandsData } = useBrandsQuery({ page: 1, pageSize: 100 })
  const { data: taxRatesData } = useTaxRatesQuery({ page: 1, pageSize: 100 })
  const { data: badgesData } = useBadgesQuery({ page: 1, pageSize: 100, status: "active" })

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      brandId: "",
      images: [],
      status: "draft",
      hsnCode: "",
      taxRateId: "",
      badgeId: "",
      narcotic: false,
      variants: [{
        sku: "",
        size: "",
        unit: "PCS",
        weightInGrams: 0,
        convBox: 1,
        stock: 0,
        mrp: 0,
        rateA: 0,
        rateB: 0,
        rateC: 0,
        cost: 0,
        minQty: 0,
        maxQty: 0,
        reorderQty: 0
      }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  })

  const onSubmit = handleSubmit((values) => {
    // Map product form to the new CreateProductInput & CreateVariantInput payload shapes
    const apiPayload = {
      productType: "simple" as const,
      name: values.name,
      description: values.description || undefined,
      categoryId: values.categoryId,
      brandId: values.brandId,
      taxId: values.taxRateId,
      badgeIds: values.badgeId ? [values.badgeId] : [],
      seo: {
        slug: values.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
        keywords: [],
      },
      status: values.status as any,
      variants: values.variants.map((v: any) => ({
        unit: v.unit,
        unitValue: parseFloat(v.size) || 1,
        sku: v.sku ? v.sku.toUpperCase().trim() : undefined,
        mrp: Math.round(v.mrp * 100),
        sellingPrice: Math.round(v.rateA * 100),
        offerPrice: v.rateB ? Math.round(v.rateB * 100) : undefined,
        costPrice: Math.round(v.cost * 100),
        appStock: v.stock,
        localStock: 0,
        minStock: v.minQty,
        reorderLevel: v.reorderQty,
      })),
    }

    createMutation.mutate(apiPayload as any, {
      onSuccess: () => {
        toast.success("Product master and SKUs created successfully")
        router.push(redirectPath)
      },
      onError: (err: ApiErrorPayload) => {
        toast.error(err.message || "Failed to create product catalog item")
      },
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => router.push("/products")}
          className="cursor-pointer"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <h1 className="text-xl font-bold">New Product Master SKU</h1>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <FieldSet>
            <h3 className="text-sm font-semibold border-b pb-2 mb-4">Product Metadata</h3>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Product Name */}
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="col-span-2">
                    <FieldLabel htmlFor={field.name}>Product Name *</FieldLabel>
                    <Input {...field} id={field.name} placeholder="e.g. Parachute Coconut Hair Oil" />
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="col-span-2">
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Input {...field} id={field.name} placeholder="Sourced fresh, 100% pure coconut oil" />
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />

              {/* Category Select */}
              <Controller
                name="categoryId"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Category *</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={categoriesData?.nodes.map((c) => ({ value: c.id, label: c.name })) ?? []}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData?.nodes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />

              {/* Brand Select */}
              <Controller
                name="brandId"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Brand (Company) *</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={brandsData?.brands.map((b) => ({ value: b.id, label: b.name })) ?? []}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brandsData?.brands.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />

              {/* Product Status */}
              <Controller
                name="status"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Publish Status</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={[
                        { value: "draft", label: "Draft" },
                        { value: "active", label: "Active (Visible)" },
                        { value: "inactive", label: "Inactive (Hidden)" },
                      ]}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active (Visible)</SelectItem>
                        <SelectItem value="inactive">Inactive (Hidden)</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />

              {/* Badge Select */}
              <Controller
                name="badgeId"
                control={control}
                render={({ field, fieldState }) => {
                  const selectedBadgeId = field.value
                  const activeBadges = badgesData?.badges || []
                  const selectedBadge = activeBadges.find((b: any) => b.id === selectedBadgeId)

                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Product Badge (Optional)</FieldLabel>
                      <div className="flex gap-2 items-center">
                        <Select
                          value={field.value || "none"}
                          onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                          items={[
                            { value: "none", label: "No Badge" },
                            ...activeBadges.map((b: any) => ({ value: b.id, label: b.name })),
                          ]}
                        >
                          <SelectTrigger id={field.name} className="flex-1 w-full">
                            <SelectValue placeholder="No Badge" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Badge</SelectItem>
                            {activeBadges.map((b: any) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedBadge && (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wide shrink-0 shadow-sm transition-all duration-300"
                            style={{
                              backgroundColor: selectedBadge.color,
                              color: selectedBadge.textColor,
                            }}
                          >
                            {selectedBadge.name}
                          </span>
                        )}
                      </div>
                      {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                    </Field>
                  )
                }}
              />

            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <h3 className="text-sm font-semibold border-b pb-2 mb-4">GST Compliance & HSN</h3>
            <FieldGroup className="grid grid-cols-2 md:grid-cols-6 gap-4">
              
              {/* HSN/SAC */}
              <Controller
                name="hsnCode"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="col-span-2">
                    <FieldLabel>HSN / SAC Code *</FieldLabel>
                    <Input {...field} placeholder="e.g. 33051090" />
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />

              {/* Tax Rate dropdown */}
              <Controller
                name="taxRateId"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="col-span-2">
                    <FieldLabel htmlFor={field.name}>Tax Rate Group *</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={taxRatesData?.nodes.map((tr) => ({
                        value: tr.id,
                        label: `${tr.name} (CGST: ${tr.cgst}%, SGST: ${tr.sgst}%, IGST: ${tr.igst}%)`,
                      })) ?? []}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Select a tax rate..." />
                      </SelectTrigger>
                      <SelectContent>
                        {taxRatesData?.nodes.map((tr) => (
                          <SelectItem key={tr.id} value={tr.id}>
                            {tr.name} (CGST: {tr.cgst}%, SGST: {tr.sgst}%, IGST: {tr.igst}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[{ message: fieldState.error?.message }]} />}
                  </Field>
                )}
              />

              {/* Narcotic flag */}
              <div className="col-span-2 flex items-center gap-2 pt-6">
                <Controller
                  name="narcotic"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="narcotic"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <label htmlFor="narcotic" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Narcotic / Pharmacy Drug Classification
                </label>
              </div>

            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {/* Dynamic SKU Variants Grid Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">SKU Sizes, Multi-Rates & Reorder Thresholds</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({
              sku: "",
              size: "",
              unit: "PCS",
              weightInGrams: 0,
              convBox: 1,
              stock: 0,
              mrp: 0,
              rateA: 0,
              rateB: 0,
              rateC: 0,
              cost: 0,
              minQty: 0,
              maxQty: 0,
              reorderQty: 0
            })}
            className="cursor-pointer flex items-center gap-1"
          >
            <PlusIcon className="size-4" />
            Add SKU Variant
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className="relative shadow-sm border-zinc-200 dark:border-zinc-800">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Variant #{index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                  {/* Size */}
                  <Controller
                    name={`variants.${index}.size`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Size / Pack *</FieldLabel>
                        <Input {...field} placeholder="e.g. 500 ml, 1 kg" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* SKU */}
                  <Controller
                    name={`variants.${index}.sku`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Variant SKU Code *</FieldLabel>
                        <Input {...field} placeholder="PARA-OIL-500ML" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />



                  {/* Unit */}
                  <Controller
                    name={`variants.${index}.unit`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Unit (UQC)</FieldLabel>
                        <Input {...field} placeholder="PCS" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* Weight */}
                  <Controller
                    name={`variants.${index}.weightInGrams`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Weight (Grams)</FieldLabel>
                        <Input {...field} type="number" placeholder="500" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* Conv. Box */}
                  <Controller
                    name={`variants.${index}.convBox`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Conversion Box</FieldLabel>
                        <Input {...field} type="number" placeholder="1" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />
                </div>

                {/* Rates Grid */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  {/* Stock Qty */}
                  <Controller
                    name={`variants.${index}.stock`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Stock Balance</FieldLabel>
                        <Input {...field} type="number" className="bg-white dark:bg-zinc-950" placeholder="0" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* MRP */}
                  <Controller
                    name={`variants.${index}.mrp`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>MRP Price (₹) *</FieldLabel>
                        <Input {...field} type="number" step="0.01" className="bg-white dark:bg-zinc-950 font-semibold" placeholder="₹" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* Rate A */}
                  <Controller
                    name={`variants.${index}.rateA`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Rate-A (App Price)</FieldLabel>
                        <Input {...field} type="number" step="0.01" className="bg-white dark:bg-zinc-950 font-semibold text-emerald-600" placeholder="₹" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* Rate B */}
                  <Controller
                    name={`variants.${index}.rateB`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Rate-B (Wholesale)</FieldLabel>
                        <Input {...field} type="number" step="0.01" className="bg-white dark:bg-zinc-950" placeholder="₹" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* Rate C */}
                  <Controller
                    name={`variants.${index}.rateC`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Rate-C</FieldLabel>
                        <Input {...field} type="number" step="0.01" className="bg-white dark:bg-zinc-950" placeholder="₹" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* Cost price */}
                  <Controller
                    name={`variants.${index}.cost`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Purchase Cost (₹)</FieldLabel>
                        <Input {...field} type="number" step="0.01" className="bg-white dark:bg-zinc-950" placeholder="₹" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />
                </div>

                {/* Reorder levels */}
                <div className="grid grid-cols-3 gap-3 max-w-lg">
                  {/* Min Qty */}
                  <Controller
                    name={`variants.${index}.minQty`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Min Level</FieldLabel>
                        <Input {...field} type="number" placeholder="0" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* Max Qty */}
                  <Controller
                    name={`variants.${index}.maxQty`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Max Level</FieldLabel>
                        <Input {...field} type="number" placeholder="0" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />

                  {/* Reorder Qty */}
                  <Controller
                    name={`variants.${index}.reorderQty`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Reorder Threshold</FieldLabel>
                        <Input {...field} type="number" placeholder="0" />
                        {fieldState.invalid && <span className="text-[10px] text-red-500 font-semibold">{fieldState.error?.message}</span>}
                      </Field>
                    )}
                  />
                </div>

              </CardContent>
            </Card>
          ))}
          {errors.variants && (
            <p className="text-xs font-semibold text-red-500 mt-1">{errors.variants.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/products")}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || createMutation.isPending}
          className="cursor-pointer"
        >
          {(isSubmitting || createMutation.isPending) && (
            <CircleNotchIcon className="size-4 animate-spin mr-1" />
          )}
          Create Product
        </Button>
      </div>
    </form>
  )
}
