import { getTranslations } from "next-intl/server"

import { ComingSoon } from "@/components/coming-soon"

export default async function ProductsPage() {
  const t = await getTranslations("Nav")
  return <ComingSoon title={t("products")} />
}
