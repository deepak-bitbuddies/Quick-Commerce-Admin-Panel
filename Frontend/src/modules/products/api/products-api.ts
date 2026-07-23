import { api } from "@/lib/axios"
import type {
  Product,
  ProductListParams,
  ProductListResult,
  CreateProductInput,
  UpdateProductInput,
  ProductVariant,
  CreateVariantInput,
  UpdateVariantInput,
  StockSyncResult,
  StockTransaction,
  ProductFaq,
  ProductReview,
  ProductBadge,
  ProductStats,
} from "../types/product"

/**
 * Client-side calls against Next.js `/api/products*` proxy route.
 */
export async function getProducts(
  params: ProductListParams = {}
): Promise<ProductListResult> {
  const { data } = await api.get<{
    data: Product[]
    meta: ProductListResult["meta"]
  }>("/products", { params })
  return { products: data.data, meta: data.meta }
}

export async function getProduct(productId: string): Promise<Product> {
  const { data } = await api.get<{ data: Product }>(`/products/${productId}`)
  return data.data
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data } = await api.post<{ data: Product }>("/products", input)
  return data.data
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput
): Promise<Product> {
  const { data } = await api.patch<{ data: Product }>(
    `/products/${productId}`,
    input
  )
  return data.data
}

export async function deleteProduct(productId: string, reason?: string): Promise<void> {
  await api.delete(`/products/${productId}`, {
    params: { reason },
  })
}

export async function duplicateProduct(productId: string): Promise<Product> {
  const { data } = await api.post<{ data: Product }>(`/products/${productId}/duplicate`)
  return data.data
}

export async function addVariant(
  productId: string,
  input: CreateVariantInput
): Promise<ProductVariant> {
  const { data } = await api.post<{ data: ProductVariant }>(
    `/products/${productId}/variants`,
    input
  )
  return data.data
}

export async function updateVariant(
  variantId: string,
  input: UpdateVariantInput
): Promise<ProductVariant> {
  const { data } = await api.patch<{ data: ProductVariant }>(
    `/products/variants/${variantId}`,
    input
  )
  return data.data
}

export async function deleteVariant(variantId: string): Promise<void> {
  await api.delete(`/products/variants/${variantId}`)
}

export async function duplicateVariant(variantId: string): Promise<ProductVariant> {
  const { data } = await api.post<{ data: ProductVariant }>(`/products/variants/${variantId}/duplicate`)
  return data.data
}

export async function syncStock(csvText: string): Promise<StockSyncResult> {
  const { data } = await api.post<{ data: StockSyncResult }>("/products/sync-stock", { csvText })
  return data.data
}

export async function adjustVariantStock(
  variantId: string,
  input: { qtyChanged: number; type: string; poolAffected: "appStock" | "localStock"; reason?: string; reference?: string }
): Promise<ProductVariant> {
  const { data } = await api.post<{ data: ProductVariant }>(
    `/products/variants/${variantId}/adjust-stock`,
    input
  )
  return data.data
}

export async function transferVariantStock(
  variantId: string,
  input: { qty: number; direction: "APP_TO_LOCAL" | "LOCAL_TO_APP"; reason?: string; reference?: string }
): Promise<ProductVariant> {
  const { data } = await api.post<{ data: ProductVariant }>(
    `/products/variants/${variantId}/transfer-stock`,
    { qty: input.qty, reason: input.reason, reference: input.reference },
    { params: { direction: input.direction } }
  )
  return data.data
}

export async function getStockHistory(variantId: string): Promise<StockTransaction[]> {
  const { data } = await api.get<{ data: StockTransaction[] }>(
    `/products/variants/${variantId}/stock-history`
  )
  return data.data
}

export async function getVariantDetail(
  variantId: string
): Promise<{ variant: ProductVariant; product: Product }> {
  const { data } = await api.get<{ data: { variant: ProductVariant; product: Product } }>(
    `/products/variants/${variantId}`
  )
  return data.data
}

// Product FAQs API
export async function getAllFaqs(): Promise<ProductFaq[]> {
  const { data } = await api.get<{ data: ProductFaq[] }>("/products/faqs")
  return data.data
}

export async function getProductFaqs(productId: string): Promise<ProductFaq[]> {
  const { data } = await api.get<{ data: ProductFaq[] }>(`/products/${productId}/faqs`)
  return data.data
}

export async function createProductFaq(
  productId: string,
  input: { question: string; answer: string; sortOrder?: number; status?: "active" | "inactive" }
): Promise<ProductFaq> {
  const { data } = await api.post<{ data: ProductFaq }>(`/products/${productId}/faqs`, input)
  return data.data
}

export async function updateProductFaq(
  faqId: string,
  input: { question?: string; answer?: string; sortOrder?: number; status?: "active" | "inactive" }
): Promise<ProductFaq> {
  const { data } = await api.patch<{ data: ProductFaq }>(`/products/faqs/${faqId}`, input)
  return data.data
}

export async function deleteProductFaq(faqId: string): Promise<void> {
  await api.delete(`/products/faqs/${faqId}`)
}

// Product Reviews API
export async function getAllReviews(): Promise<ProductReview[]> {
  const { data } = await api.get<{ data: ProductReview[] }>("/products/reviews")
  return data.data
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const { data } = await api.get<{ data: ProductReview[] }>(`/products/${productId}/reviews`)
  return data.data
}

export async function createProductReview(
  productId: string,
  input: { customerName: string; rating: number; reviewText?: string; status?: "pending" | "approved" | "rejected" }
): Promise<ProductReview> {
  const { data } = await api.post<{ data: ProductReview }>(`/products/${productId}/reviews`, input)
  return data.data
}

export async function updateProductReview(
  reviewId: string,
  input: { customerName?: string; rating?: number; reviewText?: string; status?: "pending" | "approved" | "rejected" }
): Promise<ProductReview> {
  const { data } = await api.patch<{ data: ProductReview }>(`/products/reviews/${reviewId}`, input)
  return data.data
}

export async function deleteProductReview(reviewId: string): Promise<void> {
  await api.delete(`/products/reviews/${reviewId}`)
}

// Product Badges API
export async function getBadges(params?: {
  search?: string
  status?: "active" | "inactive"
  page?: number
  pageSize?: number
}): Promise<{ badges: ProductBadge[]; total: number }> {
  const { data } = await api.get<{
    data: ProductBadge[]
    meta?: { total: number }
  }>("/badges", { params })
  return { badges: data.data, total: data.meta?.total ?? data.data.length }
}

export async function createBadge(input: {
  name: string
  color: string
  textColor: string
}): Promise<ProductBadge> {
  const { data } = await api.post<{ data: ProductBadge }>("/badges", input)
  return data.data
}

export async function updateBadge(
  badgeId: string,
  input: {
    name?: string
    color?: string
    textColor?: string
    status?: "active" | "inactive"
  }
): Promise<ProductBadge> {
  const { data } = await api.patch<{ data: ProductBadge }>(`/badges/${badgeId}`, input)
  return data.data
}

export async function deleteBadge(badgeId: string): Promise<void> {
  await api.delete(`/badges/${badgeId}`)
}

export async function setBadgeStatus(
  badgeId: string,
  status: "active" | "inactive"
): Promise<ProductBadge> {
  const { data } = await api.patch<{ data: ProductBadge }>(`/badges/${badgeId}/status`, { status })
  return data.data
}

export async function restoreBadge(badgeId: string): Promise<ProductBadge> {
  const { data } = await api.post<{ data: ProductBadge }>(`/badges/${badgeId}/restore`)
  return data.data
}

export async function getProductStats(): Promise<ProductStats> {
  const { data } = await api.get<{ data: ProductStats }>("/products/stats")
  return data.data
}

export async function restoreProduct(productId: string): Promise<void> {
  await api.post(`/products/${productId}/restore`)
}

export async function permanentlyDeleteProduct(productId: string): Promise<void> {
  await api.delete(`/products/${productId}/permanent`)
}
