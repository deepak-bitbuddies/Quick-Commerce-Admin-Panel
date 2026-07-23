"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CircleNotchIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  TagIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { useCreateProductMutation, useBadgesQuery } from "../hooks/use-products"
import { useCategoriesQuery } from "@/modules/categories/hooks/use-categories"
import { useBrandsQuery } from "@/modules/brands/hooks/use-brands"
import { useTaxRatesQuery } from "@/modules/tax-rates/hooks/use-tax-rates"
import type { ApiErrorPayload } from "@/lib/axios"

// Wizard step descriptions
const STEPS = [
  { number: 1, label: "Basic Details", desc: "Product catalog identity" },
  { number: 2, label: "Visual Assets", desc: "Upload product media" },
  { number: 3, label: "Variants Setup", desc: "Manage sizes & pricing" },
  { number: 4, label: "Stock Pools", desc: "Define inventory controls" },
  { number: 5, label: "Review & Save", desc: "Finalize product master" },
]

export function ProductCreationWizard() {
  const router = useRouter()
  const createMutation = useCreateProductMutation()
  const [currentStep, setCurrentStep] = React.useState(1)

  // Dropdown lists
  const { data: categoriesData } = useCategoriesQuery({ page: 1, pageSize: 100 })
  const { data: brandsData } = useBrandsQuery({ page: 1, pageSize: 100 })
  const { data: taxRatesData } = useTaxRatesQuery({ page: 1, pageSize: 100 })
  const { data: badgesData } = useBadgesQuery({ page: 1, pageSize: 100, status: "active" })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<any>({
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      subCategoryId: "",
      brandId: "",
      taxId: "",
      badgeIds: [],
      primaryImage: "",
      galleryImages: [],
      tagsInput: "",
      variants: [
        {
          unit: "gm",
          unitValue: 500,
          sku: "",
          mrp: "",
          sellingPrice: "",
          offerPrice: "",
          costPrice: "",
          appStock: 0,
          localStock: 0,
          minStock: 0,
          reorderLevel: 0,
          reservedStock: 0,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  })

  const formValues = watch()
  const variantsValues = watch("variants")

  const getErrorMessage = (error: any) => {
    return error?.message as string | undefined
  }

  const getVariantError = (index: number, fieldName: string) => {
    return (errors.variants as any)?.[index]?.[fieldName]?.message as string | undefined
  }

  // Auto-generate SKUs when name, unit, or unit value changes in variants
  React.useEffect(() => {
    variantsValues.forEach((v: any, index: number) => {
      if (formValues.name && v.unit && v.unitValue) {
        const cleanName = formValues.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
        const prefix = cleanName.slice(0, 6) || "SKU"
        let unitSuffix = v.unit.toUpperCase()
        if (unitSuffix === "LITRE") unitSuffix = "L"
        const unitStr = `${v.unitValue}${unitSuffix}`
        const suffix = String(index + 1).padStart(4, "0")
        const autoSku = `${prefix}-${unitStr}-${suffix}`
        
        // Only update if current SKU is empty or was previously auto-generated
        if (!v.sku || v.sku.startsWith(prefix)) {
          setValue(`variants.${index}.sku`, autoSku)
        }
      }
    })
  }, [formValues.name, setValue])

  // Helper to format variant labels dynamically
  const getVariantLabel = (unit: string, value: number) => {
    const u = unit.toUpperCase()
    if (u === "PCS") {
      return value > 1 ? `Pack of ${value}` : `1 PCS`
    }
    return `${value} ${u}`
  }

  // Gallery image inputs manager
  const [newGalleryUrl, setNewGalleryUrl] = React.useState("")
  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return
    setValue("galleryImages", [...(formValues.galleryImages || []), newGalleryUrl.trim()])
    setNewGalleryUrl("")
  }

  const handleRemoveGalleryUrl = (idx: number) => {
    const updated = [...(formValues.galleryImages || [])]
    updated.splice(idx, 1)
    setValue("galleryImages", updated)
  }

  // Step navigation control with validation triggers
  const handleNext = async () => {
    let fieldsToValidate: string[] = []
    if (currentStep === 1) {
      fieldsToValidate = ["name", "categoryId", "brandId", "taxId"]
    } else if (currentStep === 2) {
      fieldsToValidate = ["primaryImage"]
    } else if (currentStep === 3) {
      fieldsToValidate = variantsValues.map((_: any, i: number) => `variants.${i}`)
    } else if (currentStep === 4) {
      fieldsToValidate = variantsValues.map((_: any, i: number) => `variants.${i}`)
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  // Main Submit handler (Save Draft or Publish)
  const saveProduct = (status: "draft" | "active") => {
    // Map tag string array
    const tags = formValues.tagsInput
      ? formValues.tagsInput.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : []

    // Map payload structure
    const payload = {
      productType: "variable",
      name: formValues.name,
      description: formValues.description || undefined,
      categoryId: formValues.categoryId,
      subCategoryId: formValues.subCategoryId || undefined,
      brandId: formValues.brandId,
      taxId: formValues.taxId,
      badgeIds: formValues.badgeIds || [],
      primaryImage: formValues.primaryImage || undefined,
      galleryImages: formValues.galleryImages || [],
      tags,
      seo: {
        slug: formValues.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
        keywords: tags,
      },
      status,
      variants: formValues.variants.map((v: any, index: number) => ({
        unit: v.unit,
        unitValue: parseFloat(v.unitValue) || 1,
        sku: v.sku.toUpperCase().trim(),
        mrp: Math.round((parseFloat(v.mrp) || 0) * 100),
        sellingPrice: Math.round((parseFloat(v.sellingPrice) || 0) * 100),
        offerPrice: v.offerPrice ? Math.round((parseFloat(v.offerPrice) || 0) * 100) : undefined,
        costPrice: v.costPrice ? Math.round((parseFloat(v.costPrice) || 0) * 100) : 0,
        appStock: parseInt(v.appStock) || 0,
        localStock: parseInt(v.localStock) || 0,
        minStock: parseInt(v.minStock) || 0,
        reorderLevel: parseInt(v.reorderLevel) || 0,
        reservedStock: parseInt(v.reservedStock) || 0,
        isDefault: index === 0, // Mark first variant as default by default
        sortOrder: index,
      })),
    }

    createMutation.mutate(payload as any, {
      onSuccess: () => {
        toast.success(`Product successfully created in status: ${status.toUpperCase()}`)
        router.push("/products")
      },
      onError: (err: ApiErrorPayload) => {
        toast.error(err.message || "Failed to create product catalog master")
      },
    })
  }

  return (
    <div className="space-y-6 max-w-5xl">
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
        <h1 className="text-xl font-bold tracking-tight">Create Product Wizard</h1>
      </div>

      {/* Progress indicators bar */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border rounded-lg p-4 grid grid-cols-5 gap-2">
        {STEPS.map((step) => {
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number
          return (
            <div key={step.number} className="flex flex-col gap-1 items-start relative">
              <div className="flex items-center gap-2">
                <span
                  className={`size-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                    isActive
                      ? "bg-amber-500 text-white shadow ring-2 ring-amber-500/20"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-200 dark:bg-zinc-800 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckIcon className="size-3.5" /> : step.number}
                </span>
                <span className={`text-xs font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground pl-8 hidden md:inline">
                {step.desc}
              </span>
            </div>
          )
        })}
      </div>

      {/* Form content steps */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Step 1: Product Basic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">Product Name *</FieldLabel>
                    <Input id="name" placeholder="e.g. Fresh Organic Milk" {...register("name", { required: "Product Name is required" })} />
                    <FieldError errors={[{ message: getErrorMessage(errors.name) }]} />
                  </Field>
                </div>

                <div>
                  <Field data-invalid={!!errors.categoryId}>
                    <FieldLabel htmlFor="categoryId">Category *</FieldLabel>
                    <select
                      id="categoryId"
                      {...register("categoryId", { required: "Category is required" })}
                      className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                    >
                      <option value="">Select Category...</option>
                      {categoriesData?.nodes.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <FieldError errors={[{ message: getErrorMessage(errors.categoryId) }]} />
                  </Field>
                </div>

                <div>
                  <Field>
                    <FieldLabel htmlFor="subCategoryId">Sub Category (Optional)</FieldLabel>
                    <select
                      id="subCategoryId"
                      {...register("subCategoryId")}
                      className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                    >
                      <option value="">Select Sub Category...</option>
                      {categoriesData?.nodes
                        .filter((c: any) => c.parentId === watch("categoryId") && watch("categoryId") !== "")
                        .map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>

                <div>
                  <Field data-invalid={!!errors.brandId}>
                    <FieldLabel htmlFor="brandId">Brand *</FieldLabel>
                    <select
                      id="brandId"
                      {...register("brandId", { required: "Brand is required" })}
                      className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                    >
                      <option value="">Select Brand...</option>
                      {brandsData?.brands.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <FieldError errors={[{ message: getErrorMessage(errors.brandId) }]} />
                  </Field>
                </div>

                <div>
                  <Field data-invalid={!!errors.taxId}>
                    <FieldLabel htmlFor="taxId">Tax Rate Class *</FieldLabel>
                    <select
                      id="taxId"
                      {...register("taxId", { required: "Tax Rate Class is required" })}
                      className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                    >
                      <option value="">Select Tax Rate...</option>
                      {taxRatesData?.nodes.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.igst}%)
                        </option>
                      ))}
                    </select>
                    <FieldError errors={[{ message: getErrorMessage(errors.taxId) }]} />
                  </Field>
                </div>

                <div className="col-span-2">
                  <Field>
                    <FieldLabel>Product Badges</FieldLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                      {badgesData?.badges.map((badge: any) => (
                        <label key={badge.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
                          <input
                            type="checkbox"
                            value={badge.id}
                            className="rounded text-amber-500 focus:ring-amber-500"
                            onChange={(e) => {
                              const checked = e.target.checked
                              const current = formValues.badgeIds || []
                              if (checked) {
                                setValue("badgeIds", [...current, badge.id])
                              } else {
                                setValue("badgeIds", current.filter((id: string) => id !== badge.id))
                              }
                            }}
                            checked={(formValues.badgeIds || []).includes(badge.id)}
                          />
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] uppercase font-extrabold"
                            style={{ backgroundColor: badge.color, color: badge.textColor }}
                          >
                            {badge.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="col-span-2">
                  <Field>
                    <FieldLabel htmlFor="tagsInput">Tags / Keywords (Comma-separated)</FieldLabel>
                    <Input id="tagsInput" placeholder="organic, dairy, fresh, milk" {...register("tagsInput")} />
                  </Field>
                </div>

                <div className="col-span-2">
                  <Field>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <Textarea id="description" placeholder="Write descriptions..." {...register("description")} className="min-h-[120px]" />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Step 2: Media visual assets</h2>
              <div className="space-y-4">
                <div>
                  <Field data-invalid={!!errors.primaryImage}>
                    <FieldLabel htmlFor="primaryImage">Primary Image URL *</FieldLabel>
                    <Input id="primaryImage" placeholder="https://example.com/image.jpg" {...register("primaryImage", { required: "Primary Image URL is required" })} />
                    <FieldError errors={[{ message: getErrorMessage(errors.primaryImage) }]} />
                    {formValues.primaryImage && formValues.primaryImage.startsWith("http") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formValues.primaryImage} alt="Primary Preview" className="size-32 rounded-lg border object-cover ring-1 ring-foreground/10" />
                    )}
                  </Field>
                </div>

                <div>
                  <Field>
                    <FieldLabel>Gallery Images (Visual Assets)</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/gallery-image.jpg"
                        value={newGalleryUrl}
                        onChange={(e) => setNewGalleryUrl(e.target.value)}
                      />
                      <Button type="button" variant="secondary" onClick={handleAddGalleryUrl} className="cursor-pointer">Add</Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                      {formValues.galleryImages?.map((url: string, index: number) => (
                        <div key={index} className="relative group border rounded-lg overflow-hidden h-24">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Gallery #${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryUrl(index)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow cursor-pointer hover:bg-red-700"
                          >
                            <TrashIcon className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Step 3: Variant SKU Specifications</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      unit: "gm",
                      unitValue: 500,
                      sku: "",
                      mrp: "",
                      sellingPrice: "",
                      offerPrice: "",
                      costPrice: "",
                      appStock: 0,
                      localStock: 0,
                      minStock: 0,
                      reorderLevel: 0,
                      reservedStock: 0,
                    })
                  }
                  className="cursor-pointer"
                >
                  <PlusIcon className="mr-1.5 size-4" /> Add Custom Variant Size
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-3 relative">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition cursor-pointer"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    )}

                    <span className="text-xs font-bold text-amber-500 font-mono">Variant SKU Size #{index + 1}</span>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Field>
                          <FieldLabel className="mb-1 block">Unit Type</FieldLabel>
                          <select
                            {...register(`variants.${index}.unit`)}
                            className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                          >
                            <option value="gm">Grams (GM)</option>
                            <option value="kg">Kilograms (KG)</option>
                            <option value="litre">Litres (LITRE)</option>
                            <option value="ml">Millilitres (ML)</option>
                            <option value="pcs">Pieces (PCS)</option>
                          </select>
                        </Field>
                      </div>

                      <div>
                        <Field data-invalid={!!(errors.variants as any)?.[index]?.unitValue}>
                          <FieldLabel className="mb-1 block">Unit Value</FieldLabel>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g. 500 or 1"
                            {...register(`variants.${index}.unitValue`, { required: "Unit Value is required" })}
                          />
                          <FieldError errors={[{ message: getVariantError(index, "unitValue") }]} />
                        </Field>
                      </div>

                      <div className="col-span-2">
                        <Field data-invalid={!!(errors.variants as any)?.[index]?.sku}>
                          <FieldLabel className="mb-1 block">SKU Code (Auto-Generated / Editable)</FieldLabel>
                          <Input
                            placeholder="SKU-CODE"
                            {...register(`variants.${index}.sku`, { required: "Variant SKU is required" })}
                          />
                          <FieldError errors={[{ message: getVariantError(index, "sku") }]} />
                        </Field>
                      </div>

                      <div>
                        <Field data-invalid={!!(errors.variants as any)?.[index]?.mrp}>
                          <FieldLabel className="mb-1 block">MRP (₹)</FieldLabel>
                          <Input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            {...register(`variants.${index}.mrp`, {
                              required: "MRP is required",
                              validate: (val) => {
                                const num = parseFloat(val)
                                return isNaN(num) || num <= 0 ? "MRP must be positive" : true
                              }
                            })}
                          />
                          <FieldError errors={[{ message: getVariantError(index, "mrp") }]} />
                        </Field>
                      </div>

                      <div>
                        <Field data-invalid={!!(errors.variants as any)?.[index]?.sellingPrice}>
                          <FieldLabel className="mb-1 block">Selling Price (₹)</FieldLabel>
                          <Input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            {...register(`variants.${index}.sellingPrice`, {
                              required: "Selling Price is required",
                              validate: {
                                positive: (val) => {
                                  const num = parseFloat(val)
                                  return isNaN(num) || num <= 0 ? "Selling Price must be positive" : true
                                },
                                lessThanMRP: (val, formVals) => {
                                  const sellingVal = parseFloat(val) || 0
                                  const mrpVal = parseFloat(formVals.variants[index]?.mrp) || 0
                                  return mrpVal >= sellingVal || "MRP cannot be less than Selling Price"
                                }
                              }
                            })}
                          />
                          <FieldError errors={[{ message: getVariantError(index, "sellingPrice") }]} />
                        </Field>
                      </div>

                      <div>
                        <Field data-invalid={!!(errors.variants as any)?.[index]?.offerPrice}>
                          <FieldLabel className="mb-1 block">Offer Price (Optional ₹)</FieldLabel>
                          <Input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            {...register(`variants.${index}.offerPrice`, {
                              validate: (val, formVals) => {
                                if (!val) return true
                                const offerVal = parseFloat(val)
                                if (isNaN(offerVal) || offerVal < 0) return "Offer Price must be positive"
                                const sellingVal = parseFloat(formVals.variants[index]?.sellingPrice) || 0
                                return sellingVal >= offerVal || "Selling Price cannot be less than Offer Price"
                              }
                            })}
                          />
                          <FieldError errors={[{ message: getVariantError(index, "offerPrice") }]} />
                        </Field>
                      </div>

                      <div>
                        <Field>
                          <FieldLabel className="mb-1 block">Cost Price (₹)</FieldLabel>
                          <Input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            {...register(`variants.${index}.costPrice`)}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Step 4: Inventory Control Allocation</h2>
              <div className="space-y-4">
                {variantsValues.map((v: any, index: number) => {
                  const appSt = parseInt(formValues.variants[index]?.appStock) || 0
                  const localSt = parseInt(formValues.variants[index]?.localStock) || 0
                  const total = appSt + localSt

                  return (
                    <div key={index} className="border p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className="text-xs font-bold text-amber-500 font-mono">
                          Variant Size: {getVariantLabel(v.unit, v.unitValue)} &bull; SKU: <code className="font-mono text-zinc-600 dark:text-zinc-400">{v.sku}</code>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Calculated Available Stock:</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm border border-zinc-300 dark:border-zinc-700">
                            {total} Units
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <Field>
                            <FieldLabel className="mb-1 block">App Stock (Digital)</FieldLabel>
                            <Input
                              type="number"
                              min="0"
                              {...register(`variants.${index}.appStock`)}
                            />
                          </Field>
                        </div>

                        <div>
                          <Field>
                            <FieldLabel className="mb-1 block">Local Stock (POS shelf)</FieldLabel>
                            <Input
                              type="number"
                              min="0"
                              {...register(`variants.${index}.localStock`)}
                            />
                          </Field>
                        </div>

                        <div>
                          <Field>
                            <FieldLabel className="mb-1 block">Reserved Stock (Hold)</FieldLabel>
                            <Input
                              type="number"
                              min="0"
                              {...register(`variants.${index}.reservedStock`)}
                            />
                          </Field>
                        </div>

                        <div>
                          <Field>
                            <FieldLabel className="mb-1 block">Minimum Stock</FieldLabel>
                            <Input
                              type="number"
                              min="0"
                              {...register(`variants.${index}.minStock`)}
                            />
                          </Field>
                        </div>

                        <div>
                          <Field>
                            <FieldLabel className="mb-1 block">Reorder Level</FieldLabel>
                            <Input
                              type="number"
                              min="0"
                              {...register(`variants.${index}.reorderLevel`)}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Step 5: Review & Save Product</h2>
              
              {/* Basic Details summary */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">1. Basic specifications</h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-50 dark:bg-zinc-900/50 p-4 border rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground block">Product Name</span>
                    <strong className="text-foreground">{formValues.name}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Selected Category</span>
                    <strong className="text-foreground">
                      {categoriesData?.nodes.find((c: any) => c.id === formValues.categoryId)?.name || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Tax Rate</span>
                    <strong className="text-foreground">
                      {taxRatesData?.nodes.find((t: any) => t.id === formValues.taxId)?.name || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Tags</span>
                    <span className="text-foreground font-mono text-xs">{formValues.tagsInput || "None"}</span>
                  </div>
                </div>
              </div>

              {/* Variants and stock summary */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">2. Variant SKUs & Stocks</h3>
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-2.5 px-4">Size Variant</th>
                        <th className="py-2.5 px-4">SKU</th>
                        <th className="py-2.5 px-4 text-right">MRP</th>
                        <th className="py-2.5 px-4 text-right">Selling Price</th>
                        <th className="py-2.5 px-4 text-center">App Stock</th>
                        <th className="py-2.5 px-4 text-center">Local Stock</th>
                        <th className="py-2.5 px-4 text-center">Reserved</th>
                        <th className="py-2.5 px-4 text-center font-bold">Total Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                      {variantsValues.map((v: any, idx: number) => {
                        const appSt = parseInt(v.appStock) || 0
                        const localSt = parseInt(v.localStock) || 0
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                            <td className="py-3 px-4 text-foreground">{getVariantLabel(v.unit, v.unitValue)}</td>
                            <td className="py-3 px-4 font-mono text-zinc-500">{v.sku}</td>
                            <td className="py-3 px-4 text-right font-mono">₹{(parseFloat(v.mrp) || 0).toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-600">₹{(parseFloat(v.sellingPrice) || 0).toFixed(2)}</td>
                            <td className="py-3 px-4 text-center font-mono">{v.appStock || 0}</td>
                            <td className="py-3 px-4 text-center font-mono">{v.localStock || 0}</td>
                            <td className="py-3 px-4 text-center font-mono">{v.reservedStock || 0}</td>
                            <td className="py-3 px-4 text-center font-mono text-amber-600 font-bold">{appSt + localSt} Units</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action navigation footer buttons */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || createMutation.isPending}
          className="cursor-pointer"
        >
          Back
        </Button>

        {currentStep < 5 ? (
          <Button type="button" onClick={handleNext} className="cursor-pointer">
            Next step <ArrowRightIcon className="ml-1.5 size-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => saveProduct("draft")}
              className="cursor-pointer border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
            >
              {createMutation.isPending && (
                <CircleNotchIcon className="size-4 mr-2 animate-spin" />
              )}
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => saveProduct("active")}
              className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              {createMutation.isPending && (
                <CircleNotchIcon className="size-4 mr-2 animate-spin" />
              )}
              Save & Publish (Active)
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
