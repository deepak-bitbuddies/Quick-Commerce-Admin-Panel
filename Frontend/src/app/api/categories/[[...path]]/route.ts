import { NextResponse, type NextRequest } from "next/server"

import { BackendRequestError, backendFetch, backendFetchWithMeta } from "@/lib/backend"

interface RouteContext {
  params: Promise<{ path?: string[] }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { path } = await params
  const pathSegment = path ? `/${path.join("/")}` : ""
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const backendPath = `/api/v1/admin/categories${pathSegment}${queryString ? `?${queryString}` : ""}`

  try {
    const { data, meta } = await backendFetchWithMeta<unknown>(backendPath)
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

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { path } = await params
  const pathSegment = path ? `/${path.join("/")}` : ""
  const body = await request.json().catch(() => ({}))
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const backendPath = `/api/v1/admin/categories${pathSegment}${queryString ? `?${queryString}` : ""}`

  try {
    const data = await backendFetch<unknown>(backendPath, {
      method: "POST",
      body: JSON.stringify(body),
    })
    return NextResponse.json({ data })
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
  const { path } = await params
  const pathSegment = path ? `/${path.join("/")}` : ""
  const body = await request.json().catch(() => ({}))
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const backendPath = `/api/v1/admin/categories${pathSegment}${queryString ? `?${queryString}` : ""}`

  try {
    const data = await backendFetch<unknown>(backendPath, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
    return NextResponse.json({ data })
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

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { path } = await params
  const pathSegment = path ? `/${path.join("/")}` : ""
  const { searchParams } = new URL(request.url)
  const reason = searchParams.get("reason") || ""
  const backendPath = `/api/v1/admin/categories${pathSegment}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`

  try {
    const data = await backendFetch<unknown>(backendPath, {
      method: "DELETE",
    })
    return NextResponse.json({ data })
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
