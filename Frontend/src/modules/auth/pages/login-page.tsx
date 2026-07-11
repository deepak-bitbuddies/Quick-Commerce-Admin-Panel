import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { StorefrontIcon } from "@phosphor-icons/react/dist/ssr"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "../components/login-form"

export async function LoginPage() {
  const t = await getTranslations("Login")

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <StorefrontIcon weight="fill" className="size-5 text-primary" />
          Quick Commerce
        </div>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
