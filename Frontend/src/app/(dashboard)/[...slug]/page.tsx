import { ComingSoon } from "@/components/feedback"

function titleFromSlug(slug: string[]) {
  return slug[slug.length - 1]
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  return <ComingSoon title={titleFromSlug(slug)} />
}
