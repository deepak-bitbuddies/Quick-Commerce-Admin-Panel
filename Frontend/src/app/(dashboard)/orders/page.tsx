import { getTranslations } from "next-intl/server"

import { ComingSoon } from "@/components/feedback"

export default async function OrdersPage() {
  const t = await getTranslations("Nav")
  return <ComingSoon title={t("orders")} />
}
