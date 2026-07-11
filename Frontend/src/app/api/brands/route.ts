import { NextResponse, type NextRequest } from "next/server"

import { BackendRoute } from "@/constants"
import { BackendRequestError, backendFetch, backendFetchWithMeta } from "@/lib/backend"
import type { Brand } from "@/modules/brands"

const FORWARDED_LIST_PARAMS = ["page", "pageSize", "search", "status"] as const

/**
 * Proxies the `super_admin`-gated `GET /api/v1/admin/brands` list endpoint.
 * A session already exists by the time this is called (unlike
 * `app/api/auth/login/route.ts`), so this uses `backendFetchWithMeta`
 * directly rather than hand-parsing the envelope — `backendFetch` alone
 * would drop the `meta.total/page/pageSize` pagination info this list needs.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const forwarded = new URLSearchParams()

  for (const key of FORWARDED_LIST_PARAMS) {
    const value = searchParams.get(key)
    if (value) {
      forwarded.set(key, value)
    }
  }

  const queryString = forwarded.toString()
  const path = queryString
    ? `${BackendRoute.AdminBrands}?${queryString}`
    : BackendRoute.AdminBrands

  try {
    const { data, meta } = await backendFetchWithMeta<Brand[]>(path)
    return NextResponse.json({ data, meta })
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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""

  if (!name) {
    return NextResponse.json(
      { message: "Brand name is required." },
      { status: 400 }
    )
  }

  try {
    const brand = await backendFetch<Brand>(BackendRoute.AdminBrands, {
      method: "POST",
      body: JSON.stringify({
        name,
        logo: body?.logo,
        description: body?.description,
      }),
    })
    return NextResponse.json({ data: brand }, { status: 201 })
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
