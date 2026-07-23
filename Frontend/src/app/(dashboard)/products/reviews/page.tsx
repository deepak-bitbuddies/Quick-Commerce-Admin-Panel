"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/page-header"

import {
  useAllProductReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useProductsQuery,
} from "@/modules/products/hooks/use-products"
import type { ProductReview } from "@/modules/products/types/product"

export default function GlobalReviewsPage() {
  const router = useRouter()

  // Queries
  const { data: reviews, isLoading: isReviewsLoading } = useAllProductReviewsQuery()
  const { data: productsData } = useProductsQuery({ page: 1, pageSize: 500 })
  const products = productsData?.products || []

  // Mutations
  const createReviewMutation = useCreateReviewMutation()
  const updateReviewMutation = useUpdateReviewMutation()
  const deleteReviewMutation = useDeleteReviewMutation()

  // Review Modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null)
  const [reviewProductId, setReviewProductId] = useState("")
  const [reviewCustomerName, setReviewCustomerName] = useState("")
  const [reviewRating, setReviewRating] = useState("5")
  const [reviewText, setReviewText] = useState("")
  const [reviewStatus, setReviewStatus] = useState<"pending" | "approved" | "rejected">("approved")

  // Filter state
  const [searchFilter, setSearchFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  const handleOpenReviewModal = (review?: ProductReview) => {
    if (review) {
      setEditingReview(review)
      setReviewProductId(typeof review.productId === "object" ? review.productId._id : review.productId)
      setReviewCustomerName(review.customerName)
      setReviewRating(String(review.rating))
      setReviewText(review.reviewText)
      setReviewStatus(review.status)
    } else {
      setEditingReview(null)
      setReviewProductId(products[0]?.id || "")
      setReviewCustomerName("")
      setReviewRating("5")
      setReviewText("")
      setReviewStatus("approved")
    }
    setReviewModalOpen(true)
  }

  const handleSaveReview = () => {
    if (!reviewProductId) {
      toast.error("Please select a product first")
      return
    }
    if (!reviewCustomerName.trim()) {
      toast.error("Please enter a customer name")
      return
    }

    const payload = {
      customerName: reviewCustomerName,
      rating: Number(reviewRating),
      reviewText: reviewText,
      status: reviewStatus,
    }

    if (editingReview) {
      updateReviewMutation.mutate(
        { reviewId: editingReview._id, productId: reviewProductId, input: payload },
        {
          onSuccess: () => {
            toast.success("Review updated successfully")
            setReviewModalOpen(false)
          },
          onError: () => {
            toast.error("Failed to update review")
          }
        }
      )
    } else {
      createReviewMutation.mutate(
        { productId: reviewProductId, input: payload },
        {
          onSuccess: () => {
            toast.success("Review created successfully")
            setReviewModalOpen(false)
          },
          onError: () => {
            toast.error("Failed to create review")
          }
        }
      )
    }
  }

  const handleDeleteReview = (reviewId: string, prodId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(
        { reviewId, productId: prodId },
        {
          onSuccess: () => {
            toast.success("Review deleted successfully")
          },
          onError: () => {
            toast.error("Failed to delete review")
          }
        }
      )
    }
  }

  const handleUpdateReviewStatus = (reviewId: string, prodId: string, status: "pending" | "approved" | "rejected") => {
    updateReviewMutation.mutate(
      { reviewId, productId: prodId, input: { status } },
      {
        onSuccess: () => {
          toast.success(`Review status set to ${status}`)
        },
        onError: () => {
          toast.error("Failed to update status")
        }
      }
    )
  }

  // Filter reviews
  const filteredReviews = reviews?.filter((rev) => {
    const productName = typeof rev.productId === "object" ? rev.productId.name : ""
    const matchesSearch =
      productName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      rev.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      rev.reviewText.toLowerCase().includes(searchFilter.toLowerCase())
    
    const matchesStatus = statusFilter === "all" ? true : rev.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Reviews"
        description="Audit, approve, reject, or delete user reviews left on your store catalog products."
        primaryAction={{
          label: "Add Test Review",
          onClick: () => handleOpenReviewModal(),
          icon: <PlusIcon />,
        }}
      />

      <div className="flex gap-4 items-center flex-wrap">
        <Input
          placeholder="Filter reviews by product, customer, or keyword..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="max-w-md bg-white dark:bg-zinc-950"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-9 px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Review Directory</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          {isReviewsLoading ? (
            <div className="text-center p-8 animate-pulse text-sm text-muted-foreground">Loading catalog reviews...</div>
          ) : filteredReviews && filteredReviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                <thead>
                  <tr className="text-muted-foreground font-semibold text-left bg-zinc-50/50 dark:bg-zinc-900/50">
                    <th className="p-4 w-[25%]">Product Reference</th>
                    <th className="p-4 w-[50%]">Review Details</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center w-[25%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredReviews.map((rev) => {
                    const prodId = typeof rev.productId === "object" ? rev.productId._id : rev.productId
                    const prodName = typeof rev.productId === "object" ? rev.productId.name : "Unknown Product"
                    return (
                      <tr key={rev._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                        <td className="p-4 align-top">
                          <span className="font-bold text-foreground block">{prodName}</span>
                          <button
                            onClick={() => router.push(`/products/${prodId}`)}
                            className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            <EyeIcon className="size-3" /> View Detail Page
                          </button>
                        </td>
                        <td className="p-4 space-y-1 align-top">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-foreground text-sm block">{rev.customerName}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(rev.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-0.5 text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <StarIcon key={s} weight={s <= rev.rating ? "fill" : "regular"} className="size-3.5" />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground italic leading-relaxed pt-1">
                            "{rev.reviewText || "No feedback text left by customer."}"
                          </p>
                        </td>
                        <td className="p-4 text-center align-top">
                          <Badge
                            variant={
                              rev.status === "approved"
                                ? "default"
                                : rev.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className="capitalize"
                          >
                            {rev.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center align-top space-x-1 space-y-1">
                          {rev.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateReviewStatus(rev._id, prodId, "approved")}
                                className="border-emerald-200 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-950/20 cursor-pointer"
                              >
                                <CheckCircleIcon className="size-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateReviewStatus(rev._id, prodId, "rejected")}
                                className="border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-950/20 cursor-pointer"
                              >
                                <XCircleIcon className="size-3.5 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleOpenReviewModal(rev)} className="cursor-pointer">
                            <PencilSimpleIcon className="size-3.5 mr-1" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteReview(rev._id, prodId)} className="text-destructive hover:bg-destructive/5 hover:text-destructive cursor-pointer">
                            <TrashIcon className="size-3.5 mr-1" /> Delete
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No reviews match your filter criteria or none have been added. Click "Add Test Review" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReview ? "Edit Review" : "Add Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="global-rev-product">Product Reference</Label>
              <select
                id="global-rev-product"
                value={reviewProductId}
                onChange={(e) => setReviewProductId(e.target.value)}
                disabled={!!editingReview}
                className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="global-rev-name">Customer Name</Label>
              <Input
                id="global-rev-name"
                value={reviewCustomerName}
                onChange={(e) => setReviewCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="global-rev-rating">Star Rating (1 - 5)</Label>
                <select
                  id="global-rev-rating"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="global-rev-status">Status</Label>
                <select
                  id="global-rev-status"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="global-rev-text">Review Text</Label>
              <Textarea
                id="global-rev-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="e.g. Really loved the quality!"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveReview}>Save Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
