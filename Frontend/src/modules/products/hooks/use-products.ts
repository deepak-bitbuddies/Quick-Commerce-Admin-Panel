"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { ApiErrorPayload } from "@/lib/axios"
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  addVariant,
  updateVariant,
  deleteVariant,
  duplicateVariant,
  syncStock,
  adjustVariantStock,
  transferVariantStock,
  getStockHistory,
  getVariantDetail,
  getAllFaqs,
  getProductFaqs,
  createProductFaq,
  updateProductFaq,
  deleteProductFaq,
  getAllReviews,
  getProductReviews,
  createProductReview,
  updateProductReview,
  deleteProductReview,
  getBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  setBadgeStatus,
  restoreBadge,
  getProductStats,
  restoreProduct,
  permanentlyDeleteProduct,
} from "../api/products-api"
import { productsQueryKeys, badgesQueryKeys } from "../constants/query-keys"
import type { StockTransferDirection } from "../enums/stock-transfer-direction"
import type {
  Product,
  ProductListParams,
  ProductListResult,
  CreateProductInput,
  UpdateProductInput,
  ProductVariant,
  CreateVariantInput,
  UpdateVariantInput,
  StockTransaction,
  ProductFaq,
  ProductReview,
  ProductBadge,
  ProductStats,
} from "../types/product"

export function useProductsQuery(params: ProductListParams) {
  return useQuery<ProductListResult, ApiErrorPayload>({
    queryKey: productsQueryKeys.list(params),
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
  })
}

export function useProductQuery(productId: string) {
  return useQuery<Product, ApiErrorPayload>({
    queryKey: productsQueryKeys.detail(productId),
    queryFn: () => getProduct(productId),
    enabled: !!productId,
  })
}

export function useProductStatsQuery() {
  return useQuery<ProductStats, ApiErrorPayload>({
    queryKey: ["products", "stats"],
    queryFn: () => getProductStats(),
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string
      input: UpdateProductInput
    }) => updateProduct(productId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(variables.productId) })
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, reason }: { productId: string; reason?: string }) =>
      deleteProduct(productId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
    },
  })
}

export function useRestoreProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => restoreProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ["products", "stats"] })
    },
  })
}

export function usePermanentlyDeleteProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => permanentlyDeleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ["products", "stats"] })
    },
  })
}

export function useDuplicateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => duplicateProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
    },
  })
}

export function useAddVariantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string
      input: CreateVariantInput
    }) => addVariant(productId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(variables.productId) })
    },
  })
}

export function useUpdateVariantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      variantId,
      productId,
      input,
    }: {
      variantId: string
      productId: string
      input: UpdateVariantInput
    }) => updateVariant(variantId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(variables.productId) })
    },
  })
}

export function useDeleteVariantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ variantId, productId }: { variantId: string; productId: string }) =>
      deleteVariant(variantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(variables.productId) })
    },
  })
}

export function useDuplicateVariantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ variantId, productId }: { variantId: string; productId: string }) =>
      duplicateVariant(variantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(variables.productId) })
    },
  })
}

export function useSyncStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (csvText: string) => syncStock(csvText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
    },
  })
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      variantId,
      qtyChanged,
      type,
      poolAffected,
      reason,
      reference,
    }: {
      variantId: string
      qtyChanged: number
      type: string
      poolAffected: "appStock" | "localStock"
      reason?: string
      reference?: string
    }) => adjustVariantStock(variantId, { qtyChanged, type, poolAffected, reason, reference }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.details() })
    },
  })
}

export function useTransferStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      variantId,
      qty,
      direction,
      reason,
      reference,
    }: {
      variantId: string
      qty: number
      direction: StockTransferDirection
      reason?: string
      reference?: string
    }) => transferVariantStock(variantId, { qty, direction, reason, reference }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.details() })
    },
  })
}

export function useStockHistoryQuery(variantId: string) {
  return useQuery<StockTransaction[], ApiErrorPayload>({
    queryKey: [...productsQueryKeys.all, "history", variantId],
    queryFn: () => getStockHistory(variantId),
    enabled: !!variantId,
  })
}

export function useVariantDetailQuery(variantId: string) {
  return useQuery<{ variant: ProductVariant; product: Product }, ApiErrorPayload>({
    queryKey: [...productsQueryKeys.all, "variant-detail", variantId],
    queryFn: () => getVariantDetail(variantId),
    enabled: !!variantId,
  })
}

// Product FAQs Queries and Mutations
export function useAllProductFaqsQuery() {
  return useQuery<ProductFaq[], ApiErrorPayload>({
    queryKey: [...productsQueryKeys.all, "faqs-all"],
    queryFn: () => getAllFaqs(),
  })
}

export function useProductFaqsQuery(productId: string) {
  return useQuery<ProductFaq[], ApiErrorPayload>({
    queryKey: [...productsQueryKeys.all, "faqs", productId],
    queryFn: () => getProductFaqs(productId),
    enabled: !!productId,
  })
}

export function useCreateFaqMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string
      input: { question: string; answer: string; sortOrder?: number; status?: "active" | "inactive" }
    }) => createProductFaq(productId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "faqs", variables.productId] })
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "faqs-all"] })
    },
  })
}

export function useUpdateFaqMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      faqId,
      productId,
      input,
    }: {
      faqId: string
      productId: string
      input: { question?: string; answer?: string; sortOrder?: number; status?: "active" | "inactive" }
    }) => updateProductFaq(faqId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "faqs", variables.productId] })
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "faqs-all"] })
    },
  })
}

export function useDeleteFaqMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ faqId, productId }: { faqId: string; productId: string }) =>
      deleteProductFaq(faqId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "faqs", variables.productId] })
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "faqs-all"] })
    },
  })
}

// Product Reviews Queries and Mutations
export function useAllProductReviewsQuery() {
  return useQuery<ProductReview[], ApiErrorPayload>({
    queryKey: [...productsQueryKeys.all, "reviews-all"],
    queryFn: () => getAllReviews(),
  })
}

export function useProductReviewsQuery(productId: string) {
  return useQuery<ProductReview[], ApiErrorPayload>({
    queryKey: [...productsQueryKeys.all, "reviews", productId],
    queryFn: () => getProductReviews(productId),
    enabled: !!productId,
  })
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string
      input: { customerName: string; rating: number; reviewText?: string; status?: "pending" | "approved" | "rejected" }
    }) => createProductReview(productId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "reviews", variables.productId] })
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "reviews-all"] })
    },
  })
}

export function useUpdateReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      reviewId,
      productId,
      input,
    }: {
      reviewId: string
      productId: string
      input: { customerName?: string; rating?: number; reviewText?: string; status?: "pending" | "approved" | "rejected" }
    }) => updateProductReview(reviewId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "reviews", variables.productId] })
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "reviews-all"] })
    },
  })
}

export function useDeleteReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, productId }: { reviewId: string; productId: string }) =>
      deleteProductReview(reviewId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "reviews", variables.productId] })
      queryClient.invalidateQueries({ queryKey: [...productsQueryKeys.all, "reviews-all"] })
    },
  })
}

// Product Badges Hooks
export function useBadgesQuery(params?: {
  search?: string
  status?: "active" | "inactive"
  page?: number
  pageSize?: number
}) {
  return useQuery<{ badges: ProductBadge[]; total: number }, ApiErrorPayload>({
    queryKey: badgesQueryKeys.list(params || {}),
    queryFn: () => getBadges(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateBadgeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; color: string; textColor: string }) => createBadge(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: badgesQueryKeys.lists() })
    },
  })
}

export function useUpdateBadgeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      badgeId,
      input,
    }: {
      badgeId: string
      input: { name?: string; color?: string; textColor?: string; status?: "active" | "inactive" }
    }) => updateBadge(badgeId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: badgesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: badgesQueryKeys.detail(variables.badgeId) })
    },
  })
}

export function useDeleteBadgeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (badgeId: string) => deleteBadge(badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: badgesQueryKeys.lists() })
    },
  })
}

export function useSetBadgeStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      badgeId,
      status,
    }: {
      badgeId: string
      status: "active" | "inactive"
    }) => setBadgeStatus(badgeId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: badgesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: badgesQueryKeys.detail(variables.badgeId) })
    },
  })
}

export function useRestoreBadgeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (badgeId: string) => restoreBadge(badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: badgesQueryKeys.lists() })
    },
  })
}
