import { NextResponse, type NextRequest } from "next/server"

import { adminBrandStatusRoute } from "@/constants"
import { BackendRequestError, backendFetch } from "@/lib/backend"
import type { Brand, BrandStatus } from "@/modules/brands"

interface RouteContext {
  params: Promise<{ brandId: string }>
}

// Kept as an inline literal check (rather than importing the module's
// runtime `BRAND_STATUSES` constant) so this server Route Handler only ever
// pulls a type-only import from `@/modules/brands` — importing a runtime
// value from the module's barrel would also pull in its client-component
// exports (`BrandsListPage` et al.) into this server-only file's module graph.
function isBrandStatus(value: unknown): value is BrandStatus {
  return value === "active" || value === "inactive"
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { brandId } = await params
  const body = await request.json().catch(() => null)

  if (!isBrandStatus(body?.status)) {
    return NextResponse.json(
      { message: "A valid status ('active' or 'inactive') is required." },
      { status: 400 }
    )
  }

  try {
    const brand = await backendFetch<Brand>(adminBrandStatusRoute(brandId), {
      method: "PATCH",
      body: JSON.stringify({ status: body.status }),
    })
    return NextResponse.json({ data: brand })
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { message: "Could not reach the backend. Is it running?" },
      { status: 502 }
    )
  }
}
