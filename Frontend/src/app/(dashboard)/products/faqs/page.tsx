"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  QuestionIcon,
  TagIcon,
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
  useAllProductFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useProductsQuery,
} from "@/modules/products/hooks/use-products"
import type { ProductFaq } from "@/modules/products/types/product"

export default function GlobalFaqsPage() {
  const router = useRouter()

  // Queries
  const { data: faqs, isLoading: isFaqsLoading } = useAllProductFaqsQuery()
  const { data: productsData } = useProductsQuery({ page: 1, pageSize: 500 })
  const products = productsData?.products || []

  // Mutations
  const createFaqMutation = useCreateFaqMutation()
  const updateFaqMutation = useUpdateFaqMutation()
  const deleteFaqMutation = useDeleteFaqMutation()

  // FAQ Modal states
  const [faqModalOpen, setFaqModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<ProductFaq | null>(null)
  const [faqProductId, setFaqProductId] = useState("")
  const [faqQuestion, setFaqQuestion] = useState("")
  const [faqAnswer, setFaqAnswer] = useState("")
  const [faqSortOrder, setFaqSortOrder] = useState("0")
  const [faqStatus, setFaqStatus] = useState<"active" | "inactive">("active")

  // Filter state
  const [searchFilter, setSearchFilter] = useState("")

  const handleOpenFaqModal = (faq?: ProductFaq) => {
    if (faq) {
      setEditingFaq(faq)
      setFaqProductId(typeof faq.productId === "object" ? faq.productId._id : faq.productId)
      setFaqQuestion(faq.question)
      setFaqAnswer(faq.answer)
      setFaqSortOrder(String(faq.sortOrder))
      setFaqStatus(faq.status)
    } else {
      setEditingFaq(null)
      setFaqProductId(products[0]?.id || "")
      setFaqQuestion("")
      setFaqAnswer("")
      setFaqSortOrder("0")
      setFaqStatus("active")
    }
    setFaqModalOpen(true)
  }

  const handleSaveFaq = () => {
    if (!faqProductId) {
      toast.error("Please select a product first")
      return
    }
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast.error("Please enter both question and answer")
      return
    }

    const payload = {
      question: faqQuestion,
      answer: faqAnswer,
      sortOrder: Number(faqSortOrder) || 0,
      status: faqStatus,
    }

    if (editingFaq) {
      updateFaqMutation.mutate(
        { faqId: editingFaq._id, productId: faqProductId, input: payload },
        {
          onSuccess: () => {
            toast.success("FAQ updated successfully")
            setFaqModalOpen(false)
          },
          onError: () => {
            toast.error("Failed to update FAQ")
          }
        }
      )
    } else {
      createFaqMutation.mutate(
        { productId: faqProductId, input: payload },
        {
          onSuccess: () => {
            toast.success("FAQ created successfully")
            setFaqModalOpen(false)
          },
          onError: () => {
            toast.error("Failed to create FAQ")
          }
        }
      )
    }
  }

  const handleDeleteFaq = (faqId: string, prodId: string) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      deleteFaqMutation.mutate(
        { faqId, productId: prodId },
        {
          onSuccess: () => {
            toast.success("FAQ deleted successfully")
          },
          onError: () => {
            toast.error("Failed to delete FAQ")
          }
        }
      )
    }
  }

  // Filter FAQs based on product name or question
  const filteredFaqs = faqs?.filter((faq) => {
    const productName = typeof faq.productId === "object" ? faq.productId.name : ""
    const matchesSearch =
      productName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      faq.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchFilter.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product FAQs"
        description="View and manage frequently asked questions for all products in your store catalog."
        primaryAction={{
          label: "Add FAQ",
          onClick: () => handleOpenFaqModal(),
          icon: <PlusIcon />,
        }}
      />

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Filter FAQs by product name, question or keyword..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="max-w-md bg-white dark:bg-zinc-950"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">FAQ Directory</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          {isFaqsLoading ? (
            <div className="text-center p-8 animate-pulse text-sm text-muted-foreground">Loading catalog FAQs...</div>
          ) : filteredFaqs && filteredFaqs.length > 0 ? (
            <>
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                    <TableHead className="p-4 w-[25%]">Product Reference</TableHead>
                    <TableHead className="p-4 w-[60%]">FAQ Details</TableHead>
                    <TableHead className="p-4 text-center">Status</TableHead>
                    <TableHead className="p-4 text-center w-[15%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaqs.map((faq) => {
                    const prodId = typeof faq.productId === "object" ? faq.productId._id : faq.productId
                    const prodName = typeof faq.productId === "object" ? faq.productId.name : "Unknown Product"
                    return (
                      <TableRow key={faq._id}>
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
                          <div className="flex gap-1.5 items-start">
                            <QuestionIcon className="size-4 text-amber-500 shrink-0 mt-0.5" />
                            <span className="font-semibold text-foreground text-sm">{faq.question}</span>
                          </div>
                          <p className="text-muted-foreground pl-5 leading-relaxed">{faq.answer}</p>
                          <div className="pl-5 pt-1">
                            <Badge variant="outline" className="text-[9px] font-mono">Order: {faq.sortOrder}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-center align-top">
                          <Badge variant={faq.status === "active" ? "default" : "secondary"} className="capitalize">
                            {faq.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4 text-center align-top space-x-1 whitespace-normal">
                          <Button variant="outline" size="sm" onClick={() => handleOpenFaqModal(faq)} className="cursor-pointer">
                            <PencilSimpleIcon className="size-3.5 mr-1" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteFaq(faq._id, prodId)} className="text-destructive hover:bg-destructive/5 hover:text-destructive cursor-pointer">
                            <TrashIcon className="size-3.5 mr-1" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No FAQs match your filter criteria or none have been added. Click "Add FAQ" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="global-faq-product">Product Reference</Label>
              <Select
                value={faqProductId}
                onValueChange={(val) => setFaqProductId(val ?? faqProductId)}
                disabled={!!editingFaq}
                items={products.map((p) => ({ value: p.id, label: p.name }))}
              >
                <SelectTrigger id="global-faq-product" className="w-full">
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
              <Label htmlFor="global-faq-question">Question</Label>
              <Input
                id="global-faq-question"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="e.g. Is this product organic?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="global-faq-answer">Answer</Label>
              <Textarea
                id="global-faq-answer"
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="e.g. Yes, it is 100% organic and locally sourced."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="global-faq-sort">Sort Order</Label>
                <Input
                  id="global-faq-sort"
                  type="number"
                  value={faqSortOrder}
                  onChange={(e) => setFaqSortOrder(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="global-faq-status">Status</Label>
                <Select
                  value={faqStatus}
                  onValueChange={(val) => setFaqStatus((val ?? faqStatus) as typeof faqStatus)}
                  items={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                >
                  <SelectTrigger id="global-faq-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFaq}>Save FAQ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
