import { CategoryForm } from "@/modules/categories"

interface PageProps {
  params: Promise<{ nodeId: string }>
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { nodeId } = await params
  return <CategoryForm nodeId={nodeId} />
}
