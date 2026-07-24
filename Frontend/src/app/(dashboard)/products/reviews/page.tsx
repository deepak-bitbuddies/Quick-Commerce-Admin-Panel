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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
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

        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter((val ?? "all") as typeof statusFilter)}
          items={[
            { value: "all", label: "All Statuses" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        >
          <SelectTrigger className="h-9 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Review Directory</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          {isReviewsLoading ? (
            <div className="text-center p-8 animate-pulse text-sm text-muted-foreground">Loading catalog reviews...</div>
          ) : filteredReviews && filteredReviews.length > 0 ? (
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableHead className="p-4 w-[25%]">Product Reference</TableHead>
                  <TableHead className="p-4 w-[50%]">Review Details</TableHead>
                  <TableHead className="p-4 text-center">Status</TableHead>
                  <TableHead className="p-4 text-center w-[25%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((rev) => {
                  const prodId = typeof rev.productId === "object" ? rev.productId._id : rev.productId
                  const prodName = typeof rev.productId === "object" ? rev.productId.name : "Unknown Product"
                  return (
                    <TableRow key={rev._id}>
                      <TableCell className="p-4 align-top whitespace-normal">
                        <span className="font-bold text-foreground block">{prodName}</span>
                        <button
                          onClick={() => router.push(`/products/${prodId}`)}
                          className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <EyeIcon className="size-3" /> View Detail Page
                        </button>
                      </TableCell>
                      <TableCell className="p-4 space-y-1 align-top whitespace-normal">
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
                      </TableCell>
                      <TableCell className="p-4 text-center align-top">
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
                      </TableCell>
                      <TableCell className="p-4 text-center align-top space-x-1 space-y-1 whitespace-normal">
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
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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
              <Select
                value={reviewProductId}
                onValueChange={(val) => setReviewProductId(val ?? reviewProductId)}
                disabled={!!editingReview}
                items={products.map((p) => ({ value: p.id, label: p.name }))}
              >
                <SelectTrigger id="global-rev-product" className="w-full">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Select
                  value={reviewRating}
                  onValueChange={(val) => setReviewRating(val ?? reviewRating)}
                  items={[
                    { value: "5", label: "5 Stars" },
                    { value: "4", label: "4 Stars" },
                    { value: "3", label: "3 Stars" },
                    { value: "2", label: "2 Stars" },
                    { value: "1", label: "1 Star" },
                  ]}
                >
                  <SelectTrigger id="global-rev-rating" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="global-rev-status">Status</Label>
                <Select
                  value={reviewStatus}
                  onValueChange={(val) => setReviewStatus((val ?? reviewStatus) as typeof reviewStatus)}
                  items={[
                    { value: "approved", label: "Approved" },
                    { value: "pending", label: "Pending" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                >
                  <SelectTrigger id="global-rev-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
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
