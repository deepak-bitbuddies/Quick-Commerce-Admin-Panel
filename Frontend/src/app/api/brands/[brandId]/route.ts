import { NextResponse, type NextRequest } from "next/server"

import { adminBrandRoute } from "@/constants"
import { BackendRequestError, backendFetch } from "@/lib/backend"
import type { Brand } from "@/modules/brands"

interface RouteContext {
  params: Promise<{ brandId: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { brandId } = await params

  try {
    const brand = await backendFetch<Brand>(adminBrandRoute(brandId))
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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { brandId } = await params
  const body = await request.json().catch(() => null)

  if (!body) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    )
  }

  try {
    const brand = await backendFetch<Brand>(adminBrandRoute(brandId), {
      method: "PATCH",
      body: JSON.stringify({
        name: body.name,
        logo: body.logo,
        description: body.description,
      }),
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
