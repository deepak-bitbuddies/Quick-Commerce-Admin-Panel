"use client"

import { use, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  CaretLeftIcon,
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  TagIcon,
  QuestionIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  DotsThreeIcon,
  CopyIcon,
  NotebookIcon,
  SparkleIcon,
  InfoIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/layout/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ReasonInputDialog, StockOperationsDialog } from "@/components/feedback"

import {
  useProductQuery,
  useProductFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useProductReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useBadgesQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRestoreProductMutation,
  usePermanentlyDeleteProductMutation,
  useAddVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useDuplicateVariantMutation,
  useAdjustStockMutation,
  useTransferStockMutation,
  useStockHistoryQuery,
} from "@/modules/products/hooks/use-products"
import { useCategoriesQuery } from "@/modules/categories/hooks/use-categories"
import { useBrandsQuery } from "@/modules/brands/hooks/use-brands"
import { useTaxRatesQuery } from "@/modules/tax-rates/hooks/use-tax-rates"
import type { ProductFaq, ProductReview, ProductVariant } from "@/modules/products/types/product"
import type { ApiErrorPayload } from "@/lib/axios"

interface PageProps {
  params: Promise<{ productId: string }>
}

type TabType = "overview" | "variants" | "inventory" | "activity" | "faqs" | "reviews" | "settings"

const getVariantLabel = (unit: string, value: number) => {
  const u = unit.toUpperCase()
  if (u === "PCS") {
    return value > 1 ? `Pack of ${value}` : `1 PCS`
  }
  return `${value} ${u}`
}

export default function ProductDetailPage({ params }: PageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  const productId = resolvedParams.productId

  // Active tab state: defaults to overview, but respects query param or URL hash
  const [activeTab, setActiveTab] = useState<TabType>("overview")

  useEffect(() => {
    const editParam = searchParams.get("edit")
    if (editParam === "true") {
      setActiveTab("overview")
      setIsEditingOverview(true)
    }
  }, [searchParams])

  // Queries
  const { data: product, isLoading: isProductLoading } = useProductQuery(productId)
  const { data: faqs, isLoading: isFaqsLoading } = useProductFaqsQuery(productId)
  const { data: reviews, isLoading: isReviewsLoading } = useProductReviewsQuery(productId)
  const { data: categoriesData } = useCategoriesQuery({ page: 1, pageSize: 100 })
  const { data: brandsData } = useBrandsQuery({ page: 1, pageSize: 100 })
  const { data: taxRatesData } = useTaxRatesQuery({ page: 1, pageSize: 100 })
  const { data: badgesData } = useBadgesQuery({ page: 1, pageSize: 100 })

  // Variant Stock History selection
  const [selectedVariantIdForHistory, setSelectedVariantIdForHistory] = useState<string>("")
  const { data: stockHistory, isLoading: isHistoryLoading } = useStockHistoryQuery(selectedVariantIdForHistory)

  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariantIdForHistory) {
      setSelectedVariantIdForHistory(product.variants[0].id)
    }
  }, [product, selectedVariantIdForHistory])

  const updateProductMutation = useUpdateProductMutation()
  const deleteProductMutation = useDeleteProductMutation()
  const restoreProductMutation = useRestoreProductMutation()
  const permanentlyDeleteProductMutation = usePermanentlyDeleteProductMutation()
  const addVariantMutation = useAddVariantMutation()
  const updateVariantMutation = useUpdateVariantMutation()
  const deleteVariantMutation = useDeleteVariantMutation()
  const duplicateVariantMutation = useDuplicateVariantMutation()
  const adjustStockMutation = useAdjustStockMutation()
  const transferStockMutation = useTransferStockMutation()

  const createFaqMutation = useCreateFaqMutation()
  const updateFaqMutation = useUpdateFaqMutation()
  const deleteFaqMutation = useDeleteFaqMutation()

  const createReviewMutation = useCreateReviewMutation()
  const updateReviewMutation = useUpdateReviewMutation()
  const deleteReviewMutation = useDeleteReviewMutation()

  // Reusable Dialog visibility states
  const [archiveReasonOpen, setArchiveReasonOpen] = useState(false)
  const [stockOpOpen, setStockOpOpen] = useState(false)
  const [stockOpMode, setStockOpMode] = useState<"adjust" | "transfer">("adjust")
  const [selectedVariantForOp, setSelectedVariantForOp] = useState<ProductVariant | null>(null)

  // Overview edit modal/states
  const [isEditingOverview, setIsEditingOverview] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategoryId, setEditCategoryId] = useState("")
  const [editSubCategoryId, setEditSubCategoryId] = useState("")
  const [editBrandId, setEditBrandId] = useState("")
  const [editTaxId, setEditTaxId] = useState("")
  const [editBadgeIds, setEditBadgeIds] = useState<string[]>([])
  const [editPrimaryImage, setEditPrimaryImage] = useState("")
  const [editGalleryImages, setEditGalleryImages] = useState<string[]>([])
  const [newEditGalleryUrl, setNewEditGalleryUrl] = useState("")

  const handleAddEditGalleryUrl = () => {
    if (!newEditGalleryUrl.trim()) return
    setEditGalleryImages([...editGalleryImages, newEditGalleryUrl.trim()])
    setNewEditGalleryUrl("")
  }

  const handleRemoveEditGalleryUrl = (idx: number) => {
    const updated = [...editGalleryImages]
    updated.splice(idx, 1)
    setEditGalleryImages(updated)
  }

  // SEO Tab edit states
  const [seoMetaTitle, setSeoMetaTitle] = useState("")
  const [seoMetaDescription, setSeoMetaDescription] = useState("")
  const [seoSlug, setSeoSlug] = useState("")

  // Tags edit states
  const [tagsInput, setTagsInput] = useState("")

  // Variant Modal states
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantUnit, setVariantUnit] = useState("gm")
  const [variantUnitValue, setVariantUnitValue] = useState("500")
  const [variantSku, setVariantSku] = useState("")
  const [variantMrp, setVariantMrp] = useState("")
  const [variantSellingPrice, setVariantSellingPrice] = useState("")
  const [variantOfferPrice, setVariantOfferPrice] = useState("")
  const [variantCostPrice, setVariantCostPrice] = useState("")
  const [variantPrimaryImage, setVariantPrimaryImage] = useState("")
  const [variantIsDefault, setVariantIsDefault] = useState(false)
  const [variantSortOrder, setVariantSortOrder] = useState("0")

  // FAQ Modal states
  const [faqModalOpen, setFaqModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<ProductFaq | null>(null)
  const [faqQuestion, setFaqQuestion] = useState("")
  const [faqAnswer, setFaqAnswer] = useState("")
  const [faqSortOrder, setFaqSortOrder] = useState("0")
  const [faqStatus, setFaqStatus] = useState<"active" | "inactive">("active")

  // Review Modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null)
  const [reviewCustomerName, setReviewCustomerName] = useState("")
  const [reviewRating, setReviewRating] = useState("5")
  const [reviewText, setReviewText] = useState("")
  const [reviewStatus, setReviewStatus] = useState<"pending" | "approved" | "rejected">("approved")
  const [reviewVerified, setReviewVerified] = useState(false)
  const [reviewAdminReply, setReviewAdminReply] = useState("")
  const [newReviewImageUrl, setNewReviewImageUrl] = useState("")
  const [reviewImagesList, setReviewImagesList] = useState<string[]>([])

  // Sync state values when product query completes
  useEffect(() => {
    if (product) {
      setEditName(product.name)
      setEditDescription(product.description || "")
      setEditCategoryId(product.categoryId)
      setEditSubCategoryId(product.subCategoryId || "")
      setEditBrandId(product.brandId)
      setEditTaxId(product.taxId)
      setEditBadgeIds(product.badgeIds || [])
      setEditPrimaryImage(product.primaryImage || "")
      setEditGalleryImages(product.galleryImages || [])
      setSeoMetaTitle(product.seo?.metaTitle || "")
      setSeoMetaDescription(product.seo?.metaDescription || "")
      setSeoSlug(product.seo?.slug || "")
      setTagsInput(product.tags?.join(", ") || "")
    }
  }, [product])

  if (isProductLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-sm font-semibold text-muted-foreground animate-pulse flex items-center gap-2">
          <CircleNotchIcon className="size-4 animate-spin text-amber-500" />
          Loading product catalog details...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/products")} className="cursor-pointer">
          <CaretLeftIcon className="size-4 mr-1.5" /> Back to Products Catalog
        </Button>
        <div className="p-12 text-center border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
          <span className="text-sm font-semibold text-red-500">Product details not found or archived.</span>
        </div>
      </div>
    )
  }

  const category = categoriesData?.nodes.find((c) => c.id === product.categoryId)
  const subCategory = categoriesData?.nodes.find((c) => c.id === product.subCategoryId)
  const brand = brandsData?.brands.find((b) => b.id === product.brandId)
  const activeBadges = badgesData?.badges || []
  const productBadges = product.badgeIds ? activeBadges.filter((b) => product.badgeIds.includes(b.id)) : []

  // FAQ CRUD handlers
  const handleOpenFaqModal = (faq?: ProductFaq) => {
    if (faq) {
      setEditingFaq(faq)
      setFaqQuestion(faq.question)
      setFaqAnswer(faq.answer)
      setFaqSortOrder(String(faq.sortOrder))
      setFaqStatus(faq.status)
    } else {
      setEditingFaq(null)
      setFaqQuestion("")
      setFaqAnswer("")
      setFaqSortOrder("0")
      setFaqStatus("active")
    }
    setFaqModalOpen(true)
  }

  const handleSaveFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast.error("Please fill in both question and answer")
      return
    }

    const payload = {
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
      sortOrder: parseInt(faqSortOrder) || 0,
      status: faqStatus,
    }

    if (editingFaq) {
      updateFaqMutation.mutate(
        { faqId: editingFaq._id, productId: product.id, input: payload },
        {
          onSuccess: () => {
            toast.success("FAQ updated successfully")
            setFaqModalOpen(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to update FAQ")
          },
        }
      )
    } else {
      createFaqMutation.mutate(
        { productId: product.id, input: payload },
        {
          onSuccess: () => {
            toast.success("FAQ added successfully")
            setFaqModalOpen(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to add FAQ")
          },
        }
      )
    }
  }

  const handleDeleteFaq = (faqId: string) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      deleteFaqMutation.mutate(
        { faqId, productId: product.id },
        {
          onSuccess: () => {
            toast.success("FAQ deleted successfully")
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to delete FAQ")
          },
        }
      )
    }
  }

  // Review CRUD handlers
  const handleOpenReviewModal = (review?: ProductReview) => {
    if (review) {
      setEditingReview(review)
      setReviewCustomerName(review.customerName)
      setReviewRating(String(review.rating))
      setReviewText(review.reviewText)
      setReviewStatus(review.status)
      setReviewVerified(review.isVerifiedPurchase || false)
      setReviewAdminReply(review.adminReply || "")
      setReviewImagesList(review.reviewImages || [])
    } else {
      setEditingReview(null)
      setReviewCustomerName("")
      setReviewRating("5")
      setReviewText("")
      setReviewStatus("approved")
      setReviewVerified(false)
      setReviewAdminReply("")
      setReviewImagesList([])
    }
    setReviewModalOpen(true)
  }

  const handleSaveReview = () => {
    if (!reviewCustomerName.trim()) {
      toast.error("Please enter a customer name")
      return
    }

    const payload = {
      customerName: reviewCustomerName.trim(),
      rating: parseInt(reviewRating) || 5,
      reviewText: reviewText.trim(),
      status: reviewStatus,
      isVerifiedPurchase: reviewVerified,
      adminReply: reviewAdminReply.trim(),
      reviewImages: reviewImagesList,
    }

    if (editingReview) {
      updateReviewMutation.mutate(
        { reviewId: editingReview._id, productId: product.id, input: payload },
        {
          onSuccess: () => {
            toast.success("Review updated successfully")
            setReviewModalOpen(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to update review")
          },
        }
      )
    } else {
      createReviewMutation.mutate(
        { productId: product.id, input: payload },
        {
          onSuccess: () => {
            toast.success("Review added successfully")
            setReviewModalOpen(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to add review")
          },
        }
      )
    }
  }

  const handleDeleteReview = (reviewId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(
        { reviewId, productId: product.id },
        {
          onSuccess: () => {
            toast.success("Review deleted successfully")
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to delete review")
          },
        }
      )
    }
  }

  // Stock operations triggering
  const triggerStockOp = (variant: ProductVariant, mode: "adjust" | "transfer") => {
    setSelectedVariantForOp(variant)
    setStockOpMode(mode)
    setStockOpOpen(true)
  }

  const handleStockOpConfirm = async (values: any) => {
    if (!selectedVariantForOp) return

    if (stockOpMode === "adjust") {
      adjustStockMutation.mutate(
        {
          variantId: selectedVariantForOp.id,
          qtyChanged: values.qtyChanged,
          type: values.type,
          poolAffected: values.poolAffected,
          reason: values.reason || undefined,
          reference: values.reference || "MANUAL_ADJUSTMENT",
        },
        {
          onSuccess: () => {
            toast.success("Inventory stock adjusted successfully")
            setStockOpOpen(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to adjust stock balance")
          },
        }
      )
    } else {
      // Transfer app <-> local
      transferStockMutation.mutate(
        {
          variantId: selectedVariantForOp.id,
          qty: Math.abs(values.qtyChanged),
          direction: values.transferDirection,
          reason: values.reason || undefined,
          reference: "TRANSFER",
        },
        {
          onSuccess: () => {
            toast.success("Stock transferred successfully between pools")
            setStockOpOpen(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to transfer inventory stock")
          },
        }
      )
    }
  }

  // Archive trigger
  const handleArchiveProductClick = () => {
    setArchiveReasonOpen(true)
  }

  const handleArchiveConfirm = async (reason: string) => {
    deleteProductMutation.mutate(
      { productId: product.id, reason },
      {
        onSuccess: () => {
          toast.success("Product successfully soft-deleted and archived")
          setArchiveReasonOpen(false)
          router.push("/products")
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to archive product master")
        },
      }
    )
  }

  const handleRestoreProductClick = () => {
    if (confirm(`Are you sure you want to restore "${product.name}"? It will be reset to Draft status.`)) {
      restoreProductMutation.mutate(product.id, {
        onSuccess: () => {
          toast.success(`"${product.name}" restored successfully to Draft products.`)
          router.push("/products")
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to restore product")
        }
      })
    }
  }

  const handlePermanentDeleteProductClick = () => {
    if (confirm(`WARNING: Are you sure you want to PERMANENTLY delete "${product.name}"? This action CANNOT be undone and will delete all variants and stock data.`)) {
      permanentlyDeleteProductMutation.mutate(product.id, {
        onSuccess: () => {
          toast.success(`"${product.name}" permanently deleted.`)
          router.push("/products")
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to delete product permanently")
        }
      })
    }
  }

  // Overview form update handler
  const handleUpdateOverview = () => {
    if (!editName.trim()) {
      toast.error("Product name is required")
      return
    }

    const payload = {
      name: editName.trim(),
      description: editDescription.trim(),
      categoryId: editCategoryId,
      subCategoryId: editSubCategoryId || null,
      brandId: editBrandId,
      taxId: editTaxId,
      badgeIds: editBadgeIds,
      primaryImage: editPrimaryImage.trim() || null,
      galleryImages: editGalleryImages,
    }

    updateProductMutation.mutate(
      { productId: product.id, input: payload as any },
      {
        onSuccess: () => {
          toast.success("Basic details updated successfully")
          setIsEditingOverview(false)
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to update product details")
        },
      }
    )
  }

  // Update Settings values (SEO, status, tags)
  const handleSaveSettings = () => {
    const tags = tagsInput
      ? tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : []

    const payload = {
      status: product.status, // updated dynamically or explicitly
      tags,
      seo: {
        metaTitle: seoMetaTitle.trim() || undefined,
        metaDescription: seoMetaDescription.trim() || undefined,
        slug: seoSlug.trim() || product.seo.slug,
        keywords: tags,
      },
    }

    updateProductMutation.mutate(
      { productId: product.id, input: payload },
      {
        onSuccess: () => {
          toast.success("Settings updated successfully")
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to update product settings")
        },
      }
    )
  }

  const handleStatusUpdate = (status: any) => {
    updateProductMutation.mutate(
      { productId: product.id, input: { status } },
      {
        onSuccess: () => {
          toast.success(`Product status set to: ${status.toUpperCase()}`)
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to change product status")
        },
      }
    )
  }

  // Variant CRUD modal triggers
  const handleOpenVariantModal = (v?: ProductVariant) => {
    if (v) {
      setEditingVariant(v)
      setVariantUnit(v.unit)
      setVariantUnitValue(String(v.unitValue))
      setVariantSku(v.sku)
      setVariantMrp(String(v.mrp / 100))
      setVariantSellingPrice(String(v.sellingPrice / 100))
      setVariantOfferPrice(v.offerPrice ? String(v.offerPrice / 100) : "")
      setVariantCostPrice(String(v.costPrice / 100))
      setVariantPrimaryImage(v.primaryImage || "")
      setVariantIsDefault(v.isDefault)
      setVariantSortOrder(String(v.sortOrder))
    } else {
      setEditingVariant(null)
      setVariantUnit("gm")
      setVariantUnitValue("500")
      // Auto build SKU base
      const cleanName = product.name.toUpperCase().replace(/[^A-Z0-9]/g, "")
      const prefix = cleanName.slice(0, 6) || "SKU"
      setVariantSku(`${prefix}-500GM-${String((product.variants?.length || 0) + 1).padStart(4, "0")}`)
      setVariantMrp("")
      setVariantSellingPrice("")
      setVariantOfferPrice("")
      setVariantCostPrice("")
      setVariantPrimaryImage("")
      setVariantIsDefault(false)
      setVariantSortOrder(String(product.variants?.length || 0))
    }
    setVariantModalOpen(true)
  }

  // Handle Save Variant (Create or Edit)
  const handleSaveVariant = () => {
    if (!variantSku.trim() || !variantUnitValue) {
      toast.error("SKU and Unit value are required")
      return
    }

    const mrpVal = parseFloat(variantMrp) || 0
    const sellingVal = parseFloat(variantSellingPrice) || 0
    const offerVal = parseFloat(variantOfferPrice) || 0
    const costVal = parseFloat(variantCostPrice) || 0

    if (mrpVal <= 0 || sellingVal <= 0) {
      toast.error("MRP and Selling prices must be positive numbers")
      return
    }
    if (mrpVal < sellingVal) {
      toast.error("MRP cannot be less than Selling Price")
      return
    }
    if (variantOfferPrice && sellingVal < offerVal) {
      toast.error("Selling Price cannot be less than Offer Price")
      return
    }

    const payload = {
      unit: variantUnit,
      unitValue: parseFloat(variantUnitValue) || 1,
      sku: variantSku.toUpperCase().trim(),
      mrp: Math.round(mrpVal * 100),
      sellingPrice: Math.round(sellingVal * 100),
      offerPrice: variantOfferPrice ? Math.round(offerVal * 100) : undefined,
      costPrice: Math.round(costVal * 100),
      primaryImage: variantPrimaryImage.trim() || undefined,
      isDefault: variantIsDefault,
      sortOrder: parseInt(variantSortOrder) || 0,
    }

    if (editingVariant) {
      updateVariantMutation.mutate(
        { variantId: editingVariant.id, productId: product.id, input: payload },
        {
          onSuccess: () => {
            toast.success("Variant specification updated successfully")
            setVariantModalOpen(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to update variant SKU")
          },
        }
      )
    } else {
      addVariantMutation.mutate(
        { productId: product.id, input: payload },
        {
          onSuccess: () => {
            toast.success("New variant SKU created successfully")
            setVariantModalOpen(false)
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to create variant SKU")
          },
        }
      )
    }
  }

  // Duplicate Variant
  const handleDuplicateVariant = (v: ProductVariant) => {
    duplicateVariantMutation.mutate(
      { variantId: v.id, productId: product.id },
      {
        onSuccess: () => {
          toast.success("Variant duplicated successfully")
        },
        onError: (err: ApiErrorPayload) => {
          toast.error(err.message || "Failed to duplicate variant")
        },
      }
    )
  }

  // Archive Variant
  const handleDeleteVariant = (v: ProductVariant) => {
    if (confirm(`Are you sure you want to archive variant SKU: ${v.sku}?`)) {
      deleteVariantMutation.mutate(
        { variantId: v.id, productId: product.id },
        {
          onSuccess: () => {
            toast.success("Variant SKU archived successfully")
          },
          onError: (err: ApiErrorPayload) => {
            toast.error(err.message || "Failed to archive variant")
          },
        }
      )
    }
  }

  // Auto SKU trigger when unit or value changes in modal
  const handleModalUnitChange = (unit: string, value: string) => {
    setVariantUnit(unit)
    setVariantUnitValue(value)
    const cleanName = product.name.toUpperCase().replace(/[^A-Z0-9]/g, "")
    const prefix = cleanName.slice(0, 6) || "SKU"
    let suffix = unit.toUpperCase()
    if (suffix === "LITRE") suffix = "L"
    const autoSku = `${prefix}-${value}${suffix}-${String((product.variants?.length || 0) + 1).padStart(4, "0")}`
    setVariantSku(autoSku)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/products")} className="cursor-pointer">
          <CaretLeftIcon className="size-5" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <Badge
              variant={
                product.status === "active"
                  ? "default"
                  : product.status === "draft"
                  ? "secondary"
                  : "destructive"
              }
              className="capitalize"
            >
              {product.status}
            </Badge>
            {productBadges.map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide shadow-sm"
                style={{
                  backgroundColor: badge.color,
                  color: badge.textColor,
                }}
              >
                {badge.name}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground mt-0.5">
            Category: <span className="text-foreground font-semibold">{category?.name || "N/A"}</span> &bull; 
            Brand: <span className="text-foreground font-semibold">{brand?.name || "N/A"}</span>
          </span>
        </div>
      </div>

      {/* Detail Tabs menu bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 flex-wrap overflow-x-auto">
        {(["overview", "variants", "inventory", "activity", "faqs", "reviews", "settings"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer capitalize whitespace-nowrap ${
              activeTab === tab
                ? "border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab}
            {tab === "variants" && ` (${product.variants?.length ?? 0})`}
            {tab === "faqs" && ` (${faqs?.length ?? 0})`}
            {tab === "reviews" && ` (${reviews?.length ?? 0})`}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Catalog details</CardTitle>
                {!isEditingOverview && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingOverview(true)} className="cursor-pointer">
                    <PencilSimpleIcon className="mr-1.5 size-3.5" /> Edit Basic Details
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingOverview ? (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-name" className="text-xs font-bold">Product Name</Label>
                      <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-cat" className="text-xs font-bold">Category</Label>
                        <select
                          id="edit-cat"
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                        >
                          {categoriesData?.nodes.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="edit-brand" className="text-xs font-bold">Brand</Label>
                        <select
                          id="edit-brand"
                          value={editBrandId}
                          onChange={(e) => setEditBrandId(e.target.value)}
                          className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                        >
                          {brandsData?.brands.map((b: any) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-tax" className="text-xs font-bold">Tax Rate</Label>
                        <select
                          id="edit-tax"
                          value={editTaxId}
                          onChange={(e) => setEditTaxId(e.target.value)}
                          className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                        >
                          {taxRatesData?.nodes.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.igst}%)</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="edit-subcat" className="text-xs font-bold">Sub Category</Label>
                        <select
                          id="edit-subcat"
                          value={editSubCategoryId}
                          onChange={(e) => setEditSubCategoryId(e.target.value)}
                          className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                        >
                          <option value="">None</option>
                          {categoriesData?.nodes
                            .filter((c: any) => c.parentId === editCategoryId && editCategoryId !== "")
                            .map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-primary-image" className="text-xs font-bold">Primary Image URL</Label>
                        <Input
                          id="edit-primary-image"
                          value={editPrimaryImage}
                          onChange={(e) => setEditPrimaryImage(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                        {editPrimaryImage && editPrimaryImage.startsWith("http") && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={editPrimaryImage} alt="Primary Preview" className="size-20 rounded object-cover border mt-1" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Gallery Images</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://example.com/gallery-image.jpg"
                            value={newEditGalleryUrl}
                            onChange={(e) => setNewEditGalleryUrl(e.target.value)}
                          />
                          <Button type="button" variant="secondary" onClick={handleAddEditGalleryUrl} className="cursor-pointer h-10">Add</Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-1">
                          {editGalleryImages.map((url, idx) => (
                            <div key={idx} className="relative group border rounded overflow-hidden h-12">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveEditGalleryUrl(idx)}
                                className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer hover:bg-red-700"
                              >
                                <TrashIcon className="size-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-desc" className="text-xs font-bold">Description</Label>
                      <Textarea id="edit-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setIsEditingOverview(false)} className="cursor-pointer">Cancel</Button>
                      <Button size="sm" onClick={handleUpdateOverview} disabled={updateProductMutation.isPending} className="cursor-pointer bg-amber-500 text-white">
                        {updateProductMutation.isPending && <CircleNotchIcon className="size-3 animate-spin mr-1" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground block mb-0.5">Product Name</Label>
                        <div className="text-sm font-semibold text-foreground">{product.name}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground block mb-0.5">Availability Status</Label>
                        <div className="text-sm font-semibold text-foreground capitalize">{product.availability.replace("_", " ")}</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground block mb-0.5">Category</Label>
                        <div className="text-sm font-semibold text-foreground">{category?.name || "N/A"}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground block mb-0.5">Sub Category</Label>
                        <div className="text-sm font-semibold text-foreground">{subCategory?.name || "None"}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground block mb-0.5">Brand</Label>
                        <div className="text-sm font-semibold text-foreground">{brand?.name || "N/A"}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground block mb-0.5">Tax Rate</Label>
                        <div className="text-sm font-semibold text-foreground">
                          {taxRatesData?.nodes.find((t: any) => t.id === product.taxId)?.name || "N/A"}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs text-muted-foreground block mb-0.5">Product Description</Label>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                        {product.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Media display */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Catalog Media</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                {product.primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.primaryImage}
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded-lg border ring-1 ring-foreground/5 shadow-sm"
                  />
                ) : (
                  <div className="flex aspect-square w-full flex-col items-center justify-center rounded-lg bg-muted text-muted-foreground border border-dashed">
                    <TagIcon className="size-10 stroke-1 mb-2" />
                    <span className="text-xs">No media configured</span>
                  </div>
                )}
                {product.galleryImages && product.galleryImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3 w-full">
                    {product.galleryImages.map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="aspect-square object-cover rounded-md border"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Variants tab */}
      {activeTab === "variants" && (
        <Card className="animate-in fade-in duration-200 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4 flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Variant SKU Sizing Matrix</CardTitle>
              <p className="text-[10px] text-muted-foreground">Define custom size parameters, cost rates, default SKU toggles, and images.</p>
            </div>
            <Button size="sm" onClick={() => handleOpenVariantModal()} className="cursor-pointer bg-amber-500 text-white">
              <PlusIcon className="mr-1.5 size-4" /> Create Variant SKU
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {!product.variants || product.variants.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                No SKU variants configured for this product master catalog.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">SKU / Size Label</th>
                      <th className="p-4 text-right">Cost Price</th>
                      <th className="p-4 text-right">MRP</th>
                      <th className="p-4 text-right">Selling Price</th>
                      <th className="p-4 text-center">Default Status</th>
                      <th className="p-4 text-center">Display Order</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {product.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                        <td className="p-4 flex items-center gap-3">
                          {/* Fallback image check */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={v.primaryImage || product.primaryImage || ""}
                            alt=""
                            className="size-10 object-cover rounded border"
                          />
                          <div>
                            <span className="font-bold text-foreground block">{getVariantLabel(v.unit, v.unitValue)}</span>
                            <code className="text-[10px] text-muted-foreground font-mono">{v.sku}</code>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-zinc-500">₹{(v.costPrice / 100).toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-zinc-500">₹{(v.mrp / 100).toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-semibold text-emerald-600">₹{(v.sellingPrice / 100).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          {v.isDefault ? (
                            <Badge variant="default" className="text-[9px] uppercase">Default</Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Secondary</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-mono text-muted-foreground">{v.sortOrder}</td>
                        <td className="p-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                                  <DotsThreeIcon weight="bold" className="size-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenVariantModal(v)} className="cursor-pointer">
                                <PencilSimpleIcon className="mr-2 size-4" />
                                Edit Variant
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateVariant(v)} className="cursor-pointer">
                                <CopyIcon className="mr-2 size-4" />
                                Duplicate SKU
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteVariant(v)} className="text-rose-600 cursor-pointer">
                                <TrashIcon className="mr-2 size-4" />
                                Archive Variant
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inventory tab */}
      {activeTab === "inventory" && (
        <Card className="animate-in fade-in duration-200 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Inventory allocations</CardTitle>
              <p className="text-[10px] text-muted-foreground">Adjust stock levels or transfer units between digital stores and local shelf pools.</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!product.variants || product.variants.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                No variants configured to assign inventory stock levels.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Variant Details</th>
                      <th className="p-4 text-center">App Stock</th>
                      <th className="p-4 text-center">Local Stock</th>
                      <th className="p-4 text-center">Reserved Stock</th>
                      <th className="p-4 text-center font-bold">Available Stock (Calculated)</th>
                      <th className="p-4 text-center">Thresholds (Min / Reorder)</th>
                      <th className="p-4 text-center">Inventory Adjustments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                    {product.variants.map((v) => {
                      const avStock = v.inventory?.availableStock ?? 0
                      const minStock = v.inventory?.minStock ?? 0
                      const reorder = v.inventory?.reorderLevel ?? 0
                      const isLowStock = avStock <= minStock

                      return (
                        <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                          <td className="p-4">
                            <span className="font-bold text-foreground block">{getVariantLabel(v.unit, v.unitValue)}</span>
                            <code className="text-[10px] font-mono text-muted-foreground">{v.sku}</code>
                          </td>
                          <td className="p-4 text-center font-mono">{v.inventory?.appStock ?? 0}</td>
                          <td className="p-4 text-center font-mono">{v.inventory?.localStock ?? 0}</td>
                          <td className="p-4 text-center font-mono text-zinc-500">{v.inventory?.reservedStock ?? 0}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Badge variant={isLowStock ? "destructive" : "secondary"} className="font-mono font-bold">
                                {avStock} Units
                              </Badge>
                              {isLowStock && (
                                <span className="inline-flex text-[9px] uppercase font-bold text-rose-500">Low Stock</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center text-zinc-500 font-mono">
                            {minStock} Min / {reorder} Reorder
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              size="sm"
                              className="text-[10px] h-7 px-2.5 cursor-pointer bg-amber-500 text-white"
                              onClick={() => router.push(`/products/inventory/${v.id}`)}
                            >
                              Manage Stock
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Stock history tab */}
      {activeTab === "activity" && (
        <Card className="animate-in fade-in duration-200 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4 flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Variant Stock Ledger logs</CardTitle>
              <p className="text-[10px] text-muted-foreground">Chronological audit ledger log history for inventory allocations.</p>
            </div>
            {product.variants && product.variants.length > 0 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="hist-var" className="text-xs font-bold shrink-0">Variant SKU:</Label>
                <select
                  id="hist-var"
                  value={selectedVariantIdForHistory}
                  onChange={(e) => setSelectedVariantIdForHistory(e.target.value)}
                  className="h-9 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {getVariantLabel(v.unit, v.unitValue)} ({v.sku})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isHistoryLoading ? (
              <div className="text-center p-12 text-muted-foreground animate-pulse text-xs">Loading ledger transaction list...</div>
            ) : !stockHistory || stockHistory.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground text-xs">
                No inventory ledger activity recorded for this variant SKU yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Date Time</th>
                      <th className="p-4">Action Type</th>
                      <th className="p-4 text-center">Change Qty</th>
                      <th className="p-4 text-center">Ledger Balance (Prev &rarr; New)</th>
                      <th className="p-4">Remarks / Reason</th>
                      <th className="p-4">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
                    {stockHistory.map((tx) => {
                      const isAddition = tx.qtyChanged > 0
                      return (
                        <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                          <td className="p-4 text-zinc-500 font-sans">{new Date(tx.createdAt).toLocaleString()}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wide">
                              {tx.type}
                            </Badge>
                          </td>
                          <td className={`p-4 text-center font-bold ${isAddition ? "text-emerald-600" : "text-rose-500"}`}>
                            {isAddition ? "+" : ""}{tx.qtyChanged} Units
                          </td>
                          <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">
                            {tx.previousStock} &rarr; {tx.newStock}
                          </td>
                          <td className="p-4 text-zinc-600 dark:text-zinc-400 font-sans italic">{tx.reason || tx.reference || "Manual Adjustment"}</td>
                          <td className="p-4 text-zinc-500 font-sans">{tx.createdBy}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* FAQs tab */}
      {activeTab === "faqs" && (
        <Card className="animate-in fade-in duration-200 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Product FAQs</CardTitle>
              <p className="text-[10px] text-muted-foreground">Manage frequently asked questions that display on customer detail screens.</p>
            </div>
            <Button size="sm" onClick={() => handleOpenFaqModal()} className="cursor-pointer bg-amber-500 text-white">
              <PlusIcon className="mr-1.5 size-4" /> Add FAQ
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {isFaqsLoading ? (
              <div className="text-center p-6 text-muted-foreground text-xs animate-pulse">Loading FAQs...</div>
            ) : !faqs || faqs.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground text-xs">
                No FAQs added for this product yet. Click &quot;Add FAQ&quot; to define questions.
              </div>
            ) : (
              <div className="space-y-4">
                {[...(faqs || [])].sort((a, b) => a.sortOrder - b.sortOrder).map((faq) => (
                  <div key={faq._id} className="p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Q: {faq.question}</span>
                        <Badge variant={faq.status === "active" ? "default" : "outline"} className="text-[9px] uppercase px-1.5 h-4">
                          {faq.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">A: {faq.answer}</p>
                      <div className="text-[9px] text-zinc-400 font-mono">Display Order: {faq.sortOrder}</div>
                    </div>
                    <div className="flex gap-2 items-start shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenFaqModal(faq)} className="cursor-pointer">
                        <PencilSimpleIcon className="size-4 text-zinc-500" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteFaq(faq._id)} className="cursor-pointer">
                        <TrashIcon className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews tab */}
      {activeTab === "reviews" && (
        <Card className="animate-in fade-in duration-200 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Customer Reviews & Ratings</CardTitle>
              <p className="text-[10px] text-muted-foreground">Approve, reject, or reply to customer testimonial feedback logs.</p>
            </div>
            <Button size="sm" onClick={() => handleOpenReviewModal()} className="cursor-pointer bg-amber-500 text-white">
              <PlusIcon className="mr-1.5 size-4" /> Add Review
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {isReviewsLoading ? (
              <div className="text-center p-6 text-muted-foreground text-xs animate-pulse">Loading reviews...</div>
            ) : !reviews || reviews.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground text-xs">
                No reviews added for this product yet. Click &quot;Add Review&quot; to configure testimonials.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                    <div className="flex justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{rev.customerName}</span>
                          <div className="flex text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <StarIcon key={i} weight="fill" className="size-3.5" />
                            ))}
                          </div>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50">
                              Verified Purchase
                            </span>
                          )}
                          <Badge
                            variant={
                              rev.status === "approved"
                                ? "default"
                                : rev.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-[9px] uppercase px-1.5 h-4"
                          >
                            {rev.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground italic mt-1 leading-relaxed">
                          &ldquo;{rev.reviewText || "No comment content"}&rdquo;
                        </p>
                        {rev.reviewImages && rev.reviewImages.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {rev.reviewImages.map((imgUrl, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={imgUrl} alt="" className="size-12 rounded object-cover border" />
                            ))}
                          </div>
                        )}
                        {rev.adminReply && (
                          <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-2.5 rounded-lg text-xs mt-2 pl-3">
                            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">Admin Response:</span>
                            <span className="text-muted-foreground leading-relaxed">{rev.adminReply}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 items-start shrink-0">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleOpenReviewModal(rev)} className="cursor-pointer">
                          <PencilSimpleIcon className="size-4 text-zinc-500" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteReview(rev._id)} className="cursor-pointer">
                          <TrashIcon className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings tab */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Settings Left side: Status, SEO, Tags */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-sans">Visibility & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <Label className="text-xs font-bold block">Current State visibility</Label>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      Toggle active status visible to the customer apps.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={product.status === "draft" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusUpdate("draft")}
                      className="cursor-pointer"
                    >
                      Draft
                    </Button>
                    <Button
                      variant={product.status === "active" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusUpdate("active")}
                      className="cursor-pointer"
                    >
                      Active
                    </Button>
                    <Button
                      variant={product.status === "inactive" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusUpdate("inactive")}
                      className="cursor-pointer"
                    >
                      Inactive
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <h3 className="text-xs font-bold text-amber-500 font-mono">SEO Configurations</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="seo-slug" className="text-xs font-bold">Slug URL Path *</Label>
                      <Input id="seo-slug" value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="seo-title" className="text-xs font-bold">Meta Title</Label>
                      <Input id="seo-title" value={seoMetaTitle} onChange={(e) => setSeoMetaTitle(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="seo-desc" className="text-xs font-bold">Meta Description</Label>
                      <Textarea id="seo-desc" value={seoMetaDescription} onChange={(e) => setSeoMetaDescription(e.target.value)} rows={3} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t">
                  <h3 className="text-xs font-bold text-amber-500 font-mono">Catalog search tags</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="tagsInput" className="text-xs font-bold">Tags / Keywords (Comma-separated)</Label>
                    <Input id="tagsInput" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="organic, fresh, milk" />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t">
                  <Button onClick={handleSaveSettings} disabled={updateProductMutation.isPending} className="cursor-pointer bg-amber-500 text-white font-bold">
                    {updateProductMutation.isPending && <CircleNotchIcon className="size-3 animate-spin mr-1" />}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Right side: Archive Panel */}
          <div className="space-y-6">
            <Card className="border-red-200 dark:border-red-900 bg-red-50/10">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-500">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.status === "archived" ? (
                  <>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-foreground block">Restore Product Master</span>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          This will restore the product and reset its status to Draft. The product and its variants will be visible in the catalog again.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full font-bold cursor-pointer border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        onClick={handleRestoreProductClick}
                        disabled={restoreProductMutation.isPending}
                      >
                        {restoreProductMutation.isPending && <CircleNotchIcon className="size-3 animate-spin mr-1" />}
                        Restore Product
                      </Button>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-red-200 dark:border-red-900">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-rose-600 block">Permanently Delete Product</span>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          WARNING: This action is irreversible. It will permanently delete this product master, all variants, and all inventory records.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        className="w-full font-bold cursor-pointer bg-rose-600 hover:bg-rose-700"
                        onClick={handlePermanentDeleteProductClick}
                        disabled={permanentlyDeleteProductMutation.isPending}
                      >
                        {permanentlyDeleteProductMutation.isPending && <CircleNotchIcon className="size-3 animate-spin mr-1" />}
                        Delete Permanently
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-foreground block">Archive Product Master</span>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        This will soft-delete the product and archive all sizes and variants, hiding them permanently from delivery and customer apps.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full font-bold cursor-pointer"
                      onClick={handleArchiveProductClick}
                    >
                      Archive Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Reusable Dialog: ReasonInputDialog for Product Archival */}
      <ReasonInputDialog
        open={archiveReasonOpen}
        onOpenChange={setArchiveReasonOpen}
        title="Archive Product Master?"
        description={`Confirming will soft-delete and archive "${product.name}" and all of its Associated SKUs. Please specify a reason code below.`}
        placeholder="e.g. Discontinued by supplier, Expiry date, low sales..."
        confirmLabel="Archive catalog item"
        onConfirm={handleArchiveConfirm}
        isLoading={deleteProductMutation.isPending}
      />

      {/* Reusable Dialog: StockOperationsDialog for Variant Adjust/Transfer */}
      {selectedVariantForOp && (
        <StockOperationsDialog
          open={stockOpOpen}
          onOpenChange={setStockOpOpen}
          mode={stockOpMode}
          variantName={getVariantLabel(selectedVariantForOp.unit, selectedVariantForOp.unitValue)}
          sku={selectedVariantForOp.sku}
          appStock={selectedVariantForOp.inventory?.appStock ?? 0}
          localStock={selectedVariantForOp.inventory?.localStock ?? 0}
          availableStock={selectedVariantForOp.inventory?.availableStock ?? 0}
          reservedStock={selectedVariantForOp.inventory?.reservedStock ?? 0}
          onConfirm={handleStockOpConfirm}
          isLoading={adjustStockMutation.isPending || transferStockMutation.isPending}
        />
      )}

      {/* Custom Variant Edit Modal */}
      <Dialog open={variantModalOpen} onOpenChange={setVariantModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingVariant ? "Modify SKU Sizing Variant" : "Add SKU Sizing Variant"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="var-unit" className="text-xs font-bold">Unit Type *</Label>
                <select
                  id="var-unit"
                  value={variantUnit}
                  onChange={(e) => handleModalUnitChange(e.target.value, variantUnitValue)}
                  className="w-full h-10 px-3 py-1.5 text-sm rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                >
                  <option value="gm">Grams (GM)</option>
                  <option value="kg">Kilograms (KG)</option>
                  <option value="litre">Litres (LITRE)</option>
                  <option value="ml">Millilitres (ML)</option>
                  <option value="pcs">Pieces (PCS)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="var-value" className="text-xs font-bold">Unit Value *</Label>
                <Input
                  id="var-value"
                  type="number"
                  step="any"
                  value={variantUnitValue}
                  onChange={(e) => handleModalUnitChange(variantUnit, e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="var-sku" className="text-xs font-bold">SKU String *</Label>
              <Input
                id="var-sku"
                value={variantSku}
                onChange={(e) => setVariantSku(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="var-mrp" className="text-xs font-bold">MRP (₹) *</Label>
                <Input
                  id="var-mrp"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={variantMrp}
                  onChange={(e) => setVariantMrp(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="var-price" className="text-xs font-bold">Selling Price (₹) *</Label>
                <Input
                  id="var-price"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={variantSellingPrice}
                  onChange={(e) => setVariantSellingPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="var-offer" className="text-xs font-bold">Offer Price (₹)</Label>
                <Input
                  id="var-offer"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={variantOfferPrice}
                  onChange={(e) => setVariantOfferPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="var-cost" className="text-xs font-bold">Cost Price (₹)</Label>
                <Input
                  id="var-cost"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={variantCostPrice}
                  onChange={(e) => setVariantCostPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="var-img" className="text-xs font-bold">Variant Image URL (Falls back to product if empty)</Label>
              <Input
                id="var-img"
                placeholder="https://example.com/image.jpg"
                value={variantPrimaryImage}
                onChange={(e) => setVariantPrimaryImage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="var-sort" className="text-xs font-bold">Sort Order</Label>
                <Input
                  id="var-sort"
                  type="number"
                  value={variantSortOrder}
                  onChange={(e) => setVariantSortOrder(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="var-default"
                  type="checkbox"
                  checked={variantIsDefault}
                  onChange={(e) => setVariantIsDefault(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <Label htmlFor="var-default" className="text-xs font-bold cursor-pointer">Set as Default variant SKU</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setVariantModalOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSaveVariant} disabled={addVariantMutation.isPending || updateVariantMutation.isPending} className="cursor-pointer bg-amber-500 text-white font-bold">
              {(addVariantMutation.isPending || updateVariantMutation.isPending) && (
                <CircleNotchIcon className="size-3 animate-spin mr-1" />
              )}
              Save SKU Specifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ modal form detail */}
      <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingFaq ? "Modify FAQ Entry" : "Create FAQ Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="qText" className="text-xs font-bold">Question String *</Label>
              <Input
                id="qText"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="e.g. Is this product organic?"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="aText" className="text-xs font-bold">Answer Text *</Label>
              <Textarea
                id="aText"
                rows={3}
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="Provide accurate specifications answer..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sort" className="text-xs font-bold">Sort Order</Label>
                <Input
                  id="sort"
                  type="number"
                  value={faqSortOrder}
                  onChange={(e) => setFaqSortOrder(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="faqStatus" className="text-xs font-bold">Status</Label>
                <select
                  id="faqStatus"
                  value={faqStatus}
                  onChange={(e) => setFaqStatus(e.target.value as any)}
                  className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setFaqModalOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSaveFaq} className="cursor-pointer bg-amber-500 text-white font-bold">Save FAQ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review details modal form */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingReview ? "Moderate & Reply to Review" : "Create Review Testimonial"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="customer" className="text-xs font-bold">Customer Name *</Label>
              <Input
                id="customer"
                value={reviewCustomerName}
                onChange={(e) => setReviewCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                disabled={!!editingReview} // keep client name locked for verification audit if moderating
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="rating" className="text-xs font-bold">Rating Stars (1-5)</Label>
                <select
                  id="rating"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(e.target.value)}
                  disabled={!!editingReview}
                  className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                >
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="revStatus" className="text-xs font-bold">Approval Status</Label>
                <select
                  id="revStatus"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="h-10 w-full px-3 py-1 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground cursor-pointer"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rText" className="text-xs font-bold">Comment Feedback</Label>
              <Textarea
                id="rText"
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Describe user testimony feedback details..."
                disabled={!!editingReview}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="is-verified"
                type="checkbox"
                checked={reviewVerified}
                onChange={(e) => setReviewVerified(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <Label htmlFor="is-verified" className="text-xs font-bold cursor-pointer">Verified Purchase Indicator</Label>
            </div>

            <div className="space-y-1.5 pt-2 border-t">
              <Label htmlFor="replyText" className="text-xs font-bold">Admin Response Reply</Label>
              <Textarea
                id="replyText"
                rows={3}
                value={reviewAdminReply}
                onChange={(e) => setReviewAdminReply(e.target.value)}
                placeholder="Write response reply back to customer app..."
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setReviewModalOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSaveReview} className="cursor-pointer bg-amber-500 text-white font-bold">Save Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
