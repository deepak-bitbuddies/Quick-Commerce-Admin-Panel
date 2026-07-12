import { NextResponse, type NextRequest } from "next/server"

import { adminSettingsGroupRoute } from "@/constants"
import { BackendRequestError, backendFetch } from "@/lib/backend"

interface RouteContext {
  params: Promise<{ group: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { group } = await params
  const body = await request.json().catch(() => null)

  if (!body) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    )
  }

  try {
    const updated = await backendFetch<Record<string, unknown>>(adminSettingsGroupRoute(group), {
      method: "PATCH",
      body: JSON.stringify(body),
    })
    return NextResponse.json({ data: updated })
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
