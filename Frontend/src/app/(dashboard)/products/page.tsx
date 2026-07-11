import { getTranslations } from "next-intl/server"

import { ComingSoon } from "@/components/feedback"

export default async function ProductsPage() {
  const t = await getTranslations("Nav")
  return <ComingSoon title={t("products")} />
}
