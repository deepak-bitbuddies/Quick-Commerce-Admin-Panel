import { ProductCreationWizard } from "@/modules/products"

export default function NewProductPage() {
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <ProductCreationWizard />
    </div>
  )
}
