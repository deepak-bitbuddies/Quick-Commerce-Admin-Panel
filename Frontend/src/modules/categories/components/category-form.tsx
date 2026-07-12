"use client"

import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"
import {
  CircleNotchIcon,
  InfoIcon,
  ImageIcon,
  GlobeIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { PageHeader } from "@/components/layout/page-header"
import {
  CatalogNodeType,
  CatalogNodeStatus,
  type CatalogNode,
} from "../types/category-types"
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useCategoryQuery,
  useCategoryTreeQuery,
} from "../hooks/use-categories"

const catalogNodeFormSchema = z.object({
  code: z
    .string()
    .min(2, "Name required (min 2)")
    .max(50, "Name too long")
    .regex(/^[A-Z0-9_]+$/, "Code must contain only uppercase letters, numbers, and underscores"),
  name: z.string().min(2, "Name required (min 2)").max(100, "Name too long"),
  slug: z.string().max(100).optional().or(z.literal("")),
  type: z.nativeEnum(CatalogNodeType).default(CatalogNodeType.NORMAL),
  parentId: z.string().nullable().default(null),
  description: z.string().max(500).optional().or(z.literal("")),
  thumbnail: z.string().url("Invalid URL").optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
  banner: z.string().url("Invalid URL").optional().or(z.literal("")),
  coverImage: z.string().url("Invalid URL").optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  status: z.nativeEnum(CatalogNodeStatus).default(CatalogNodeStatus.ACTIVE),
  isFeatured: z.boolean().default(false),
  showInMenu: z.boolean().default(true),
  showOnHome: z.boolean().default(true),
  backgroundColor: z.string().optional().or(z.literal("")),
  accentColor: z.string().optional().or(z.literal("")),
  searchKeywords: z.string().default(""),
  allowedAttributeGroups: z.string().default(""),
  seo: z.object({
    metaTitle: z.string().max(100).optional().or(z.literal("")),
    metaDescription: z.string().max(300).optional().or(z.literal("")),
    metaKeywords: z.string().default(""),
  }),
  visibilityRules: z.object({
    enabled: z.boolean().default(false),
  }),
})

type CatalogNodeFormInput = z.infer<typeof catalogNodeFormSchema>

interface CategoryFormProps {
  nodeId?: string
}

function defaultValuesFor(node?: CatalogNode): CatalogNodeFormInput {
  return {
    code: node?.code ?? "",
    name: node?.name ?? "",
    slug: node?.slug ?? "",
    type: node?.type ?? CatalogNodeType.NORMAL,
    parentId: node?.parentId ?? null,
    description: node?.description ?? "",
    thumbnail: node?.thumbnail ?? "",
    icon: node?.icon ?? "",
    banner: node?.banner ?? "",
    coverImage: node?.coverImage ?? "",
    sortOrder: node?.sortOrder ?? 0,
    status: node?.status ?? CatalogNodeStatus.ACTIVE,
    isFeatured: node?.isFeatured ?? false,
    showInMenu: node?.showInMenu ?? true,
    showOnHome: node?.showOnHome ?? true,
    backgroundColor: node?.backgroundColor ?? "",
    accentColor: node?.accentColor ?? "",
    searchKeywords: node?.searchKeywords ? node.searchKeywords.join(", ") : "",
    allowedAttributeGroups: node?.allowedAttributeGroups ? node.allowedAttributeGroups.join(", ") : "",
    seo: {
      metaTitle: node?.seo?.metaTitle ?? "",
      metaDescription: node?.seo?.metaDescription ?? "",
      metaKeywords: node?.seo?.metaKeywords ? node.seo.metaKeywords.join(", ") : "",
    },
    visibilityRules: {
      enabled: node?.visibilityRules?.enabled ?? false,
    },
  }
}

export function CategoryForm({ nodeId }: CategoryFormProps) {
  const t = useTranslations("Categories")
  const router = useRouter()
  const isEditMode = Boolean(nodeId)
  const [activeTab, setActiveTab] = useState<"basic" | "assets" | "seo">("basic")

  // Fetch target edit node details
  const { data: nodeData, isLoading: detailLoading } = useCategoryQuery(nodeId || "", isEditMode)

  // Fetch tree/list nodes for parent selector candidates
  const treeQuery = useCategoryTreeQuery()
  const allNodes = treeQuery.data || []

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof catalogNodeFormSchema>>({
    resolver: zodResolver(catalogNodeFormSchema),
    defaultValues: defaultValuesFor(nodeData),
  })

  useEffect(() => {
    if (nodeData) {
      reset(defaultValuesFor(nodeData))
    }
  }, [nodeData, reset])

  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const isPending = createMutation.isPending || updateMutation.isPending

  // Filter candidates for parentId (exclude self and self's descendants to prevent loops)
  const parentCandidates = allNodes.filter((candidate) => {
    if (!isEditMode || !nodeId) return true
    if (candidate.id === nodeId) return false
    // Exclude descendants
    return !candidate.path.startsWith(`/${nodeId}`) && !candidate.path.includes(`/${nodeId}/`)
  })

  const onSubmit = handleSubmit((values) => {
    const keywordsArray = values.searchKeywords
      ? values.searchKeywords.split(",").map((k: string) => k.trim()).filter(Boolean)
      : []
    const attributesArray = values.allowedAttributeGroups
      ? values.allowedAttributeGroups.split(",").map((a: string) => a.trim()).filter(Boolean)
      : []
    const seoKeywordsArray = values.seo.metaKeywords
      ? values.seo.metaKeywords.split(",").map((k: string) => k.trim()).filter(Boolean)
      : []

    const payload = {
      ...values,
      searchKeywords: keywordsArray,
      allowedAttributeGroups: attributesArray,
      seo: {
        ...values.seo,
        metaKeywords: seoKeywordsArray,
      },
    }

    if (isEditMode && nodeId) {
      updateMutation.mutate(
        { id: nodeId, input: payload },
        {
          onSuccess: () => {
            toast.success("Catalog node updated successfully")
            router.push("/categories")
          },
          onError: (err) => {
            toast.error(err.message || "Failed to update catalog node")
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Catalog node created successfully")
          router.push("/categories")
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create catalog node")
        },
      })
    }
  })

  if (isEditMode && detailLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotchIcon className="size-8 animate-spin text-primary" />
        <p className="text-xs text-zinc-500 mt-2">Loading catalog node details...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/categories")}
          className="rounded-full cursor-pointer shrink-0"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <PageHeader
          title={isEditMode ? t("editNode") : t("createNode")}
          description={t("pageDescription")}
        />
      </div>

      <Card className="p-0">
        {/* Custom Tab list */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-all ${activeTab === "basic"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
          >
            <InfoIcon className="size-4" />
            General info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assets")}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-all ${activeTab === "assets"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
          >
            <ImageIcon className="size-4" />
            Media & Keywords
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-all ${activeTab === "seo"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
          >
            <GlobeIcon className="size-4" />
            SEO & Rules
          </button>
        </div>

        <CardContent className="px-6 pt-4 pb-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {activeTab === "basic" && (
              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldName")}</FieldLabel>
                      <Input {...field} placeholder="e.g. Fresh Fruits" />
                      {errors.name && <FieldError>{String(errors.name.message)}</FieldError>}
                    </Field>
                  )}
                />

                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldCode")}</FieldLabel>
                      <Input {...field} placeholder="e.g. FRESH_FRUITS" className="uppercase" />
                      {errors.code && <FieldError>{String(errors.code.message)}</FieldError>}
                    </Field>
                  )}
                />

                <Controller
                  name="slug"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldSlug")}</FieldLabel>
                      <Input {...field} placeholder="e.g. fresh-fruits" />
                      {errors.slug && <FieldError>{String(errors.slug.message)}</FieldError>}
                    </Field>
                  )}
                />

                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldType")}</FieldLabel>
                      <select
                        {...field}
                        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        {Object.values(CatalogNodeType).map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                />

                <Controller
                  name="parentId"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldParent")}</FieldLabel>
                      <select
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <option value="">[ None - Root Node ]</option>
                        {parentCandidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {"—".repeat(c.level)} {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                />

                <Controller
                  name="sortOrder"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldSortOrder")}</FieldLabel>
                      <Input
                        {...field}
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        type="number"
                      />
                      {errors.sortOrder && <FieldError>{String(errors.sortOrder.message)}</FieldError>}
                    </Field>
                  )}
                />

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldStatus")}</FieldLabel>
                      <select
                        {...field}
                        className="flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        {Object.values(CatalogNodeStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                />

                <div className="sm:col-span-2 grid grid-cols-2 gap-4 mt-2 border-t pt-4 dark:border-zinc-800">
                  <Controller
                    name="backgroundColor"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("fieldBgColor")}</FieldLabel>
                        <div className="flex gap-2 items-center">
                          <Input {...field} placeholder="#FFFFFF" className="flex-1" />
                          <input
                            type="color"
                            value={field.value?.startsWith("#") ? field.value : "#ffffff"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="size-9 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                      </Field>
                    )}
                  />

                  <Controller
                    name="accentColor"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("fieldAccentColor")}</FieldLabel>
                        <div className="flex gap-2 items-center">
                          <Input {...field} placeholder="#FFBE00" className="flex-1" />
                          <input
                            type="color"
                            value={field.value?.startsWith("#") ? field.value : "#ffbe00"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="size-9 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                      </Field>
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("fieldDescription")}</FieldLabel>
                        <Textarea {...field} placeholder="A short description of this catalog node" rows={3} />
                        {errors.description && <FieldError>{String(errors.description.message)}</FieldError>}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            )}

            {activeTab === "assets" && (
              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Controller
                  name="thumbnail"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldThumbnail")}</FieldLabel>
                      <Input {...field} placeholder="https://..." />
                      {errors.thumbnail && <FieldError>{String(errors.thumbnail.message)}</FieldError>}
                    </Field>
                  )}
                />

                <Controller
                  name="icon"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldIcon")}</FieldLabel>
                      <Input {...field} placeholder="https://... or vector-slug" />
                      {errors.icon && <FieldError>{String(errors.icon.message)}</FieldError>}
                    </Field>
                  )}
                />

                <Controller
                  name="banner"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldBanner")}</FieldLabel>
                      <Input {...field} placeholder="https://..." />
                      {errors.banner && <FieldError>{String(errors.banner.message)}</FieldError>}
                    </Field>
                  )}
                />

                <Controller
                  name="coverImage"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("fieldCoverImage")}</FieldLabel>
                      <Input {...field} placeholder="https://..." />
                      {errors.coverImage && <FieldError>{String(errors.coverImage.message)}</FieldError>}
                    </Field>
                  )}
                />

                <div className="sm:col-span-2 border-t pt-4 dark:border-zinc-800">
                  <Controller
                    name="searchKeywords"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("fieldKeywords")}</FieldLabel>
                        <Input {...field} placeholder="e.g. dairy, milk, cheese, cow milk" />
                      </Field>
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Controller
                    name="allowedAttributeGroups"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("fieldAttributes")}</FieldLabel>
                        <Input {...field} placeholder="e.g. color, capacity, freshness, brand" />
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            )}

            {activeTab === "seo" && (
              <div className="space-y-6">
                <FieldSet>
                  <legend className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-3">
                    {t("seoHeading")}
                  </legend>
                  <FieldGroup className="grid grid-cols-1 gap-4">
                    <Controller
                      name="seo.metaTitle"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>{t("fieldMetaTitle")}</FieldLabel>
                          <Input {...field} placeholder="SEO title tag" />
                        </Field>
                      )}
                    />

                    <Controller
                      name="seo.metaDescription"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>{t("fieldMetaDescription")}</FieldLabel>
                          <Textarea {...field} placeholder="SEO meta description snippet" rows={3} />
                        </Field>
                      )}
                    />

                    <Controller
                      name="seo.metaKeywords"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>{t("fieldMetaKeywords")}</FieldLabel>
                          <Input {...field} placeholder="e.g. buy fresh milk online, dairy catalog" />
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </FieldSet>

                <FieldSet className="border-t pt-4 dark:border-zinc-800">
                  <legend className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-3">
                    {t("visibilityHeading")}
                  </legend>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {t("fieldVisibilityEnabled")}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Configure store/city visibility scoping for geofencing rules.
                      </p>
                    </div>
                    <Controller
                      name="visibilityRules.enabled"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${field.value ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block size-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${field.value ? "translate-x-4.5" : "translate-x-0"
                              }`}
                          />
                        </button>
                      )}
                    />
                  </div>
                </FieldSet>

                <FieldSet className="border-t pt-4 dark:border-zinc-800">
                  <legend className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-3">
                    Customer App UI Visibility
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Featured</span>
                      <Controller
                        name="isFeatured"
                        control={control}
                        render={({ field }) => (
                          <button
                            type="button"
                            onClick={() => field.onChange(!field.value)}
                            className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${field.value ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                              }`}
                          >
                            <span className={`inline-block size-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${field.value ? "translate-x-4.5" : "translate-x-0"}`} />
                          </button>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Menu</span>
                      <Controller
                        name="showInMenu"
                        control={control}
                        render={({ field }) => (
                          <button
                            type="button"
                            onClick={() => field.onChange(!field.value)}
                            className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${field.value ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                              }`}
                          >
                            <span className={`inline-block size-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${field.value ? "translate-x-4.5" : "translate-x-0"}`} />
                          </button>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Home Feed</span>
                      <Controller
                        name="showOnHome"
                        control={control}
                        render={({ field }) => (
                          <button
                            type="button"
                            onClick={() => field.onChange(!field.value)}
                            className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${field.value ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                              }`}
                          >
                            <span className={`inline-block size-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${field.value ? "translate-x-4.5" : "translate-x-0"}`} />
                          </button>
                        )}
                      />
                    </div>
                  </div>
                </FieldSet>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t pt-5 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => router.push("/categories")} disabled={isPending}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <CircleNotchIcon className="size-4 animate-spin mr-2" />}
                {t("saveChanges")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
